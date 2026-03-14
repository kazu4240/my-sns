import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const body = await request.json();
    const reportId = Number(body?.reportId);

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "認証情報がありません" },
        { status: 401 }
      );
    }

    if (!Number.isFinite(reportId)) {
      return NextResponse.json(
        { error: "reportId が不正です" },
        { status: 400 }
      );
    }

    const token = authorization.replace("Bearer ", "");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "環境変数が足りません" },
        { status: 500 }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "ログイン確認に失敗しました" },
        { status: 401 }
      );
    }

    const { data: myProfile, error: profileError } = await userClient
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: "管理者確認に失敗しました" },
        { status: 500 }
      );
    }

    if (!myProfile?.is_admin) {
      return NextResponse.json(
        { error: "管理者だけが実行できます" },
        { status: 403 }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { error: updateError } = await adminClient
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", reportId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "通報の更新に失敗しました" },
      { status: 500 }
    );
  }
}