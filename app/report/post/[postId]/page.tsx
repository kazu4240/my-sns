"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../lib/supabase";

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

export default function ReportPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(params);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [reason, setReason] = useState("スパム");
  const [detail, setDetail] = useState("");
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

  const numericPostId = Number(postId);

  const loadMyTheme = async (signedInUserId: string | null) => {
    if (!signedInUserId) {
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
      .eq("user_id", signedInUserId)
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
      await loadMyTheme(signedInUserId);

      if (!Number.isFinite(numericPostId)) {
        setErrorMessage("投稿が見つかりません。");
        setPost(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", numericPostId)
        .maybeSingle();

      if (postError) {
        throw new Error(postError.message);
      }

      if (!postData) {
        setErrorMessage("投稿が見つかりません。");
        setPost(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const targetPost = postData as Post;
      setPost(targetPost);

      if (targetPost.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, display_name, bio, avatar_url")
          .eq("user_id", targetPost.user_id)
          .maybeSingle();

        if (profileError) {
          console.error(profileError);
          setProfile(null);
        } else {
          setProfile((profileData as Profile | null) ?? null);
        }
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("通報ページの読み込みに失敗しました。");
      setPost(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [postId]);

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
    profile?.display_name || post?.user_email?.split("@")[0] || "ユーザー";

  const shownId = post?.user_email?.split("@")[0] || "user";

  const shownAvatarUrl = profile?.avatar_url || null;

  const handleSubmitReport = async () => {
    if (!currentUserId) {
      alert("通報するにはログインしてね");
      return;
    }

    if (!post) {
      alert("投稿が見つかりません");
      return;
    }

    if (post.user_id && post.user_id === currentUserId) {
      alert("自分の投稿は通報できないよ");
      return;
    }

    if (!reason.trim()) {
      alert("通報理由を選んでね");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("reports").insert({
        reporter_user_id: currentUserId,
        target_user_id: post.user_id,
        post_id: post.id,
        reason,
        detail: detail.trim() || null,
      });

      if (error) {
        alert("通報失敗: " + error.message);
        setSubmitting(false);
        return;
      }

      alert("通報を送信しました");
      setDetail("");
    } catch (error) {
      console.error(error);
      alert("通報に失敗しました");
    } finally {
      setSubmitting(false);
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
            投稿を通報
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
          ) : !post ? null : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
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
                    gap: "14px",
                    alignItems: "flex-start",
                  }}
                >
                  {shownAvatarUrl ? (
                    <img
                      src={shownAvatarUrl}
                      alt="avatar"
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `1px solid ${theme.border}`,
                        flexShrink: 0,
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
                      }}
                    >
                      {shownName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontWeight: "bold", color: theme.text }}>
                        {shownName}
                      </span>
                      <span style={{ color: theme.muted }}>@{shownId}</span>
                      <span style={{ color: theme.muted, fontSize: "13px" }}>
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
                        color: theme.text,
                      }}
                    >
                      {post.content}
                    </p>

                    {post.image_url && (
                      <div
                        style={{
                          marginTop: "12px",
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
                  </div>
                </div>
              </div>

              <div
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
                    fontWeight: "bold",
                    fontSize: "18px",
                    marginBottom: "14px",
                    color: theme.text,
                  }}
                >
                  通報内容
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      padding: "14px",
                      borderRadius: "14px",
                      border: `1px solid ${theme.border}`,
                      background: theme.background,
                      color: theme.text,
                      fontSize: "15px",
                    }}
                  >
                    <option value="スパム">スパム</option>
                    <option value="嫌がらせ">嫌がらせ</option>
                    <option value="不適切な内容">不適切な内容</option>
                    <option value="なりすまし">なりすまし</option>
                    <option value="その他">その他</option>
                  </select>

                  <textarea
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="補足があれば書いてください"
                    style={{
                      minHeight: "140px",
                      padding: "14px",
                      borderRadius: "14px",
                      border: `1px solid ${theme.border}`,
                      background: theme.background,
                      color: theme.text,
                      fontSize: "15px",
                      resize: "vertical",
                    }}
                  />

                  <button
                    onClick={handleSubmitReport}
                    disabled={submitting}
                    style={{
                      background: submitting ? "#375a7f" : "#ff6b6b",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px 18px",
                      borderRadius: "9999px",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: submitting ? "not-allowed" : "pointer",
                      justifySelf: "start",
                    }}
                  >
                    {submitting ? "送信中..." : "通報する"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}