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
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme_background_color: string | null;
  theme_card_color: string | null;
  theme_text_color: string | null;
  theme_accent_color: string | null;
  ui_scale: string | null;
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
  const [viewerTheme, setViewerTheme] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const currentTheme = useMemo(() => {
    const textColor = viewerTheme?.theme_text_color || "#ffffff";

    return {
      background: viewerTheme?.theme_background_color || "#15202b",
      card: viewerTheme?.theme_card_color || "#192734",
      text: textColor,
      accent: viewerTheme?.theme_accent_color || "#1d9bf0",
      border: "#2f3336",
      muted: textColor === "#000000" ? "#555555" : "#8899a6",
      softText: textColor === "#000000" ? "#444444" : "#cfd9de",
    };
  }, [viewerTheme]);

  const uiScale = viewerTheme?.ui_scale || "normal";

  const sizes =
    uiScale === "compact"
      ? {
          avatar: 76,
          name: 24,
          username: 14,
          bio: 14,
          postText: 15,
          meta: 12,
          button: 13,
        }
      : uiScale === "large"
      ? {
          avatar: 100,
          name: 30,
          username: 17,
          bio: 17,
          postText: 18,
          meta: 14,
          button: 15,
        }
      : {
          avatar: 88,
          name: 28,
          username: 16,
          bio: 16,
          postText: 17,
          meta: 13,
          button: 14,
        };

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
        myThemeResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
          )
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
        signedInUserId
          ? supabase
              .from("profiles")
              .select(
                "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
              )
              .eq("user_id", signedInUserId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (profileResult.error) {
        console.error(profileResult.error);
      }

      if (postsResult.error) {
        throw new Error(postsResult.error.message);
      }

      setProfile((profileResult.data as Profile | null) ?? null);
      setPosts((postsResult.data ?? []) as Post[]);
      setFollowersCount(followersResult.count ?? 0);
      setFollowingCount(followingResult.count ?? 0);
      setIsFollowing(!!myFollowResult.data);
      setViewerTheme((myThemeResult.data as Profile | null) ?? null);
    } catch (error) {
      console.error(error);
      setErrorMessage("プロフィールの読み込みに失敗しました。");
      setPosts([]);
      setProfile(null);
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

  const shownName = profile?.display_name || profile?.username || "ユーザー";
  const shownUsername = profile?.username || "user";
  const shownBio = profile?.bio || "自己紹介はまだありません。";
  const shownAvatarUrl = profile?.avatar_url || null;
  const isMyPage = !!currentUserId && currentUserId === userId;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: currentTheme.background,
        color: currentTheme.text,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          borderLeft: `1px solid ${currentTheme.border}`,
          borderRight: `1px solid ${currentTheme.border}`,
          minHeight: "100vh",
          background: currentTheme.background,
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            background: `${currentTheme.background}ee`,
            backdropFilter: "blur(8px)",
            borderBottom: `1px solid ${currentTheme.border}`,
            padding: "18px 20px",
            zIndex: 10,
          }}
        >
          <Link
            href="/"
            style={{
              color: currentTheme.accent,
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
              borderBottom: `1px solid ${currentTheme.border}`,
            }}
          >
            {errorMessage}
          </div>
        )}

        <section
          style={{
            padding: "24px 20px",
            borderBottom: `1px solid ${currentTheme.border}`,
          }}
        >
          {shownAvatarUrl ? (
            <img
              src={shownAvatarUrl}
              alt="avatar"
              style={{
                width: sizes.avatar,
                height: sizes.avatar,
                borderRadius: "9999px",
                objectFit: "cover",
                marginBottom: "16px",
                border: `2px solid ${currentTheme.border}`,
              }}
            />
          ) : (
            <div
              style={{
                width: sizes.avatar,
                height: sizes.avatar,
                borderRadius: "9999px",
                background: currentTheme.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: "bold",
                marginBottom: "16px",
                color: "#ffffff",
              }}
            >
              {shownName.charAt(0).toUpperCase()}
            </div>
          )}

          <h2
            style={{
              margin: 0,
              fontSize: sizes.name,
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
              color: currentTheme.muted,
              fontSize: sizes.username,
            }}
          >
            @{shownUsername}
          </p>

          <p
            style={{
              margin: 0,
              marginBottom: "16px",
              fontSize: sizes.bio,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {shownBio}
          </p>

          <div
            style={{
              display: "flex",
              gap: "18px",
              flexWrap: "wrap",
              marginBottom: "16px",
              color: currentTheme.softText,
              fontSize: sizes.meta,
            }}
          >
            <Link
              href={`/users/${userId}/followers`}
              style={{
                color: currentTheme.softText,
                textDecoration: "none",
              }}
            >
              <strong>{followersCount}</strong> フォロワー
            </Link>

            <Link
              href={`/users/${userId}/following`}
              style={{
                color: currentTheme.softText,
                textDecoration: "none",
              }}
            >
              <strong>{followingCount}</strong> フォロー中
            </Link>
          </div>

          {!isMyPage && (
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              style={{
                background: isFollowing ? currentTheme.card : currentTheme.accent,
                color: "#ffffff",
                border: isFollowing ? `1px solid ${currentTheme.border}` : "none",
                padding: "10px 18px",
                borderRadius: "9999px",
                fontSize: sizes.button,
                fontWeight: "bold",
                cursor: followLoading ? "not-allowed" : "pointer",
              }}
            >
              {followLoading
                ? "処理中..."
                : isFollowing
                ? "フォロー中"
                : "フォロー"}
            </button>
          )}
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
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "16px",
                padding: "18px",
                color: currentTheme.muted,
                background: currentTheme.card,
              }}
            >
              読み込み中...
            </div>
          ) : posts.length === 0 ? (
            <div
              style={{
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "16px",
                padding: "18px",
                color: currentTheme.muted,
                background: currentTheme.card,
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
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: "16px",
                    padding: "18px",
                    background: currentTheme.card,
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
                    <span style={{ color: currentTheme.muted }}>
                      @{shownUsername}
                    </span>
                    <span
                      style={{
                        color: currentTheme.muted,
                        fontSize: sizes.meta,
                      }}
                    >
                      ・ {formatDate(post.created_at)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      marginBottom: post.image_url ? "12px" : "0",
                      fontSize: sizes.postText,
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
                        border: `1px solid ${currentTheme.border}`,
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
                      color: currentTheme.muted,
                      fontSize: sizes.meta,
                    }}
                  >
                    ❤️ {post.likes}
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
