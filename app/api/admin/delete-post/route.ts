import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const body = await request.json();
    const postId = Number(body?.postId);

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "認証情報がありません" },
        { status: 401 }
      );
    }

    if (!Number.isFinite(postId)) {
      return NextResponse.json(
        { error: "postId が不正です" },
        { status: 400 }
      );
    }

    const token = authorization.replace("Bearer ", "");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        {
          error: "環境変数が足りません",
          hasSupabaseUrl: !!supabaseUrl,
          hasSupabaseAnonKey: !!supabaseAnonKey,
          hasSupabaseServiceRoleKey: !!supabaseServiceRoleKey,
        },
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
        { error: "管理者確認に失敗しました: " + profileError.message },
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

    const { data: targetPost, error: targetPostError } = await adminClient
      .from("posts")
      .select("id")
      .eq("id", postId)
      .maybeSingle();

    if (targetPostError) {
      return NextResponse.json(
        { error: "投稿確認に失敗しました: " + targetPostError.message },
        { status: 500 }
      );
    }

    if (!targetPost) {
      return NextResponse.json(
        { error: "削除対象の投稿が見つかりません" },
        { status: 404 }
      );
    }

    const { error: deleteReportsError } = await adminClient
      .from("reports")
      .delete()
      .eq("post_id", postId);

    if (deleteReportsError) {
      return NextResponse.json(
        { error: "関連する通報の削除に失敗しました: " + deleteReportsError.message },
        { status: 500 }
      );
    }

    const { error: deleteNotificationsError } = await adminClient
      .from("notifications")
      .delete()
      .eq("post_id", postId);

    if (deleteNotificationsError) {
      return NextResponse.json(
        {
          error:
            "関連する通知の削除に失敗しました: " +
            deleteNotificationsError.message,
        },
        { status: 500 }
      );
    }

    const { error: deleteLikesError } = await adminClient
      .from("likes")
      .delete()
      .eq("post_id", postId);

    if (deleteLikesError) {
      return NextResponse.json(
        { error: "関連するいいねの削除に失敗しました: " + deleteLikesError.message },
        { status: 500 }
      );
    }

    const { error: deleteBookmarksError } = await adminClient
      .from("bookmarks")
      .delete()
      .eq("post_id", postId);

    if (deleteBookmarksError) {
      return NextResponse.json(
        {
          error:
            "関連するブックマークの削除に失敗しました: " +
            deleteBookmarksError.message,
        },
        { status: 500 }
      );
    }

    const { error: deleteRepliesError } = await adminClient
      .from("posts")
      .delete()
      .eq("parent_id", postId);

    if (deleteRepliesError) {
      return NextResponse.json(
        { error: "関連する返信の削除に失敗しました: " + deleteRepliesError.message },
        { status: 500 }
      );
    }

    const { error: deletePostError } = await adminClient
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deletePostError) {
      return NextResponse.json(
        { error: "投稿削除に失敗しました: " + deletePostError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "投稿削除に失敗しました" },
      { status: 500 }
    );
  }
}