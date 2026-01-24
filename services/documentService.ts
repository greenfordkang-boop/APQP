
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
      task_id: taskId,
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
    console.log('[Upload] Starting Supabase upload for task:', taskId, 'file:', file.name);

    try {
      // 1. Upload to Storage Bucket 'project-files'
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = fileName;

      console.log('[Upload] Uploading to storage:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[Upload] Storage upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      console.log('[Upload] Storage upload successful:', uploadData);

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      console.log('[Upload] Public URL:', publicUrl);

      // 3. Insert Metadata into Database Table 'documents'
      const docData: Partial<TaskDocument> = {
        task_id: taskId,
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
      };

      console.log('[Upload] Inserting document metadata:', docData);

      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert(docData)
        .select()
        .single();

      if (dbError) {
        console.error('[Upload] Database insert error:', dbError);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      console.log('[Upload] Database insert successful:', dbData);
      console.log('[Upload] ✅ Upload completed successfully');

      return dbData as TaskDocument;
    } catch (error: any) {
      console.error('[Upload] ❌ Supabase upload failed:', error);
      console.error('[Upload] Error details:', error.message, error.code, error.details);

      // Show specific error message
      const errorMsg = error.message || 'Unknown error';
      alert(`Supabase 업로드 실패: ${errorMsg}\n로컬 저장소에 임시 저장합니다.`);

      // Fallback to mock storage
      console.log('[Upload] Falling back to localStorage');
      return await uploadToMock();
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
