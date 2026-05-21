import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchStaffAccessContext } from './staff';

export type AccessTarget = 'admin' | 'staff' | 'none';

export type UserAccessResult = {
  target: AccessTarget;
  user: User;
};

export class AuthAccessError extends Error {
  code: 'invalid_credentials' | 'access_check_failed' | 'sign_in_failed';

  constructor(code: AuthAccessError['code'], message: string) {
    super(message);
    this.name = 'AuthAccessError';
    this.code = code;
  }
}

function hasStaffAccess(access: Awaited<ReturnType<typeof fetchStaffAccessContext>>) {
  return Boolean(access.can_view_staff || access.can_mark_attendance || access.can_view_emergency || access.roles?.length);
}

export async function resolveUserAccess(userId: string): Promise<AccessTarget> {
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { uid: userId });
  if (adminError) throw new AuthAccessError('access_check_failed', adminError.message);
  if (isAdmin) return 'admin';

  try {
    const access = await fetchStaffAccessContext();
    return hasStaffAccess(access) ? 'staff' : 'none';
  } catch (error) {
    throw new AuthAccessError('access_check_failed', error instanceof Error ? error.message : 'Staff access check failed');
  }
}

export async function signInAndResolveAccess(email: string, password: string): Promise<UserAccessResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message = error.message.toLowerCase();
    const code = message.includes('invalid login') || message.includes('invalid credentials') ? 'invalid_credentials' : 'sign_in_failed';
    throw new AuthAccessError(code, error.message);
  }
  const target = await resolveUserAccess(data.user.id);
  return { target, user: data.user };
}

export function authErrorMessage(error: unknown, language: 'th' | 'en') {
  if (error instanceof AuthAccessError) {
    if (error.code === 'invalid_credentials') {
      return language === 'th' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'Invalid email or password.';
    }
    if (error.code === 'access_check_failed') {
      return language === 'th' ? 'เข้าสู่ระบบได้แล้ว แต่ตรวจสอบสิทธิ์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' : 'Signed in, but access could not be checked. Please try again.';
    }
  }
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('network') || message.includes('fetch')) {
    return language === 'th' ? 'เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่' : 'Could not connect. Please try again.';
  }
  return language === 'th' ? 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่' : 'Sign in failed. Please try again.';
}
