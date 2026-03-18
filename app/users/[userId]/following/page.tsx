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

export default function FollowingPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);

  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Profile[]>([]);
  const [pageUser, setPageUser] = useState<Profile | null>(null);
  const [viewerTheme, setViewerTheme] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const currentTheme = useMemo(() => {
    const textColor = viewerTheme?.theme_text_color || DEFAULT_TEXT;

    return {
      background: viewerTheme?.theme_background_color || DEFAULT_BACKGROUND,
      card: viewerTheme?.theme_card_color || DEFAULT_CARD,
      text: textColor,
      accent: viewerTheme?.theme_accent_color || DEFAULT_ACCENT,
      border: DEFAULT_BORDER,
      muted: textColor === "#000000" ? "#555555" : "#8899a6",
    };
  }, [viewerTheme]);

  const uiScale = viewerTheme?.ui_scale || "normal";

  const sizes =
    uiScale === "compact"
      ? {
          avatar: 44,
          name: 15,
          username: 12,
          bio: 13,
        }
      : uiScale === "large"
      ? {
          avatar: 60,
          name: 18,
          username: 14,
          bio: 15,
        }
      : {
          avatar: 52,
          name: 16,
          username: 13,
          bio: 14,
        };

  const loadFollowing = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const signedInUserId = user?.id ?? null;
      setCurrentUserId(signedInUserId);

      const [pageUserResult, myThemeResult, followRowsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
          )
          .eq("user_id", userId)
          .maybeSingle(),
        signedInUserId
          ? supabase
              .from("profiles")
              .select(
                "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
              )
              .eq("user_id", signedInUserId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from("follows")
          .select("following_user_id")
          .eq("follower_user_id", userId),
      ]);

      if (pageUserResult.error) {
        console.error(pageUserResult.error);
      }

      if (followRowsResult.error) {
        throw new Error(followRowsResult.error.message);
      }

      setPageUser((pageUserResult.data as Profile | null) ?? null);
      setViewerTheme((myThemeResult.data as Profile | null) ?? null);

      const rows = (followRowsResult.data ?? []) as FollowRow[];
      const followingIds = rows.map((row) => row.following_user_id);

      if (followingIds.length === 0) {
        setFollowingUsers([]);
        setLoading(false);
        return;
      }

      const { data: followingProfiles, error: followingProfilesError } = await supabase
        .from("profiles")
        .select(
          "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
        )
        .in("user_id", followingIds);

      if (followingProfilesError) {
        throw new Error(followingProfilesError.message);
      }

      const sortedFollowingUsers = followingIds
        .map((id) =>
          ((followingProfiles ?? []) as Profile[]).find((profile) => profile.user_id === id)
        )
        .filter((profile): profile is Profile => !!profile);

      setFollowingUsers(sortedFollowingUsers);
    } catch (error) {
      console.error(error);
      setFollowingUsers([]);
      setErrorMessage("フォロー中一覧の読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowing();
  }, [userId]);

  const pageName = pageUser?.display_name || pageUser?.username || "ユーザー";

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
            href={`/users/${userId}`}
            style={{
              color: currentTheme.accent,
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-block",
              marginBottom: "8px",
            }}
          >
            ← プロフィールに戻る
          </Link>

          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            {pageName} のフォロー中
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
          ) : followingUsers.length === 0 ? (
            <p style={{ padding: "20px", color: currentTheme.muted }}>
              まだ誰もフォローしていない
            </p>
          ) : (
            followingUsers.map((profile) => {
              const shownName = profile.display_name || profile.username || "ユーザー";
              const shownUsername = profile.username || "user";
              const shownBio = profile.bio || "自己紹介はまだありません";

              return (
                <Link
                  key={profile.user_id}
                  href={`/users/${profile.user_id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "18px 20px",
                    borderBottom: `1px solid ${currentTheme.border}`,
                    textDecoration: "none",
                    color: currentTheme.text,
                    background: currentTheme.background,
                  }}
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      style={{
                        width: sizes.avatar,
                        height: sizes.avatar,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `1px solid ${currentTheme.border}`,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: sizes.avatar,
                        height: sizes.avatar,
                        borderRadius: "50%",
                        background: currentTheme.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        flexShrink: 0,
                        color: "#ffffff",
                      }}
                    >
                      {shownName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: sizes.name,
                        marginBottom: "4px",
                        wordBreak: "break-all",
                      }}
                    >
                      {shownName}
                    </div>

                    <div
                      style={{
                        color: currentTheme.muted,
                        fontSize: sizes.username,
                        marginBottom: "4px",
                        wordBreak: "break-all",
                      }}
                    >
                      @{shownUsername}
                    </div>

                    <div
                      style={{
                        color: currentTheme.muted,
                        fontSize: sizes.bio,
                        wordBreak: "break-all",
                      }}
                    >
                      {shownBio}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
