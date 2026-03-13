"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
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
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);

  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const loadUserPage = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(authError);
      }

      const signedInUserId = user?.id ?? null;
      setCurrentUserId(signedInUserId);

      const [
        profileResult,
        postsResult,
        followersResult,
        followingResult,
        myFollowResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, display_name, bio, avatar_url")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("posts")
          .select("*")
          .eq("user_id", userId)
          .is("parent_id", null)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_user_id", userId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_user_id", userId),
        signedInUserId
          ? supabase
              .from("follows")
              .select("id")
              .eq("follower_user_id", signedInUserId)
              .eq("following_user_id", userId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (profileResult.error) {
        console.error(profileResult.error);
      }

      if (postsResult.error) {
        throw new Error(postsResult.error.message);
      }

      if ("error" in followersResult && followersResult.error) {
        console.error(followersResult.error);
      }

      if ("error" in followingResult && followingResult.error) {
        console.error(followingResult.error);
      }

      if ("error" in myFollowResult && myFollowResult.error) {
        console.error(myFollowResult.error);
      }

      setProfile((profileResult.data as Profile | null) ?? null);

      const postsData = (postsResult.data ?? []) as Post[];
      setPosts(postsData);

      if (postsData.length > 0) {
        setUserEmail(postsData[0].user_email ?? null);
      } else {
        setUserEmail(null);
      }

      setFollowersCount(followersResult.count ?? 0);
      setFollowingCount(followingResult.count ?? 0);
      setIsFollowing(!!myFollowResult.data);
    } catch (error) {
      console.error(error);
      setErrorMessage("プロフィールの読み込みに失敗しました。");
      setPosts([]);
      setProfile(null);
      setUserEmail(null);
      setFollowersCount(0);
      setFollowingCount(0);
      setIsFollowing(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserPage();
  }, [userId]);

  const createFollowNotification = async () => {
    if (!currentUserId || currentUserId === userId) return;

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      actor_user_id: currentUserId,
      type: "follow",
      post_id: null,
    });

    if (error) {
      console.error("フォロー通知失敗:", error.message);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      alert("フォローするにはログインしてね");
      return;
    }

    if (currentUserId === userId) {
      return;
    }

    setFollowLoading(true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_user_id", currentUserId)
          .eq("following_user_id", userId);

        if (error) {
          alert("フォロー解除失敗: " + error.message);
          setFollowLoading(false);
          return;
        }

        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_user_id: currentUserId,
          following_user_id: userId,
        });

        if (error) {
          alert("フォロー失敗: " + error.message);
          setFollowLoading(false);
          return;
        }

        await createFollowNotification();
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error(error);
      alert("フォロー処理失敗");
    } finally {
      setFollowLoading(false);
    }
  };

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
  const isMyPage = !!currentUserId && currentUserId === userId;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#15202b",
        color: "white",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          borderLeft: "1px solid #2f3336",
          borderRight: "1px solid #2f3336",
          minHeight: "100vh",
          background: "#15202b",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.02)",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            background: "rgba(21,32,43,0.93)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid #2f3336",
            padding: "16px 20px 14px",
            zIndex: 20,
          }}
        >
          <Link
            href="/"
            style={{
              color: "#1d9bf0",
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-block",
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            ← ホームに戻る
          </Link>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: "6px",
                }}
              >
                Ulein
              </div>

              <div
                style={{
                  color: "#8899a6",
                  fontSize: "14px",
                }}
              >
                ユーザープロフィール
              </div>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div
            style={{
              margin: "18px 20px 0",
              padding: "14px 16px",
              color: "#ffb4b4",
              border: "1px solid rgba(255,107,107,0.25)",
              background: "rgba(255,107,107,0.08)",
              borderRadius: "18px",
            }}
          >
            {errorMessage}
          </div>
        )}

        <section
          style={{
            padding: "22px 20px 20px",
            borderBottom: "1px solid #2f3336",
          }}
        >
          <div
            style={{
              background: "#192734",
              border: "1px solid #2f3336",
              borderRadius: "24px",
              padding: "20px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "18px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {shownAvatarUrl ? (
                <img
                  src={shownAvatarUrl}
                  alt="avatar"
                  style={{
                    width: "92px",
                    height: "92px",
                    borderRadius: "9999px",
                    objectFit: "cover",
                    border: "2px solid #2f3336",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.14)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "92px",
                    height: "92px",
                    borderRadius: "9999px",
                    background: "#1d9bf0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "34px",
                    fontWeight: "bold",
                    color: "#ffffff",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.14)",
                  }}
                >
                  {shownName.charAt(0).toUpperCase()}
                </div>
              )}

              <div style={{ minWidth: 0, flex: 1 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "30px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    wordBreak: "break-all",
                  }}
                >
                  {shownName}
                </h1>

                <div
                  style={{
                    marginTop: "6px",
                    marginBottom: "14px",
                    color: "#8899a6",
                    fontSize: "15px",
                    wordBreak: "break-all",
                  }}
                >
                  @{shownId}
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    color: "#cfd9de",
                    wordBreak: "break-word",
                  }}
                >
                  {shownBio}
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "18px",
                alignItems: "center",
              }}
            >
              <Link
                href={`/users/${userId}/followers`}
                style={{
                  color: "#cfd9de",
                  textDecoration: "none",
                  border: "1px solid #2f3336",
                  background: "#15202b",
                  padding: "10px 14px",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                <strong>{followersCount}</strong> フォロワー
              </Link>

              <Link
                href={`/users/${userId}/following`}
                style={{
                  color: "#cfd9de",
                  textDecoration: "none",
                  border: "1px solid #2f3336",
                  background: "#15202b",
                  padding: "10px 14px",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                <strong>{followingCount}</strong> フォロー中
              </Link>

              {!isMyPage && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  style={{
                    background: isFollowing ? "#22303c" : "#1d9bf0",
                    color: "white",
                    border: isFollowing ? "1px solid #2f3336" : "none",
                    padding: "11px 18px",
                    borderRadius: "9999px",
                    fontSize: "14px",
                    fontWeight: 800,
                    cursor: followLoading ? "not-allowed" : "pointer",
                    boxShadow: isFollowing
                      ? "none"
                      : "0 8px 20px rgba(29,155,240,0.28)",
                  }}
                >
                  {followLoading
                    ? "処理中..."
                    : isFollowing
                    ? "フォロー中"
                    : "フォロー"}
                </button>
              )}
            </div>
          </div>
        </section>

        <section style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              この人の投稿
            </h2>

            <div
              style={{
                color: "#8899a6",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              最新20件
            </div>
          </div>

          {loading ? (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "18px",
                padding: "18px",
                color: "#8899a6",
                background: "#192734",
              }}
            >
              読み込み中...
            </div>
          ) : posts.length === 0 ? (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "18px",
                padding: "18px",
                color: "#8899a6",
                background: "#192734",
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
                    borderRadius: "20px",
                    padding: "18px",
                    background: "#192734",
                    boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
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
                    <span style={{ fontWeight: "bold", color: "white" }}>
                      {shownName}
                    </span>
                    <span style={{ color: "#8899a6" }}>@{shownId}</span>
                    <span style={{ color: "#8899a6", fontSize: "13px" }}>
                      ・ {formatDate(post.created_at)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      marginBottom: post.image_url ? "12px" : "0",
                      fontSize: "17px",
                      lineHeight: 1.75,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      color: "white",
                    }}
                  >
                    {post.content}
                  </p>

                  {post.image_url && (
                    <div
                      style={{
                        marginTop: "12px",
                        border: "1px solid #2f3336",
                        borderRadius: "18px",
                        overflow: "hidden",
                        background: "#15202b",
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
                      fontWeight: "bold",
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