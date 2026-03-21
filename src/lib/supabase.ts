/**
 * Supabase 연결 설정
 * - 로컬: .env.local 에 NEXT_PUBLIC_SUPABASE_PROJECT_ID, NEXT_PUBLIC_SUPABASE_ANON_KEY 설정
 * - Vercel: 프로젝트 설정 → Environment Variables 에 동일 키로 설정
 */
const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID ?? "";
const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseUrl = projectId ? `https://${projectId}.supabase.co` : "";
export { projectId, publicAnonKey };
