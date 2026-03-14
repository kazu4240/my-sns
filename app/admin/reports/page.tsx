"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Report = {
  id: number;
  reporter_user_id: string;
  target_user_id: string | null;
  post_id: number;
  reason: string;
  detail: string | null;
  status: string;
  created_at: string;
};

type Profile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  theme_background_color?: string | null;
  theme_card_color?: string | null;
  theme_text_color?: string | null;
  theme_accent_color?: string | null;
  is_admin?: boolean | null;
};

type Post = {
  id: number;
  content: string;
  user_id: string | null;
  user_email: string | null;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_CARD = "#192734";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [posts, setPosts] = useState<Record<number, Post>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

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

      if (!user) {
        setIsAdmin(false);
        setReports([]);
        setProfiles({});
        setPosts({});
        setErrorMessage("ログインしてね");
        setLoading(false);
        return;
      }

      const { data: myProfile, error: myProfileError } = await supabase
        .from("profiles")
        .select(
          "user_id, display_name, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, is_admin"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (myProfileError) {
        throw new Error(myProfileError.message);
      }

      setThemeBackgroundColor(myProfile?.theme_background_color ?? DEFAULT_BACKGROUND);
      setThemeCardColor(myProfile?.theme_card_color ?? DEFAULT_CARD);
      setThemeTextColor(myProfile?.theme_text_color ?? DEFAULT_TEXT);
      setThemeAccentColor(myProfile?.theme_accent_color ?? DEFAULT_ACCENT);

      if (!myProfile?.is_admin) {
        setIsAdmin(false);
        setReports([]);
        setProfiles({});
        setPosts({});
        setErrorMessage("管理者だけが見れるページです");
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      const { data: reportsData, error: reportsError } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (reportsError) {
        throw new Error(reportsError.message);
      }

      const reportsList = (reportsData ?? []) as Report[];
      setReports(reportsList);

      const userIds = Array.from(
        new Set(
          reportsList.flatMap((report) =>
            [report.reporter_user_id, report.target_user_id].filter(
              (value): value is string => !!value
            )
          )
        )
      );

      const postIds = Array.from(new Set(reportsList.map((report) => report.post_id)));

      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        if (profileError) {
          console.error(profileError);
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

      if (postIds.length > 0) {
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("id, content, user_id, user_email")
          .in("id", postIds);

        if (postError) {
          console.error(postError);
        } else {
          const postMap: Record<number, Post> = {};
          for (const post of postData ?? []) {
            postMap[post.id] = post;
          }
          setPosts(postMap);
        }
      } else {
        setPosts({});
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("通報一覧の読み込みに失敗しました。");
      setReports([]);
      setProfiles({});
      setPosts({});
      setIsAdmin(false);
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

  const getUserName = (userId: string | null) => {
    if (!userId) return "不明";
    return profiles[userId]?.display_name || userId;
  };

  const handleAdminDeletePost = async (postId: number) => {
    const ok = window.confirm("この投稿を管理者権限で削除します。よろしいですか？");
    if (!ok) return;

    setDeletingPostId(postId);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      if (!accessToken) {
        alert("ログイン情報が見つかりません");
        setDeletingPostId(null);
        return;
      }

      const response = await fetch("/api/admin/delete-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ postId }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert("削除失敗: " + (result.error || "不明なエラー"));
        setDeletingPostId(null);
        return;
      }

      setPosts((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });

      alert("投稿を削除しました");
    } catch (error) {
      console.error(error);
      alert("投稿削除に失敗しました");
    } finally {
      setDeletingPostId(null);
    }
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
          maxWidth: "820px",
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
            通報一覧（管理者）
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
          ) : !isAdmin ? null : reports.length === 0 ? (
            <div
              style={{
                border: `1px solid ${theme.border}`,
                borderRadius: "18px",
                padding: "18px",
                color: theme.muted,
                background: theme.card,
              }}
            >
              まだ通報がない
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {reports.map((report) => {
                const post = posts[report.post_id];

                return (
                  <article
                    key={report.id}
                    style={{
                      border: `1px solid ${theme.border}`,
                      borderRadius: "22px",
                      padding: "18px",
                      background: theme.card,
                      boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                        marginBottom: "14px",
                      }}
                    >
                      <div style={{ fontWeight: "bold", color: theme.text }}>
                        通報 #{report.id}
                      </div>
                      <div style={{ color: theme.muted, fontSize: "13px" }}>
                        {formatDate(report.created_at)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "8px",
                        marginBottom: "14px",
                        color: theme.softText,
                        fontSize: "14px",
                      }}
                    >
                      <div>
                        <strong>通報者:</strong> {getUserName(report.reporter_user_id)}
                      </div>
                      <div>
                        <strong>対象ユーザー:</strong> {getUserName(report.target_user_id)}
                      </div>
                      <div>
                        <strong>理由:</strong> {report.reason}
                      </div>
                      <div>
                        <strong>状態:</strong> {report.status}
                      </div>
                    </div>

                    {report.detail && (
                      <div
                        style={{
                          marginBottom: "14px",
                          padding: "12px 14px",
                          borderRadius: "16px",
                          border: `1px solid ${theme.border}`,
                          background: theme.background,
                          color: theme.text,
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.7,
                        }}
                      >
                        {report.detail}
                      </div>
                    )}

                    {post ? (
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: "16px",
                          border: `1px solid ${theme.border}`,
                          background: theme.background,
                        }}
                      >
                        <div
                          style={{
                            color: theme.muted,
                            fontSize: "13px",
                            marginBottom: "8px",
                          }}
                        >
                          対象投稿
                        </div>

                        <div
                          style={{
                            color: theme.text,
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.7,
                            marginBottom: "12px",
                          }}
                        >
                          {post.content}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <Link
                            href={`/posts/${post.id}`}
                            style={{
                              color: theme.accent,
                              textDecoration: "none",
                              fontSize: "14px",
                              fontWeight: "bold",
                            }}
                          >
                            投稿を見る
                          </Link>

                          <button
                            onClick={() => handleAdminDeletePost(post.id)}
                            disabled={deletingPostId === post.id}
                            style={{
                              background:
                                deletingPostId === post.id ? "#7a3a3a" : "#ff6b6b",
                              color: "#ffffff",
                              border: "none",
                              padding: "8px 14px",
                              borderRadius: "9999px",
                              fontSize: "13px",
                              fontWeight: "bold",
                              cursor:
                                deletingPostId === post.id ? "not-allowed" : "pointer",
                            }}
                          >
                            {deletingPostId === post.id
                              ? "削除中..."
                              : "管理者として削除"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: "16px",
                          border: `1px solid ${theme.border}`,
                          background: theme.background,
                          color: theme.muted,
                        }}
                      >
                        対象投稿は削除済みか見つかりません
                      </div>
                    )}
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