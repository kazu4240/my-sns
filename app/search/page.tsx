"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type SearchUser = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type MyThemeProfile = {
  user_id: string;
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

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [theme, setTheme] = useState({
    background: DEFAULT_BACKGROUND,
    card: DEFAULT_CARD,
    text: DEFAULT_TEXT,
    accent: DEFAULT_ACCENT,
    border: DEFAULT_BORDER,
    muted: "#8899a6",
  });

  const [uiScale, setUiScale] = useState("normal");

  useEffect(() => {
    const loadMyTheme = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select(
          "user_id, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      const profile = (data as MyThemeProfile | null) ?? null;
      const textColor = profile?.theme_text_color || DEFAULT_TEXT;

      setTheme({
        background: profile?.theme_background_color || DEFAULT_BACKGROUND,
        card: profile?.theme_card_color || DEFAULT_CARD,
        text: textColor,
        accent: profile?.theme_accent_color || DEFAULT_ACCENT,
        border: DEFAULT_BORDER,
        muted: textColor === "#000000" ? "#555555" : "#8899a6",
      });

      setUiScale(profile?.ui_scale || "normal");
    };

    loadMyTheme();
  }, []);

  const sizes =
    uiScale === "compact"
      ? {
          name: 15,
          username: 12,
          bio: 13,
          avatar: 48,
          input: 15,
        }
      : uiScale === "large"
      ? {
          name: 17,
          username: 14,
          bio: 15,
          avatar: 58,
          input: 17,
        }
      : {
          name: 16,
          username: 13,
          bio: 14,
          avatar: 52,
          input: 16,
        };

  async function searchUsers(word: string) {
    const trimmed = word.trim();

    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setErrorMessage("");
      return;
    }

    setLoading(true);
    setSearched(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, bio, avatar_url")
        .or(
          `display_name.ilike.%${trimmed}%,username.ilike.%${trimmed}%,bio.ilike.%${trimmed}%`
        )
        .order("display_name", { ascending: true })
        .limit(30);

      if (error) {
        throw new Error(error.message);
      }

      setResults((data ?? []) as SearchUser[]);
    } catch (error) {
      console.error("検索エラー:", error);
      setResults([]);
      setErrorMessage("検索に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchUsers(keyword);
    }, 400);

    return () => clearTimeout(timeout);
  }, [keyword]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: theme.background,
        color: theme.text,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "680px",
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
            backdropFilter: "blur(8px)",
            borderBottom: `1px solid ${theme.border}`,
            padding: "18px 20px",
            zIndex: 10,
          }}
        >
          <Link
            href="/"
            style={{
              color: theme.accent,
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
            ユーザー検索
          </h1>
        </header>

        <section
          style={{
            padding: "20px",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <input
            type="text"
            placeholder="表示名・@username・自己紹介で検索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: sizes.input,
              border: `1px solid ${theme.border}`,
              borderRadius: "12px",
              outline: "none",
              background: theme.card,
              color: theme.text,
              boxSizing: "border-box",
            }}
          />
        </section>

        {loading && (
          <p style={{ padding: "20px", color: theme.muted }}>検索中...</p>
        )}

        {!loading && errorMessage && (
          <p style={{ padding: "20px", color: "#ffb4b4" }}>{errorMessage}</p>
        )}

        {!loading && searched && !errorMessage && results.length === 0 && (
          <p style={{ padding: "20px", color: theme.muted }}>
            該当するユーザーが見つかりませんでした。
          </p>
        )}

        <section style={{ display: "grid", gap: "0" }}>
          {results.map((profile) => {
            const shownName = profile.display_name || profile.username || "名前未設定";
            const shownBio = profile.bio || "自己紹介はまだありません";
            const shownUsername = profile.username || "user";

            return (
              <Link
                key={profile.user_id}
                href={`/users/${profile.user_id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "18px 20px",
                  borderBottom: `1px solid ${theme.border}`,
                  textDecoration: "none",
                  color: theme.text,
                  background: theme.background,
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
                      border: `1px solid ${theme.border}`,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: sizes.avatar,
                      height: sizes.avatar,
                      borderRadius: "50%",
                      background: theme.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
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
                      color: theme.muted,
                      fontSize: sizes.username,
                      marginBottom: "4px",
                      wordBreak: "break-all",
                    }}
                  >
                    @{shownUsername}
                  </div>

                  <div
                    style={{
                      color: theme.muted,
                      fontSize: sizes.bio,
                      wordBreak: "break-all",
                    }}
                  >
                    {shownBio}
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
