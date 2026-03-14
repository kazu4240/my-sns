"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type BookmarkRow = {
  post_id: number;
  created_at: string;
};

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
  theme_background_color?: string | null;
  theme_card_color?: string | null;
  theme_text_color?: string | null;
  theme_accent_color?: string | null;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_CARD = "#192734";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";

export default function BookmarksPage() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [themeBackgroundColor, setThemeBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [themeCardColor, setThemeCardColor] = useState(DEFAULT_CARD);
  const [themeTextColor, setThemeTextColor] = useState(DEFAULT_TEXT);
  const [themeAccentColor, setThemeAccentColor] = useState(DEFAULT_ACCENT);

  const theme = useMemo(() => {
    const textColor = themeTextColor || DEFAULT_TEXT;

    return {
      background: themeBackgroundColor || DEFAULT_BACKGROUND,
      card: themeCardColor || DEFAULT_CARD,
      text: textColor,
      accent: themeAccentColor || DEFAULT_ACCENT,
      border: DEFAULT_BORDER,
      muted: textColor === "#000000" ? "#555555" : "#8899a6",
      softText: textColor === "#000000" ? "#444444" : "#cfd9de",
    };
  }, [themeBackgroundColor, themeCardColor, themeTextColor, themeAccentColor]);

  const loadPage = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      const signedInUserId = user?.id ?? null;
      setCurrentUserId(signedInUserId);

      if (!signedInUserId) {
        setPosts([]);
        setProfiles({});
        setBookmarkedPostIds([]);
        setLoading(false);
        return;
      }

      const { data: myProfile } = await supabase
        .from("profiles")
        .select(
          "theme_background_color, theme_card_color, theme_text_color, theme_accent_color"
        )
        .eq("user_id", signedInUserId)
        .maybeSingle();

      setThemeBackgroundColor(myProfile?.theme_background_color ?? DEFAULT_BACKGROUND);
      setThemeCardColor(myProfile?.theme_card_color ?? DEFAULT_CARD);
      setThemeTextColor(myProfile?.theme_text_color ?? DEFAULT_TEXT);
      setThemeAccentColor(myProfile?.theme_accent_color ?? DEFAULT_ACCENT);

      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from("bookmarks")
        .select("post_id, created_at")
        .eq("user_id", signedInUserId)
        .order("created_at", { ascending: false });

      if (bookmarkError) {
        throw new Error(bookmarkError.message);
      }

      const bookmarkRows = (bookmarkData ?? []) as BookmarkRow[];
      const postIds = bookmarkRows.map((item) => item.post_id);
      setBookmarkedPostIds(postIds);

      if (postIds.length === 0) {
        setPosts([]);
        setProfiles({});
        setLoading(false);
        return;
      }

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .in("id", postIds);

      if (postError) {
        throw new Error(postError.message);
      }

      const postMap = new Map<number, Post>();
      for (const post of (postData ?? []) as Post[]) {
        postMap.set(post.id, post);
      }

      const orderedPosts = postIds
        .map((id) => postMap.get(id))
        .filter((value): value is Post => !!value);

      setPosts(orderedPosts);

      const userIds = Array.from(
        new Set(
          orderedPosts
            .map((post) => post.user_id)
            .filter((value): value is string => !!value)
        )
      );

      if (userIds.length > 0) {
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
      } else {
        setProfiles({});
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("ブックマークの読み込みに失敗しました。");
      setPosts([]);
      setProfiles({});
      setBookmarkedPostIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

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

  const getDisplayName = (post: Post) => {
    if (post.user_id && profiles[post.user_id]?.display_name) {
      return profiles[post.user_id].display_name!;
    }
    return post.user_email?.split("@")[0] ?? "ユーザー";
  };

  const getUsername = (post: Post) => {
    return post.user_email?.split("@")[0] ?? "user";
  };

  const getAvatarUrl = (post: Post) => {
    if (post.user_id && profiles[post.user_id]?.avatar_url) {
      return profiles[post.user_id].avatar_url!;
    }
    return null;
  };

  const handleRemoveBookmark = async (postId: number) => {
    if (!currentUserId) {
      alert("ログインしてね");
      return;
    }

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", currentUserId)
      .eq("post_id", postId);

    if (error) {
      alert("ブックマーク解除失敗: " + error.message);
      return;
    }

    setBookmarkedPostIds((prev) => prev.filter((id) => id !== postId));
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: theme.background,
        color: theme.text,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          borderLeft: `1px solid ${theme.border}`,
          borderRight: `1px solid ${theme.border}`,
          minHeight: "100vh",
          background: theme.background,
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            background: `${theme.background}ee`,
            backdropFilter: "blur(14px)",
            borderBottom: `1px solid ${theme.border}`,
            padding: "16px 20px 14px",
            zIndex: 20,
          }}
        >
          <Link
            href="/"
            style={{
              color: theme.accent,
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
              fontSize: "26px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "6px",
              color: theme.text,
            }}
          >
            Ulein
          </div>

          <div
            style={{
              color: theme.muted,
              fontSize: "14px",
            }}
          >
            ブックマーク
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

        <section style={{ padding: "20px" }}>
          {loading ? (
            <div
              style={{
                border: `1px solid ${theme.border}`,
                borderRadius: "18px",
                padding: "18px",
                color: theme.muted,
                background: theme.card,
              }}
            >
              読み込み中...
            </div>
          ) : !currentUserId ? (
            <div
              style={{
                border: `1px solid ${theme.border}`,
                borderRadius: "18px",
                padding: "18px",
                color: theme.muted,
                background: theme.card,
              }}
            >
              ログインするとブックマークを見れる
            </div>
          ) : posts.length === 0 ? (
            <div
              style={{
                border: `1px solid ${theme.border}`,
                borderRadius: "18px",
                padding: "18px",
                color: theme.muted,
                background: theme.card,
              }}
            >
              まだブックマークがない
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {posts.map((post) => {
                const profileHref = post.user_id ? `/users/${post.user_id}` : "/profile";
                const isBookmarked = bookmarkedPostIds.includes(post.id);

                return (
                  <article
                    key={post.id}
                    style={{
                      border: `1px solid ${theme.border}`,
                      borderRadius: "20px",
                      padding: "18px",
                      background: theme.card,
                      boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "14px",
                        alignItems: "flex-start",
                      }}
                    >
                      {getAvatarUrl(post) ? (
                        <Link href={profileHref} style={{ flexShrink: 0 }}>
                          <img
                            src={getAvatarUrl(post)!}
                            alt="avatar"
                            style={{
                              width: "52px",
                              height: "52px",
                              borderRadius: "9999px",
                              objectFit: "cover",
                              border: `1px solid ${theme.border}`,
                            }}
                          />
                        </Link>
                      ) : (
                        <Link
                          href={profileHref}
                          style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "9999px",
                            background: theme.accent,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            textDecoration: "none",
                            fontWeight: "bold",
                            flexShrink: 0,
                          }}
                        >
                          {getDisplayName(post).slice(0, 1).toUpperCase()}
                        </Link>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            marginBottom: "10px",
                            flexWrap: "wrap",
                          }}
                        >
                          <Link
                            href={profileHref}
                            style={{
                              fontWeight: "bold",
                              color: theme.text,
                              textDecoration: "none",
                            }}
                          >
                            {getDisplayName(post)}
                          </Link>

                          <span style={{ color: theme.muted }}>
                            @{getUsername(post)}
                          </span>

                          <span style={{ color: theme.muted, fontSize: "13px" }}>
                            ・ {formatDate(post.created_at)}
                          </span>
                        </div>

                        <p
                          style={{
                            margin: 0,
                            marginBottom: post.image_url ? "12px" : "14px",
                            fontSize: "17px",
                            lineHeight: 1.75,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            color: theme.text,
                          }}
                        >
                          {post.content}
                        </p>

                        {post.image_url && (
                          <div
                            style={{
                              marginBottom: "14px",
                              border: `1px solid ${theme.border}`,
                              borderRadius: "18px",
                              overflow: "hidden",
                              background: theme.background,
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
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              color: theme.muted,
                              fontSize: "14px",
                              fontWeight: "bold",
                            }}
                          >
                            ❤️ いいね {post.likes}
                          </span>

                          <button
                            onClick={() => handleRemoveBookmark(post.id)}
                            style={{
                              background: "transparent",
                              color: isBookmarked ? "#ffd166" : theme.muted,
                              border: `1px solid ${theme.border}`,
                              padding: "8px 14px",
                              borderRadius: "9999px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: "bold",
                            }}
                          >
                            🔖 ブックマーク解除
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}