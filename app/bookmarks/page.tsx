"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

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

type BookmarkRow = {
  post_id: number;
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

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_CARD = "#192734";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";

export default function BookmarksPage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const currentTheme = useMemo(() => {
    if (!currentUserId || !profiles[currentUserId]) {
      return {
        background: DEFAULT_BACKGROUND,
        card: DEFAULT_CARD,
        text: DEFAULT_TEXT,
        accent: DEFAULT_ACCENT,
        border: DEFAULT_BORDER,
        muted: "#8899a6",
      };
    }

    const me = profiles[currentUserId];
    const textColor = me.theme_text_color || DEFAULT_TEXT;

    return {
      background: me.theme_background_color || DEFAULT_BACKGROUND,
      card: me.theme_card_color || DEFAULT_CARD,
      text: textColor,
      accent: me.theme_accent_color || DEFAULT_ACCENT,
      border: DEFAULT_BORDER,
      muted: textColor === "#000000" ? "#555555" : "#8899a6",
    };
  }, [profiles, currentUserId]);

  const uiScale =
    currentUserId && profiles[currentUserId]?.ui_scale
      ? profiles[currentUserId].ui_scale
      : "normal";

  const sizes =
    uiScale === "compact"
      ? {
          avatar: 40,
          postText: 15,
          meta: 12,
        }
      : uiScale === "large"
      ? {
          avatar: 56,
          postText: 18,
          meta: 14,
        }
      : {
          avatar: 48,
          postText: 17,
          meta: 13,
        };

  const loadBookmarks = async () => {
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

      if (!user) {
        setCurrentUserId(null);
        setPosts([]);
        setProfiles({});
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", user.id);

      if (bookmarkError) {
        throw new Error(bookmarkError.message);
      }

      const postIds = ((bookmarkData ?? []) as BookmarkRow[]).map(
        (item) => item.post_id
      );

      if (postIds.length === 0) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select(
            "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (myProfile) {
          setProfiles({
            [user.id]: myProfile as Profile,
          });
        } else {
          setProfiles({});
        }

        setPosts([]);
        setLoading(false);
        return;
      }

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .in("id", postIds)
        .order("created_at", { ascending: false });

      if (postError) {
        throw new Error(postError.message);
      }

      const postsData = (postData ?? []) as Post[];
      setPosts(postsData);

      const userIds = Array.from(
        new Set(
          [user.id, ...postsData.map((post) => post.user_id).filter(Boolean)] as string[]
        )
      );

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
        )
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
      setErrorMessage("ブックマークの読み込みに失敗しました。");
      setPosts([]);
      setProfiles({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
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
    if (post.user_id && profiles[post.user_id]?.username) {
      return profiles[post.user_id].username!;
    }
    return "ユーザー";
  };

  const getUsername = (post: Post) => {
    if (post.user_id && profiles[post.user_id]?.username) {
      return profiles[post.user_id].username!;
    }
    return "user";
  };

  const getAvatarUrl = (post: Post) => {
    if (post.user_id && profiles[post.user_id]?.avatar_url) {
      return profiles[post.user_id].avatar_url!;
    }
    return null;
  };

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
            ブックマーク
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

        <section>
          {loading ? (
            <p style={{ padding: "20px", color: currentTheme.muted }}>
              読み込み中...
            </p>
          ) : posts.length === 0 ? (
            <p style={{ padding: "20px", color: currentTheme.muted }}>
              まだブックマークがない
            </p>
          ) : (
            posts.map((post) => {
              const profileHref = post.user_id ? `/users/${post.user_id}` : "/profile";
              const avatarUrl = getAvatarUrl(post);

              return (
                <article
                  key={post.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "18px 20px",
                    borderBottom: `1px solid ${currentTheme.border}`,
                  }}
                >
                  {avatarUrl ? (
                    <Link href={profileHref}>
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        style={{
                          width: sizes.avatar,
                          height: sizes.avatar,
                          borderRadius: "9999px",
                          objectFit: "cover",
                          border: `1px solid ${currentTheme.border}`,
                        }}
                      />
                    </Link>
                  ) : (
                    <Link
                      href={profileHref}
                      style={{
                        width: sizes.avatar,
                        height: sizes.avatar,
                        borderRadius: "9999px",
                        background: currentTheme.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        color: "#ffffff",
                        textDecoration: "none",
                        flexShrink: 0,
                      }}
                    >
                      {getDisplayName(post).slice(0, 1).toUpperCase()}
                    </Link>
                  )}

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: "8px",
                      }}
                    >
                      <Link
                        href={profileHref}
                        style={{
                          color: currentTheme.text,
                          fontWeight: "bold",
                          textDecoration: "none",
                        }}
                      >
                        {getDisplayName(post)}
                      </Link>

                      <span style={{ color: currentTheme.muted, fontSize: sizes.meta }}>
                        @{getUsername(post)}
                      </span>

                      <span style={{ color: currentTheme.muted, fontSize: sizes.meta }}>
                        ・ {formatDate(post.created_at)}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        marginBottom: post.image_url ? "12px" : "0",
                        color: currentTheme.text,
                        lineHeight: 1.6,
                        fontSize: sizes.postText,
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
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
