import { NextRequest, NextResponse } from "next/server";

function getSupabaseConfig() {
  const projectId =
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID?.trim() ||
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    "";
  const supabaseUrl = projectId ? `https://${projectId}.supabase.co` : "";
  const target = supabaseUrl ? `${supabaseUrl}/functions/v1/server/make-server-0d019d5f` : "";
  return { projectId, anonKey, target };
}

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function POST(request: NextRequest) {
  return proxy(request);
}

export async function DELETE(request: NextRequest) {
  return proxy(request);
}

async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const prefix = "/api/game";
  const pathStr = pathname.startsWith(prefix)
    ? pathname.slice(prefix.length).replace(/^\//, "")
    : "";

  if (pathStr === "" || pathStr === "health") {
    const { projectId, anonKey, target } = getSupabaseConfig();
    return NextResponse.json({
      ok: true,
      hasSupabaseEnv: Boolean(projectId && anonKey),
      hasEdgeFunctionUrl: Boolean(target),
      hint:
        !projectId || !anonKey
          ? "프로젝트 루트에 .env.local 을 만들고 NEXT_PUBLIC_SUPABASE_PROJECT_ID, NEXT_PUBLIC_SUPABASE_ANON_KEY 를 넣은 뒤 dev 서버를 재시작하세요. (서버 전용으로 SUPABASE_PROJECT_REF, SUPABASE_ANON_KEY 도 가능)"
          : undefined,
    });
  }

  const { anonKey, target } = getSupabaseConfig();
  if (!target || !anonKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Supabase 연결 설정이 없습니다. .env.local 에 NEXT_PUBLIC_SUPABASE_PROJECT_ID 와 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 넣고 `pnpm dev` 를 다시 실행하세요.",
      },
      { status: 503 }
    );
  }

  const url = `${target}/${pathStr}`;

  const headers: HeadersInit = {
    Authorization: `Bearer ${anonKey}`,
  };
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  let body: string | undefined;
  try {
    body = await request.text();
  } catch {
    // no body
  }

  try {
    const res = await fetch(url, {
      method: request.method,
      headers,
      body: body || undefined,
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: `Supabase Edge Function 호출 실패: ${msg}. 배포 여부 확인: npx supabase functions deploy server --no-verify-jwt`,
      },
      { status: 502 }
    );
  }
}
