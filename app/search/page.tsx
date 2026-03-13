"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Profile = {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type PostUser = {
  user_id: string | null;
  user_email: string | null;
};

type SearchUser = {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  user_email: string | null;
};

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
      const [profileResult, postResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, display_name, bio, avatar_url")
          .or(`display_name.ilike.%${trimmed}%,bio.ilike.%${trimmed}%`)
          .order("display_name", { ascending: true })
          .limit(30),
        supabase
          .from("posts")
          .select("user_id, user_email")
          .ilike("user_email", `%${trimmed}%`)
          .limit(50),
      ]);

      if (profileResult.error) {
        throw new Error(profileResult.error.message);
      }

      if (postResult.error) {
        throw new Error(postResult.error.message);
      }

      const mergedMap: Record<string, SearchUser> = {};

      for (const profile of (profileResult.data ?? []) as Profile[]) {
        mergedMap[profile.user_id] = {
          user_id: profile.user_id,
          display_name: profile.display_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          user_email: null,
        };
      }

      for (const postUser of (postResult.data ?? []) as PostUser[]) {
        if (!postUser.user_id) continue;

        if (mergedMap[postUser.user_id]) {
          mergedMap[postUser.user_id].user_email = postUser.user_email ?? null;
        } else {
          mergedMap[postUser.user_id] = {
            user_id: postUser.user_id,
            display_name: null,
            bio: null,
            avatar_url: null,
            user_email: postUser.user_email ?? null,
          };
        }
      }

      const mergedResults = Object.values(mergedMap).sort((a, b) => {
        const aName = (a.display_name || "").toLowerCase();
        const bName = (b.display_name || "").toLowerCase();
        return aName.localeCompare(bName, "ja");
      });

      setResults(mergedResults);
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
                ユーザー検索
              </div>
            </div>
          </div>
        </header>

        <section
          style={{
            padding: "18px 20px 20px",
            borderBottom: "1px solid #2f3336",
          }}
        >
          <div
            style={{
              background: "#192734",
              border: "1px solid #2f3336",
              borderRadius: "22px",
              padding: "16px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
            }}
          >
            <input
              type="text"
              placeholder="表示名・自己紹介・メール名で検索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: "16px",
                border: "1px solid #2f3336",
                borderRadius: "16px",
                outline: "none",
                background: "#15202b",
                color: "white",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                marginTop: "10px",
                color: "#8899a6",
                fontSize: "13px",
              }}
            >
              名前、自己紹介、メール名の一部で検索できます
            </div>
          </div>
        </section>

        <section style={{ padding: "18px 20px 24px" }}>
          {loading && (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "20px",
                padding: "18px",
                color: "#8899a6",
                background: "#192734",
              }}
            >
              検索中...
            </div>
          )}

          {!loading && errorMessage && (
            <div
              style={{
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

          {!loading && searched && !errorMessage && results.length === 0 && (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "20px",
                padding: "22px",
                color: "#8899a6",
                background: "#192734",
                textAlign: "center",
                boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
              }}
            >
              該当するユーザーが見つかりませんでした。
            </div>
          )}

          {!loading && results.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {results.map((profile) => {
                const shownName = profile.display_name || "名前未設定";
                const shownBio = profile.bio || "自己紹介はまだありません";
                const shownId = profile.user_email
                  ? `@${profile.user_email.split("@")[0]}`
                  : "@user";

                return (
                  <Link
                    key={profile.user_id}
                    href={`/users/${profile.user_id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "18px",
                      border: "1px solid #2f3336",
                      borderRadius: "22px",
                      textDecoration: "none",
                      color: "white",
                      background: "#192734",
                      boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                    }}
                  >
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="avatar"
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid #2f3336",
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
                          background: "#1d9bf0",
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
                        }}
                      >
                        {shownName}
                      </div>

                      <div
                        style={{
                          color: "#8899a6",
                          fontSize: "13px",
                          marginBottom: "6px",
                          wordBreak: "break-all",
                        }}
                      >
                        {shownId}
                      </div>

                      <div
                        style={{
                          color: "#cfd9de",
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