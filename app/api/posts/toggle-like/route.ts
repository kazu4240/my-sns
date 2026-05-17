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

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: targetPost, error: postCheckError } = await adminClient
      .from("posts")
      .select("id, user_id")
      .eq("id", postId)
      .maybeSingle();

    if (postCheckError) {
      return NextResponse.json(
        { error: "投稿確認に失敗しました: " + postCheckError.message },
        { status: 500 }
      );
    }

    if (!targetPost) {
      return NextResponse.json(
        { error: "投稿が見つかりません" },
        { status: 404 }
      );
    }

    const { data: existingLike, error: existingLikeError } = await adminClient
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle();

    if (existingLikeError) {
      return NextResponse.json(
        { error: "いいね確認に失敗しました: " + existingLikeError.message },
        { status: 500 }
      );
    }

    let liked = false;

    if (existingLike) {
      const { error: deleteLikeError } = await adminClient
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      if (deleteLikeError) {
        return NextResponse.json(
          { error: "いいね解除に失敗しました: " + deleteLikeError.message },
          { status: 500 }
        );
      }

      liked = false;
    } else {
      const { error: insertLikeError } = await adminClient.from("likes").insert({
        user_id: user.id,
        post_id: postId,
      });

      if (insertLikeError) {
        return NextResponse.json(
          { error: "いいねに失敗しました: " + insertLikeError.message },
          { status: 500 }
        );
      }

      liked = true;
    }

    const { count, error: countError } = await adminClient
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId);

    if (countError) {
      return NextResponse.json(
        { error: "いいね数の取得に失敗しました: " + countError.message },
        { status: 500 }
      );
    }

    const nextLikes = count ?? 0;

    const { error: updatePostError } = await adminClient
      .from("posts")
      .update({ likes: nextLikes })
      .eq("id", postId);

    if (updatePostError) {
      return NextResponse.json(
        { error: "いいね数の保存に失敗しました: " + updatePostError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      liked,
      likes: nextLikes,
      postId,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "いいね処理に失敗しました" },
      { status: 500 }
    );
  }
}