"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function UserProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadUserPage = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const targetUserId = params.userId;

      const [profileResult, postsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, display_name, bio, avatar_url")
          .eq("user_id", targetUserId)
          .maybeSingle(),
        supabase
          .from("posts")
          .select("*")
          .eq("user_id", targetUserId)
          .is("parent_id", null)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (profileResult.error) {
        console.error(profileResult.error);
      }

      if (postsResult.error) {
        throw new Error(postsResult.error.message);
      }

      setProfile((profileResult.data as Profile | null) ?? null);

      const postsData = (postsResult.data ?? []) as Post[];
      setPosts(postsData);

      if (postsData.length > 0) {
        setUserEmail(postsData[0].user_email ?? null);
      } else {
        setUserEmail(null);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("プロフィールの読み込みに失敗しました。");
      setPosts([]);
      setProfile(null);
      setUserEmail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserPage();
  }, [params.userId]);

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

  const shownName =
    profile?.display_name || userEmail?.split("@")[0] || "ユーザー";
  const shownId = userEmail?.split("@")[0] || "user";
  const shownBio = profile?.bio || "自己紹介はまだありません。";
  const shownAvatarUrl = profile?.avatar_url || null;

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
            href="/"
            style={{
              color: "#1d9bf0",
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-block",
              marginBottom: "8px",
            }}
          >
            ← ホームに戻る
          </Link>

          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            ユーザープロフィール
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

        <section
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid #2f3336",
          }}
        >
          {shownAvatarUrl ? (
            <img
              src={shownAvatarUrl}
              alt="avatar"
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "9999px",
                objectFit: "cover",
                marginBottom: "16px",
                border: "2px solid #2f3336",
              }}
            />
          ) : (
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "9999px",
                background: "#1d9bf0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: "bold",
                marginBottom: "16px",
              }}
            >
              {shownName.charAt(0).toUpperCase()}
            </div>
          )}

          <h2
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: "bold",
              wordBreak: "break-all",
            }}
          >
            {shownName}
          </h2>

          <p
            style={{
              marginTop: "6px",
              marginBottom: "14px",
              color: "#8899a6",
              fontSize: "16px",
            }}
          >
            @{shownId}
          </p>

          <p
            style={{
              margin: 0,
              fontSize: "16px",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {shownBio}
          </p>
        </section>

        <section
          style={{
            padding: "20px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "20px",
            }}
          >
            この人の投稿
          </h3>

          {loading ? (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "16px",
                padding: "18px",
                color: "#8899a6",
              }}
            >
              読み込み中...
            </div>
          ) : posts.length === 0 ? (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "16px",
                padding: "18px",
                color: "#8899a6",
              }}
            >
              まだ投稿がない
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {posts.map((post) => (
                <article
                  key={post.id}
                  style={{
                    border: "1px solid #2f3336",
                    borderRadius: "16px",
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      marginBottom: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: "bold" }}>{shownName}</span>
                    <span style={{ color: "#8899a6" }}>@{shownId}</span>
                    <span style={{ color: "#8899a6", fontSize: "14px" }}>
                      ・ {formatDate(post.created_at)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      marginBottom: post.image_url ? "12px" : "0",
                      fontSize: "17px",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {post.content}
                  </p>

                  {post.image_url && (
                    <div
                      style={{
                        marginTop: "12px",
                        border: "1px solid #2f3336",
                        borderRadius: "16px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={post.image_url}
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
                      marginTop: "12px",
                      color: "#8899a6",
                      fontSize: "14px",
                    }}
                  >
                    ❤️ いいね {post.likes}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}