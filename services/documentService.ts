import { supabase, isSupabaseConfigured } from './supabaseClient';
import { TaskDocument } from '../types';

const MOCK_STORAGE_KEY = 'mock_task_documents';

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
  if (isSupabaseConfigured()) {
    try {
      // 1. Upload to Storage Bucket 'project-files'
      const fileExt = file.name.split('.').pop();
      const fileName = `${taskId}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      // 3. Insert Metadata into Database Table 'documents'
      const docData: Partial<TaskDocument> = {
        task_id: taskId,
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

      if (dbError) throw dbError;

      return dbData as TaskDocument;
    } catch (error) {
      console.error('Supabase upload failed:', error);
      alert('업로드 실패: Supabase 설정을 확인해주세요.');
      return null;
    }
  } else {
    // --- Mock Implementation (LocalStorage with Base64 for preview) ---
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
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify([...existing, mockDoc]));
    return mockDoc;
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
    
    // Note: Ideally we also delete from Storage, but we need the path for that. 
    return !error;
  } else {
    // --- Mock Implementation ---
    await delay(300);
    const allDocs = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
    // Use String conversion for safe comparison in mock mode where types might be loose
    const newDocs = allDocs.filter((d: TaskDocument) => String(d.id) !== String(docId));
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(newDocs));
    return true;
  }
};

export const getTaskDocumentCounts = async (): Promise<Record<number, number>> => {
  const counts: Record<number, number> = {};

  if (isSupabaseConfigured()) {
    // Fetch all task_ids from documents table to count them
    // Note: For large datasets, a proper count query or view is better. 
    // For this dashboard, fetching 'task_id' is lightweight enough.
    const { data, error } = await supabase
      .from('documents')
      .select('task_id');
    
    if (data) {
      data.forEach((row: any) => {
        counts[row.task_id] = (counts[row.task_id] || 0) + 1;
      });
    }
  } else {
    // --- Mock Implementation ---
    const allDocs = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
    allDocs.forEach((d: TaskDocument) => {
      counts[d.task_id] = (counts[d.task_id] || 0) + 1;
    });
  }
  return counts;
};