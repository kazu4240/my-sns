"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Post = {
  id: number;
  content: string;
  created_at: string;
  likes: number;
  user_id: string | null;
  user_email: string | null;
  image_url: string | null;
  parent_id: number | null;
};

type Profile = {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(params);

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [errorMessage, setErrorMessage] = useState("");

  const numericPostId = useMemo(() => Number(postId), [postId]);

  const loadPostPage = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      if (!Number.isFinite(numericPostId)) {
        setErrorMessage("投稿が見つかりません。");
        setPost(null);
        setReplies([]);
        setProfiles({});
        setLoading(false);
        return;
      }

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", numericPostId)
        .maybeSingle();

      if (postError) {
        throw new Error(postError.message);
      }

      if (!postData) {
        setErrorMessage("投稿が見つかりません。");
        setPost(null);
        setReplies([]);
        setProfiles({});
        setLoading(false);
        return;
      }

      const mainPost = postData as Post;
      setPost(mainPost);

      const { data: repliesData, error: repliesError } = await supabase
        .from("posts")
        .select("*")
        .eq("parent_id", numericPostId)
        .order("created_at", { ascending: true });

      if (repliesError) {
        throw new Error(repliesError.message);
      }

      const replyPosts = (repliesData ?? []) as Post[];
      setReplies(replyPosts);

      const userIds = Array.from(
        new Set(
          [mainPost.user_id, ...replyPosts.map((item) => item.user_id)].filter(
            (value): value is string => !!value
          )
        )
      );

      if (userIds.length === 0) {
        setProfiles({});
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, display_name, bio, avatar_url")
        .in("user_id", userIds);

      if (profileError) {
        console.error(profileError);
        setProfiles({});
      } else {
        const profileMap: Record<string, Profile> = {};

        for (const profile of profileData ?? []) {
          profileMap[profile.user_id] = profile;
        }

        setProfiles(profileMap);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("投稿の読み込みに失敗しました。");
      setPost(null);
      setReplies([]);
      setProfiles({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostPage();
  }, [numericPostId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDisplayName = (item: Post) => {
    if (item.user_id && profiles[item.user_id]?.display_name) {
      return profiles[item.user_id].display_name!;
    }
    return item.user_email?.split("@")[0] ?? "ユーザー";
  };

  const getUsername = (item: Post) => {
    return item.user_email?.split("@")[0] ?? "user";
  };

  const getAvatarUrl = (item: Post) => {
    if (item.user_id && profiles[item.user_id]?.avatar_url) {
      return profiles[item.user_id].avatar_url!;
    }
    return null;
  };

  const renderPostCard = (item: Post, isReply = false) => {
    const profileHref = item.user_id ? `/users/${item.user_id}` : "/profile";

    return (
      <article
        key={item.id}
        style={{
          display: "flex",
          gap: "14px",
          padding: isReply ? "18px 20px" : "20px",
          borderBottom: "1px solid #2f3336",
        }}
      >
        {getAvatarUrl(item) ? (
          <Link href={profileHref}>
            <img
              src={getAvatarUrl(item)!}
              alt="avatar"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "9999px",
                objectFit: "cover",
                flexShrink: 0,
                border: "1px solid #2f3336",
              }}
            />
          </Link>
        ) : (
          <Link
            href={profileHref}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "9999px",
              background: "#1d9bf0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              flexShrink: 0,
              color: "white",
              textDecoration: "none",
            }}
          >
            {getDisplayName(item).slice(0, 1).toUpperCase()}
          </Link>
        )}

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginBottom: "8px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href={profileHref}
              style={{
                fontWeight: "bold",
                color: "white",
                textDecoration: "none",
              }}
            >
              {getDisplayName(item)}
            </Link>

            <span style={{ color: "#8899a6" }}>@{getUsername(item)}</span>

            <span style={{ color: "#8899a6", fontSize: "14px" }}>
              ・ {formatDate(item.created_at)}
            </span>

            {isReply && (
              <span style={{ color: "#1d9bf0", fontSize: "13px" }}>返信</span>
            )}
          </div>

          <p
            style={{
              fontSize: "18px",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
              margin: 0,
              marginBottom: item.image_url ? "12px" : "10px",
            }}
          >
            {item.content}
          </p>

          {item.image_url && (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "16px",
                overflow: "hidden",
                marginBottom: "12px",
              }}
            >
              <img
                src={item.image_url}
                alt="post image"
                style={{
                  width: "100%",
                  maxHeight: "420px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          )}

          <div
            style={{
              color: "#8899a6",
              fontSize: "14px",
            }}
          >
            ❤️ いいね {item.likes}
          </div>
        </div>
      </article>
    );
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#15202b",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          borderLeft: "1px solid #2f3336",
          borderRight: "1px solid #2f3336",
          minHeight: "100vh",
          background: "#15202b",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            background: "rgba(21,32,43,0.95)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #2f3336",
            padding: "18px 20px",
            zIndex: 10,
          }}
        >
          <Link
            href="/notifications"
            style={{
              color: "#1d9bf0",
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-block",
              marginBottom: "8px",
            }}
          >
            ← 通知に戻る
          </Link>

          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            投稿詳細
          </h1>
        </header>

        {errorMessage && (
          <div
            style={{
              padding: "20px",
              color: "#ffb4b4",
              borderBottom: "1px solid #2f3336",
            }}
          >
            {errorMessage}
          </div>
        )}

        {loading ? (
          <p style={{ padding: "20px", color: "#8899a6" }}>読み込み中...</p>
        ) : !post ? null : (
          <>
            <section>{renderPostCard(post)}</section>

            <section>
              <div
                style={{
                  padding: "18px 20px",
                  borderBottom: "1px solid #2f3336",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                返信
              </div>

              {replies.length === 0 ? (
                <p style={{ padding: "20px", color: "#8899a6" }}>
                  まだ返信がありません
                </p>
              ) : (
                replies.map((reply) => renderPostCard(reply, true))
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}