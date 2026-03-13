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
            ユーザー検索
          </h1>
        </header>

        <section
          style={{
            padding: "20px",
            borderBottom: "1px solid #2f3336",
          }}
        >
          <input
            type="text"
            placeholder="表示名・自己紹介・メール名で検索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              fontSize: "16px",
              border: "1px solid #2f3336",
              borderRadius: "12px",
              outline: "none",
              background: "#192734",
              color: "white",
            }}
          />
        </section>

        {loading && (
          <p style={{ padding: "20px", color: "#8899a6" }}>検索中...</p>
        )}

        {!loading && errorMessage && (
          <p style={{ padding: "20px", color: "#ffb4b4" }}>{errorMessage}</p>
        )}

        {!loading && searched && !errorMessage && results.length === 0 && (
          <p style={{ padding: "20px", color: "#8899a6" }}>
            該当するユーザーが見つかりませんでした。
          </p>
        )}

        <section style={{ display: "grid", gap: "0" }}>
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
                  gap: "12px",
                  padding: "18px 20px",
                  borderBottom: "1px solid #2f3336",
                  textDecoration: "none",
                  color: "white",
                  background: "#15202b",
                }}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid #2f3336",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      background: "#1d9bf0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {shownName.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "16px",
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
                      marginBottom: "4px",
                      wordBreak: "break-all",
                    }}
                  >
                    {shownId}
                  </div>

                  <div
                    style={{
                      color: "#8899a6",
                      fontSize: "14px",
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