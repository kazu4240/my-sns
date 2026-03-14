"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../lib/supabase";

type FollowRow = {
  following_user_id: string;
};

type Profile = {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme_background_color: string | null;
  theme_card_color: string | null;
  theme_text_color: string | null;
  theme_accent_color: string | null;
};

type PostUser = {
  user_id: string | null;
  user_email: string | null;
};

type UserCard = {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  user_email: string | null;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_CARD = "#192734";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";

export default function FollowingPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserCard[]>([]);
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

  const loadTheme = async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setThemeBackgroundColor(DEFAULT_BACKGROUND);
      setThemeCardColor(DEFAULT_CARD);
      setThemeTextColor(DEFAULT_TEXT);
      setThemeAccentColor(DEFAULT_ACCENT);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "theme_background_color, theme_card_color, theme_text_color, theme_accent_color"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setThemeBackgroundColor(DEFAULT_BACKGROUND);
      setThemeCardColor(DEFAULT_CARD);
      setThemeTextColor(DEFAULT_TEXT);
      setThemeAccentColor(DEFAULT_ACCENT);
      return;
    }

    setThemeBackgroundColor(data?.theme_background_color ?? DEFAULT_BACKGROUND);
    setThemeCardColor(data?.theme_card_color ?? DEFAULT_CARD);
    setThemeTextColor(data?.theme_text_color ?? DEFAULT_TEXT);
    setThemeAccentColor(data?.theme_accent_color ?? DEFAULT_ACCENT);
  };

  const loadFollowing = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      await loadTheme();

      const { data: followsData, error: followsError } = await supabase
        .from("follows")
        .select("following_user_id")
        .eq("follower_user_id", userId);

      if (followsError) {
        throw new Error(followsError.message);
      }

      const followingIds = Array.from(
        new Set(
          ((followsData ?? []) as FollowRow[])
            .map((row) => row.following_user_id)
            .filter(Boolean)
        )
      );

      if (followingIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const [profilesResult, postsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, display_name, bio, avatar_url")
          .in("user_id", followingIds),
        supabase
          .from("posts")
          .select("user_id, user_email")
          .in("user_id", followingIds),
      ]);

      if (profilesResult.error) {
        throw new Error(profilesResult.error.message);
      }

      if (postsResult.error) {
        throw new Error(postsResult.error.message);
      }

      const userMap: Record<string, UserCard> = {};

      for (const id of followingIds) {
        userMap[id] = {
          user_id: id,
          display_name: null,
          bio: null,
          avatar_url: null,
          user_email: null,
        };
      }

      for (const profile of (profilesResult.data ?? []) as Profile[]) {
        userMap[profile.user_id] = {
          ...userMap[profile.user_id],
          user_id: profile.user_id,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
        };
      }

      for (const post of (postsResult.data ?? []) as PostUser[]) {
        if (!post.user_id) continue;

        if (!userMap[post.user_id]) {
          userMap[post.user_id] = {
            user_id: post.user_id,
            display_name: null,
            bio: null,
            avatar_url: null,
            user_email: post.user_email ?? null,
          };
        } else if (!userMap[post.user_id].user_email && post.user_email) {
          userMap[post.user_id].user_email = post.user_email;
        }
      }

      const mergedUsers = followingIds
        .map((id) => userMap[id])
        .filter(Boolean)
        .sort((a, b) => {
          const aName = (a.display_name || a.user_email || "").toLowerCase();
          const bName = (b.display_name || b.user_email || "").toLowerCase();
          return aName.localeCompare(bName, "ja");
        });

      setUsers(mergedUsers);
    } catch (error) {
      console.error(error);
      setUsers([]);
      setErrorMessage("フォロー中一覧の読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowing();
  }, [userId]);

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
          boxShadow: "0 0 0 1px rgba(0,0,0,0.02)",
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
            href={`/users/${userId}`}
            style={{
              color: theme.accent,
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-block",
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            ← プロフィールに戻る
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
            フォロー中一覧
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

        <section style={{ padding: "18px 20px 24px" }}>
          {loading ? (
            <div
              style={{
                border: `1px solid ${theme.border}`,
                borderRadius: "20px",
                padding: "18px",
                color: theme.muted,
                background: theme.card,
              }}
            >
              読み込み中...
            </div>
          ) : users.length === 0 ? (
            <div
              style={{
                border: `1px solid ${theme.border}`,
                borderRadius: "20px",
                padding: "22px",
                color: theme.muted,
                background: theme.card,
                textAlign: "center",
                boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
              }}
            >
              まだ誰もフォローしていません
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {users.map((user) => {
                const shownName =
                  user.display_name || user.user_email?.split("@")[0] || "名前未設定";
                const shownId = user.user_email
                  ? `@${user.user_email.split("@")[0]}`
                  : "@user";
                const shownBio = user.bio || "自己紹介はまだありません";

                return (
                  <Link
                    key={user.user_id}
                    href={`/users/${user.user_id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "18px",
                      border: `1px solid ${theme.border}`,
                      borderRadius: "22px",
                      textDecoration: "none",
                      color: theme.text,
                      background: theme.card,
                      boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                    }}
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="avatar"
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: `1px solid ${theme.border}`,
                          flexShrink: 0,
                          boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          background: theme.accent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          fontWeight: "bold",
                          flexShrink: 0,
                          color: "#ffffff",
                          boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
                        }}
                      >
                        {shownName.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "17px",
                          marginBottom: "4px",
                          wordBreak: "break-all",
                          color: theme.text,
                        }}
                      >
                        {shownName}
                      </div>

                      <div
                        style={{
                          color: theme.muted,
                          fontSize: "13px",
                          marginBottom: "6px",
                          wordBreak: "break-all",
                        }}
                      >
                        {shownId}
                      </div>

                      <div
                        style={{
                          color: theme.softText,
                          fontSize: "14px",
                          lineHeight: 1.6,
                          wordBreak: "break-word",
                        }}
                      >
                        {shownBio}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}