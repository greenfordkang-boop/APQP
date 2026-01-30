import { createClient, User } from '@supabase/supabase-js';

// ==================== 관리자 설정 ====================
export const ADMIN_EMAIL = 'greenfordkang@gmail.com';

// ==================== 보안 설정 ====================
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 30 * 60 * 1000,    // 30분
  WARNING_BEFORE: 5 * 60 * 1000,      // 만료 5분 전 경고
  ACTIVITY_EVENTS: ['mousedown', 'keydown', 'scroll', 'touchstart'] as const
};

// ==================== 타입 정의 ====================
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  role: string;
  approved: boolean;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
}

// ==================== Supabase 설정 ====================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// [3] 런타임 env 확인 (Vite: .env 변경 후 dev 서버 재시작 필요)
if (import.meta.env.DEV) {
  const u = import.meta.env.VITE_SUPABASE_URL;
  const k = import.meta.env.VITE_SUPABASE_ANON_KEY;
  console.log('[Supabase] VITE_SUPABASE_URL:', u === undefined || u === '' ? 'undefined or empty' : (u === 'https://your-project.supabase.co' ? 'placeholder' : 'configured'));
  console.log('[Supabase] VITE_SUPABASE_ANON_KEY:', k === undefined || k === '' ? 'undefined or empty' : (k === 'your-anon-key' ? 'placeholder' : 'set'));
}

export const isSupabaseConfigured = () => {
  return import.meta.env.VITE_SUPABASE_URL &&
         import.meta.env.VITE_SUPABASE_ANON_KEY &&
         import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co';
};

// ==================== 인증 함수 ====================

// 로그인
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User; isAdmin?: boolean }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('로그인 실패:', error.message);
      return { success: false, error: error.message === 'Invalid login credentials' ? '이메일 또는 비밀번호가 올바르지 않습니다.' : error.message };
    }

    if (!data.user) {
      return { success: false, error: '사용자 정보를 가져올 수 없습니다.' };
    }

    // 사용자 프로필 확인 (승인 상태)
    const profile = await loadUserProfile(data.user.id);

    // 관리자가 아닌 경우 승인 확인
    if (email !== ADMIN_EMAIL && profile && !profile.approved) {
      await supabase.auth.signOut();
      return { success: false, error: '관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.' };
    }

    // 마지막 로그인 시간 업데이트
    if (profile) {
      await supabase
        .from('user_profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    // 접근 로그 기록
    await logAccess(data.user.id, data.user.email || '', 'login');

    return {
      success: true,
      user: data.user,
      isAdmin: email === ADMIN_EMAIL
    };
  } catch (err: any) {
    console.error('로그인 오류:', err);
    return { success: false, error: '로그인 중 오류가 발생했습니다.' };
  }
}

// 회원가입
export async function signUp(email: string, password: string, displayName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error('회원가입 실패:', error.message);
      if (error.message.includes('already registered')) {
        return { success: false, error: '이미 등록된 이메일입니다.' };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: '사용자 생성에 실패했습니다.' };
    }

    // user_profiles 테이블에 프로필 생성
    const isAdminUser = email === ADMIN_EMAIL;
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: email,
        display_name: displayName || email.split('@')[0],
        role: isAdminUser ? 'admin' : 'viewer',
        approved: isAdminUser, // 관리자는 자동 승인
        is_active: true
      });

    if (profileError) {
      console.error('프로필 생성 오류:', profileError);
    }

    // 접근 로그 기록
    await logAccess(data.user.id, email, 'signup');

    if (isAdminUser) {
      return { success: true };
    }

    return {
      success: true,
      error: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.'
    };
  } catch (err: any) {
    console.error('회원가입 오류:', err);
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
  }
}

// 로그아웃
export async function signOut(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await logAccess(user.id, user.email || '', 'logout');
  }
  await supabase.auth.signOut();
}

// 사용자 프로필 조회
export async function loadUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('프로필 조회 오류:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('프로필 조회 중 오류:', err);
    return null;
  }
}

// 현재 세션 확인
export async function checkAuthSession(): Promise<{ user: User | null; profile: UserProfile | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return { user: null, profile: null };
    }

    const profile = await loadUserProfile(session.user.id);

    return { user: session.user, profile };
  } catch (err) {
    console.error('세션 확인 오류:', err);
    return { user: null, profile: null };
  }
}

// 접근 로그 기록
export async function logAccess(userId: string, userEmail: string, action: string, details?: any): Promise<void> {
  try {
    await supabase.from('access_logs').insert({
      user_id: userId,
      user_email: userEmail,
      action: action,
      details: details || null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    });
  } catch (err) {
    console.error('접근 로그 기록 오류:', err);
  }
}

// 관리자 여부 확인
export function isAdmin(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}

// ==================== 관리자 전용 함수 ====================

// 모든 사용자 조회
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 목록 조회 오류:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('사용자 목록 조회 중 오류:', err);
    return [];
  }
}

// 사용자 승인
export async function approveUser(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ approved: true })
      .eq('id', userId);

    if (error) {
      console.error('사용자 승인 오류:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('사용자 승인 중 오류:', err);
    return false;
  }
}

// 사용자 거부/비활성화
export async function rejectUser(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: false, approved: false })
      .eq('id', userId);

    if (error) {
      console.error('사용자 거부 오류:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('사용자 거부 중 오류:', err);
    return false;
  }
}
