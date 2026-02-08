/**
 * Supabase 연결 설정
 * - 로컬: .env.local 에서 읽거나 아래 기본값 사용
 * - Vercel: 프로젝트 설정 → Environment Variables 에 넣기
 */
const projectId =
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID ?? "lncxmdumvyepjkyvoamx";
const publicAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuY3htZHVtdnllcGpreXZvYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MTY5ODIsImV4cCI6MjA4NjA5Mjk4Mn0.u-Gu24ik4s3OZ4ZaU9be3_AeNbIv4JF_ZlnJuPdjDaw";

export const supabaseUrl = `https://${projectId}.supabase.co`;
export { projectId, publicAnonKey };
