"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Post = {
  id: number;
  content: string;
  created_at: string;
  likes: number;
  user_id: string | null;
  user_email: string | null;
};

type Profile = {
  id?: number;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme_background_color: string | null;
  theme_card_color: string | null;
  theme_text_color: string | null;
  theme_accent_color: string | null;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_CARD = "#192734";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";

export default function ProfilePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

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

  const applyPreset = (preset: "black" | "white" | "navy") => {
    if (preset === "black") {
      setThemeBackgroundColor("#000000");
      setThemeCardColor("#111111");
      setThemeTextColor("#ffffff");
      setThemeAccentColor("#1d9bf0");
      return;
    }

    if (preset === "white") {
      setThemeBackgroundColor("#f5f7fa");
      setThemeCardColor("#ffffff");
      setThemeTextColor("#111111");
      setThemeAccentColor("#2563eb");
      return;
    }

    setThemeBackgroundColor("#15202b");
    setThemeCardColor("#192734");
    setThemeTextColor("#ffffff");
    setThemeAccentColor("#1d9bf0");
  };

  const loadPage = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      setUserEmail(user?.email ?? null);
      setUserId(user?.id ?? null);

      if (!user?.id) {
        setPosts([]);
        setDisplayName("");
        setBio("");
        setAvatarUrl("");
        setThemeBackgroundColor(DEFAULT_BACKGROUND);
        setThemeCardColor(DEFAULT_CARD);
        setThemeTextColor(DEFAULT_TEXT);
        setThemeAccentColor(DEFAULT_ACCENT);
        return;
      }

      const [profileResult, postsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("posts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const profileData = profileResult.data as Profile | null;
      const postsData = (postsResult.data ?? []) as Post[];

      if (profileResult.error) {
        console.error(profileResult.error);
      }

      if (postsResult.error) {
        console.error(postsResult.error);
      }

      if (profileData) {
        setDisplayName(profileData.display_name ?? "");
        setBio(profileData.bio ?? "");
        setAvatarUrl(profileData.avatar_url ?? "");
        setThemeBackgroundColor(
          profileData.theme_background_color ?? DEFAULT_BACKGROUND
        );
        setThemeCardColor(profileData.theme_card_color ?? DEFAULT_CARD);
        setThemeTextColor(profileData.theme_text_color ?? DEFAULT_TEXT);
        setThemeAccentColor(profileData.theme_accent_color ?? DEFAULT_ACCENT);
      } else {
        setDisplayName(user.email?.split("@")[0] ?? "");
        setBio("");
        setAvatarUrl("");
        setThemeBackgroundColor(DEFAULT_BACKGROUND);
        setThemeCardColor(DEFAULT_CARD);
        setThemeTextColor(DEFAULT_TEXT);
        setThemeAccentColor(DEFAULT_ACCENT);
      }

      setPosts(postsData);
    } catch (error) {
      console.error(error);
      setErrorMessage("読み込み失敗。もう一度試してみて。");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!userId) {
      alert("ログインしてね");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop() || "png";
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        alert("画像アップロード失敗: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      alert("画像アップロードできた！");
    } catch (error) {
      console.error(error);
      alert("画像アップロード失敗");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) {
      alert("ログインしてね");
      return;
    }

    setSaving(true);

    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        alert("確認失敗: " + checkError.message);
        return;
      }

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            display_name: displayName,
            bio,
            avatar_url: avatarUrl,
            theme_background_color: themeBackgroundColor,
            theme_card_color: themeCardColor,
            theme_text_color: themeTextColor,
            theme_accent_color: themeAccentColor,
          })
          .eq("user_id", userId);

        if (updateError) {
          alert("保存失敗: " + updateError.message);
          return;
        }
      } else {
        const { error: insertError } = await supabase.from("profiles").insert({
          user_id: userId,
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
          theme_background_color: themeBackgroundColor,
          theme_card_color: themeCardColor,
          theme_text_color: themeTextColor,
          theme_accent_color: themeAccentColor,
        });

        if (insertError) {
          alert("保存失敗: " + insertError.message);
          return;
        }
      }

      await loadPage();
      alert("プロフィール保存できた！");
    } catch (error) {
      console.error(error);
      alert("保存失敗");
    } finally {
      setSaving(false);
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

  const shownName = displayName || userEmail?.split("@")[0] || "未ログイン";
  const shownId = userEmail?.split("@")[0] || "guest";

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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              marginBottom: "12px",
            }}
          >
            <div>
              <Link
                href="/"
                style={{
                  color: theme.accent,
                  textDecoration: "none",
                  fontSize: "14px",
                  display: "inline-block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                ← ホームに戻る
              </Link>

              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: theme.text,
                  letterSpacing: "-0.02em",
                }}
              >
                Ulein
              </div>
            </div>
          </div>
        </header>

        <section
          style={{
            padding: "22px 20px 20px",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: "24px",
              padding: "20px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "18px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  style={{
                    width: "92px",
                    height: "92px",
                    borderRadius: "9999px",
                    objectFit: "cover",
                    border: `2px solid ${theme.border}`,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.14)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "92px",
                    height: "92px",
                    borderRadius: "9999px",
                    background: theme.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "34px",
                    fontWeight: "bold",
                    color: "#ffffff",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.14)",
                  }}
                >
                  {shownName.charAt(0).toUpperCase()}
                </div>
              )}

              <div style={{ minWidth: 0, flex: 1 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "30px",
                    fontWeight: 800,
                    color: theme.text,
                    wordBreak: "break-all",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {shownName}
                </h1>

                <div
                  style={{
                    marginTop: "6px",
                    marginBottom: "14px",
                    color: theme.muted,
                    fontSize: "15px",
                    wordBreak: "break-all",
                  }}
                >
                  @{shownId}
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    color: theme.softText,
                    wordBreak: "break-word",
                  }}
                >
                  {bio || "自己紹介をまだ設定していません。"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            padding: "20px",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 800,
                color: theme.text,
                letterSpacing: "-0.02em",
              }}
            >
              プロフィール編集
            </h2>

            <div
              style={{
                color: theme.muted,
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              自分の見た目をカスタム
            </div>
          </div>

          {errorMessage && (
            <div
              style={{
                marginBottom: "14px",
                border: "1px solid rgba(255,107,107,0.25)",
                background: "rgba(255,107,107,0.08)",
                color: "#ffb4b4",
                borderRadius: "16px",
                padding: "12px 14px",
                fontSize: "14px",
              }}
            >
              {errorMessage}
            </div>
          )}

          {!userId ? (
            <div
              style={{
                border: `1px solid ${theme.border}`,
                borderRadius: "18px",
                padding: "18px",
                color: theme.muted,
                background: theme.card,
              }}
            >
              ログインするとプロフィール編集ができる
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div
                style={{
                  background: theme.card,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "20px",
                  padding: "16px",
                  boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="表示名"
                    style={{
                      padding: "14px",
                      borderRadius: "14px",
                      border: `1px solid ${theme.border}`,
                      background: theme.background,
                      color: theme.text,
                      fontSize: "16px",
                    }}
                  />

                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="自己紹介"
                    style={{
                      minHeight: "120px",
                      padding: "14px",
                      borderRadius: "14px",
                      border: `1px solid ${theme.border}`,
                      background: theme.background,
                      color: theme.text,
                      fontSize: "16px",
                      resize: "vertical",
                    }}
                  />

                  <input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="アイコン画像URL"
                    style={{
                      padding: "14px",
                      borderRadius: "14px",
                      border: `1px solid ${theme.border}`,
                      background: theme.background,
                      color: theme.text,
                      fontSize: "16px",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "16px",
                  borderRadius: "20px",
                  border: `1px solid ${theme.border}`,
                  background: theme.card,
                  boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    color: theme.text,
                    fontSize: "16px",
                  }}
                >
                  アイコン画像アップロード
                </div>

                <label style={{ fontSize: "14px", color: theme.muted }}>
                  画像ファイルからアップロード
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  style={{
                    color: theme.text,
                    fontSize: "14px",
                  }}
                />

                <span
                  style={{
                    fontSize: "13px",
                    color: theme.muted,
                  }}
                >
                  {uploading ? "アップロード中..." : "画像を選ぶとアップロードされる"}
                </span>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "20px",
                  border: `1px solid ${theme.border}`,
                  background: theme.card,
                  boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "14px",
                    color: theme.text,
                    fontSize: "16px",
                  }}
                >
                  テーマ設定
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "14px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => applyPreset("black")}
                    style={{
                      background: "#111111",
                      color: "#ffffff",
                      border: "1px solid #333333",
                      padding: "10px 14px",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    黒
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("white")}
                    style={{
                      background: "#ffffff",
                      color: "#111111",
                      border: "1px solid #cccccc",
                      padding: "10px 14px",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    白
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("navy")}
                    style={{
                      background: "#15202b",
                      color: "#ffffff",
                      border: "1px solid #2f3336",
                      padding: "10px 14px",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    紺
                  </button>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  <input
                    value={themeBackgroundColor}
                    onChange={(e) => setThemeBackgroundColor(e.target.value)}
                    placeholder="背景色 例: #15202b"
                    style={{
                      padding: "12px",
                      borderRadius: "14px",
                      border: `1px solid ${theme.border}`,
                      background: theme.background,
                      color: theme.text,
                      fontSize: "15px",
                    }}
                  />

                  <input
                    value={themeCardColor}
                    onChange={(e) => setThemeCardColor(e.target.value)}
                    placeholder="カード色 例: #192734"
                    style={{
                      padding: "12px",
                      borderRadius: "14px",
                      border: `1px solid ${theme.border}`,
                      background: theme.background,
                      color: theme.text,
                      fontSize: "15px",
                    }}
                  />

                  <input
                    value={themeTextColor}
                    onChange={(e) => setThemeTextColor(e.target.value)}
                    placeholder="文字色 例: #ffffff"
                    style={{
                      padding: "12px",
                      borderRadius: "14px",
                      border: `1px solid ${theme.border}`,
                      background: theme.background,
                      color: theme.text,
                      fontSize: "15px",
                    }}
                  />

                  <input
                    value={themeAccentColor}
                    onChange={(e) => setThemeAccentColor(e.target.value)}
                    placeholder="アクセント色 例: #1d9bf0"
                    style={{
                      padding: "12px",
                      borderRadius: "14px",
                      border: `1px solid ${theme.border}`,
                      background: theme.background,
                      color: theme.text,
                      fontSize: "15px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || uploading}
                  style={{
                    background: saving || uploading ? "#375a7f" : theme.accent,
                    color: "#ffffff",
                    border: "none",
                    padding: "12px 22px",
                    borderRadius: "9999px",
                    fontWeight: 800,
                    cursor: saving || uploading ? "not-allowed" : "pointer",
                    boxShadow:
                      saving || uploading
                        ? "none"
                        : "0 8px 20px rgba(29,155,240,0.28)",
                  }}
                >
                  {saving ? "保存中..." : uploading ? "アップロード中..." : "保存"}
                </button>

                <button
                  onClick={loadPage}
                  disabled={loading}
                  style={{
                    background: theme.card,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    padding: "12px 20px",
                    borderRadius: "9999px",
                    fontWeight: "bold",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  再読み込み
                </button>
              </div>
            </div>
          )}
        </section>

        <section style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 800,
                color: theme.text,
                letterSpacing: "-0.02em",
              }}
            >
              自分の投稿
            </h2>

            <div
              style={{
                color: theme.muted,
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              最新10件
            </div>
          </div>

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
          ) : !userId ? (
            <div
              style={{
                border: `1px solid ${theme.border}`,
                borderRadius: "18px",
                padding: "18px",
                color: theme.muted,
                background: theme.card,
              }}
            >
              ログインすると自分の投稿が表示される
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
              まだ自分の投稿がない
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
                      gap: "8px",
                      alignItems: "center",
                      marginBottom: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: "bold", color: theme.text }}>
                      {displayName || post.user_email || "Ulein"}
                    </span>
                    <span style={{ color: theme.muted }}>@{shownId}</span>
                    <span style={{ color: theme.muted, fontSize: "13px" }}>
                      ・ {formatDate(post.created_at)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      marginBottom: "12px",
                      fontSize: "17px",
                      lineHeight: 1.75,
                      whiteSpace: "pre-wrap",
                      color: theme.text,
                      wordBreak: "break-word",
                    }}
                  >
                    {post.content}
                  </p>

                  <div
                    style={{
                      color: theme.muted,
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    ❤️ いいね {post.likes}
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