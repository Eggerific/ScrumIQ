import { type NextRequest, NextResponse } from "next/server";
import {
  createRouteHandlerClient,
  SUPABASE_CONFIG_ERROR_MESSAGE,
} from "@/lib/supabase/server";
import { isValidEmailFormat } from "@/lib/validation";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; full_name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { email, password, full_name } = body;
  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }
  if (!isValidEmailFormat(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address" },
      { status: 400 }
    );
  }

  try {
    const response = NextResponse.json({ ok: true, requiresConfirmation: false });
    const supabase = createRouteHandlerClient(request, response);

    const { data: authData, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: typeof full_name === "string" ? full_name.trim() : "",
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const requiresConfirmation = !!authData?.user && !authData?.session;
    const body = { ok: true, requiresConfirmation };
    return new NextResponse(JSON.stringify(body), {
      status: 200,
      headers: response.headers,
    });
  } catch (err) {
    if (err instanceof Error && err.message === SUPABASE_CONFIG_ERROR_MESSAGE) {
      return NextResponse.json(
        { error: err.message },
        { status: 503 }
      );
    }
    throw err;
  }
}
