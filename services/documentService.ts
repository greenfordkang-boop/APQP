
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { TaskDocument, FmeaRow, FmeaData } from '../types';

const MOCK_STORAGE_KEY = 'mock_task_documents';
const MOCK_FMEA_DATA_KEY = 'mock_fmea_data_';

// File upload security settings
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'text/plain'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Helper to simulate network delay for mock mode
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Validate file before upload
const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다. 허용된 형식: PDF, 이미지(JPG, PNG, GIF, WEBP), Excel, CSV, JSON, TXT`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과할 수 없습니다. (현재: ${(file.size / 1024 / 1024).toFixed(2)}MB)`
    };
  }

  return { valid: true };
};

export const uploadDocument = async (taskId: number, file: File): Promise<TaskDocument | null> => {
  // Validate file first
  const validation = validateFile(file);
  if (!validation.valid) {
    alert(validation.error);
    return null;
  }

  // [3] taskId 가드: 없거나 유효하지 않으면 업로드 차단
  const tid = taskId == null ? NaN : Number(taskId);
  if (!Number.isInteger(tid) || tid < 1) {
    alert('Task 선택/생성 후 업로드해 주세요.');
    return null;
  }

  // Helper function for mock upload
  const uploadToMock = async (): Promise<TaskDocument> => {
    await delay(800);

    // Convert file to Base64 for preview support in mock mode
    const fileDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const mockDoc: TaskDocument = {
      id: Math.random().toString(36).substr(2, 9),
      task_id: tid,
      name: file.name,
      url: fileDataUrl, // Store as data URL for preview
      size: file.size,
      type: file.type,
      created_at: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify([...existing, mockDoc]));
    } catch (e) {
        alert('브라우저 저장공간이 부족하여 파일 내용을 저장하지 못했습니다. (목록에는 표시됩니다)');
    }
    return mockDoc;
  };

  if (isSupabaseConfigured()) {
    const bucket = 'project-files';

    // [2] 입력값 로그 (재현/디버깅)
    console.log('[Upload] inputs:', {
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      taskId: tid,
      bucket,
    });

    try {
      // [3] env 로딩 확인 (Vite: VITE_* 만 노출)
      console.log('[Upload] env check:', {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '(set)' : 'undefined',
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '(set)' : 'undefined',
      });

      // [3] documents.task_id FK → tasks.id: DB에 해당 task 존재하는지 SELECT로 확인
      const { data: taskRow, error: taskErr } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', tid)
        .maybeSingle();
      if (taskErr || !taskRow) {
        console.error('[Upload] task not found in DB:', { taskId: tid, error: taskErr });
        alert('해당 Task가 DB에 없습니다. 프로젝트/태스크를 Supabase에 먼저 저장한 뒤 업로드해 주세요.');
        return null;
      }

      // 1. Upload to Storage Bucket 'project-files'
      // [4] path: 확장자 sanitize, UUID 기반으로 충돌/한글·특수문자 회피
      const rawExt = (file.name.split('.').pop() || 'bin').toLowerCase();
      const ext = rawExt.replace(/[^a-z0-9]/g, '') || 'bin';
      const unique = typeof crypto !== 'undefined' && crypto.randomUUID
        ? `${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
        : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const filePath = `${tid}/${unique}.${ext}`;

      console.log('[Upload] path:', filePath);

      // [4] file은 File(Blob) 사용, upsert: true, contentType 명시
      const uploadOpts = {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      };

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, uploadOpts);

      // [2] Supabase 응답 data/error 전체 출력
      console.log('[Upload] storage response:', { data: uploadData, error: uploadError });

      if (uploadError) {
        console.error('[Upload] Storage upload error (full):', uploadError);
        throw new Error(`Storage: ${uploadError.message} (${uploadError.name || ''})`);
      }

      console.log('[Upload] Storage OK, path:', filePath);

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
      console.log('[Upload] publicUrl:', publicUrl);

      // 3. Insert Metadata into 'documents'
      const docData: Partial<TaskDocument> = {
        task_id: tid,
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
      };

      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert(docData)
        .select()
        .single();

      // [2] DB insert 응답 전체
      console.log('[Upload] db insert response:', { data: dbData, error: dbError });

      if (dbError) {
        console.error('[Upload] Database insert error (full):', dbError);
        // [4] 보상: DB insert 실패 시 방금 업로드한 Storage 파일 삭제 (고아 파일 방지)
        try {
          const { error: rmErr } = await supabase.storage.from(bucket).remove([filePath]);
          if (rmErr) console.warn('[Upload] Rollback remove failed:', rmErr);
          else console.log('[Upload] Rollback: removed orphan file from storage:', filePath);
        } catch (rbErr) {
          console.warn('[Upload] Rollback remove threw:', rbErr);
        }
        throw new Error(`DB insert: ${dbError.message} (${dbError.code || ''})`);
      }

      console.log('[Upload] ✅ done. id:', (dbData as TaskDocument)?.id, 'url:', publicUrl);
      return dbData as TaskDocument;
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string; details?: string; name?: string };
      console.error('[Upload] ❌ full error object:', e);
      console.error('[Upload] message|code|details:', e?.message, e?.code, e?.details);

      const msg = [e?.message, e?.code, e?.details].filter(Boolean).join(' | ') || String(e);
      alert(`Supabase 업로드 실패:\n${msg}\n\n(콘솔에서 [Upload] 로그를 확인하세요. 로컬 임시 저장은 하지 않습니다.)`);

      // 디버깅 시 fallback 비활성화: 사용자에게 실패만 노출
      return null;
    }
  } else {
    console.log('[Upload] Supabase not configured, using localStorage');
    // --- Mock Implementation (LocalStorage with Base64 for preview) ---
    return await uploadToMock();
  }
};

export const saveFmeaDocument = async (taskId: number, fileName: string, data: FmeaData): Promise<TaskDocument | null> => {
  const jsonContent = JSON.stringify(data, null, 2); // Pretty print for preview
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const file = new File([blob], fileName, { type: 'application/json' });

  // For FMEA, we can just use the uploadDocument logic as it handles Mock/Supabase switching
  if (isSupabaseConfigured()) {
      return await uploadDocument(taskId, file);
  } else {
      // Mock Mode: Reuse uploadDocument
      const doc = await uploadDocument(taskId, file);
      
      // Also save raw data for the editor key to persist edits
      if (doc) {
        localStorage.setItem(`${MOCK_FMEA_DATA_KEY}${doc.id}`, JSON.stringify(data));
      }
      return doc;
  }
};

export const loadFmeaData = async (doc: TaskDocument): Promise<FmeaData | null> => {
  let rawData: any = null;

  if (isSupabaseConfigured()) {
    try {
      const response = await fetch(doc.url);
      if (!response.ok) throw new Error('Network response was not ok');
      rawData = await response.json();
    } catch (e) {
      console.error("Failed to load FMEA data from URL", e);
      return null;
    }
  } else {
    // Mock Mode
    const dataString = localStorage.getItem(`${MOCK_FMEA_DATA_KEY}${doc.id}`);
    if (dataString) {
      rawData = JSON.parse(dataString);
    } else if (doc.url && doc.url.startsWith('data:')) {
        try {
            const base64 = doc.url.split(',')[1];
            // Safe decode for UTF-8
            const jsonStr = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            rawData = JSON.parse(jsonStr);
        } catch(e) {
            console.error('Failed to parse FMEA from Base64', e);
        }
    }
  }

  if (!rawData) return null;

  // Backward Compatibility: Check if it's an array (Old format) or object (New format)
  if (Array.isArray(rawData)) {
    return {
      rows: rawData as FmeaRow[],
      revisions: [],
      version: 1
    };
  } else {
    return rawData as FmeaData;
  }
};

export const getDocuments = async (taskId: number): Promise<TaskDocument[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
    return data as TaskDocument[];
  } else {
    // --- Mock Implementation ---
    await delay(300);
    const allDocs = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
    return allDocs.filter((d: TaskDocument) => d.task_id === taskId).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
};

export const deleteDocument = async (docId: string | number): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId);
    
    return !error;
  } else {
    // --- Mock Implementation ---
    await delay(300);
    const allDocs = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
    const newDocs = allDocs.filter((d: TaskDocument) => String(d.id) !== String(docId));
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(newDocs));
    localStorage.removeItem(`${MOCK_FMEA_DATA_KEY}${docId}`);
    return true;
  }
};

export const getTaskDocumentCounts = async (): Promise<Record<number, number>> => {
  const counts: Record<number, number> = {};
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('documents').select('task_id');
    if (data) {
      data.forEach((row: any) => { counts[row.task_id] = (counts[row.task_id] || 0) + 1; });
    }
  } else {
    const allDocs = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
    allDocs.forEach((d: TaskDocument) => { counts[d.task_id] = (counts[d.task_id] || 0) + 1; });
  }
  return counts;
};
