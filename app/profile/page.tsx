"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

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
const DEFAULT_UI_SCALE = "normal";
const DEFAULT_BORDER = "#2f3336";

const PRESET_THEMES = [
  {
    name: "紺",
    background: "#15202b",
    card: "#192734",
    text: "#ffffff",
    accent: "#1d9bf0",
  },
  {
    name: "黒",
    background: "#000000",
    card: "#16181c",
    text: "#ffffff",
    accent: "#1d9bf0",
  },
  {
    name: "白",
    background: "#ffffff",
    card: "#f7f9f9",
    text: "#0f1419",
    accent: "#1d9bf0",
  },
];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [themeBackgroundColor, setThemeBackgroundColor] =
    useState(DEFAULT_BACKGROUND);
  const [themeCardColor, setThemeCardColor] = useState(DEFAULT_CARD);
  const [themeTextColor, setThemeTextColor] = useState(DEFAULT_TEXT);
  const [themeAccentColor, setThemeAccentColor] = useState(DEFAULT_ACCENT);
  const [uiScale, setUiScale] = useState(DEFAULT_UI_SCALE);

  const [errorMessage, setErrorMessage] = useState("");

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
  }, [
    themeBackgroundColor,
    themeCardColor,
    themeTextColor,
    themeAccentColor,
  ]);

  const uiSize = useMemo(() => {
    if (uiScale === "compact") {
      return {
        avatar: 72,
        title: 24,
        text: 14,
        label: 13,
        input: 14,
        button: 13,
        buttonPaddingY: 8,
        buttonPaddingX: 14,
      };
    }

    if (uiScale === "large") {
      return {
        avatar: 100,
        title: 30,
        text: 17,
        label: 15,
        input: 16,
        button: 15,
        buttonPaddingY: 11,
        buttonPaddingX: 18,
      };
    }

    return {
      avatar: 88,
      title: 28,
      text: 15,
      label: 14,
      input: 15,
      button: 14,
      buttonPaddingY: 10,
      buttonPaddingX: 16,
    };
  }, [uiScale]);

  const loadProfile = async () => {
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
        setUserId(null);
        setUserEmail(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      const profile = (data as Profile | null) ?? null;

      setDisplayName(profile?.display_name ?? "");
      setUsername(profile?.username ?? "");
      setBio(profile?.bio ?? "");
      setAvatarUrl(profile?.avatar_url ?? "");
      setThemeBackgroundColor(
        profile?.theme_background_color ?? DEFAULT_BACKGROUND
      );
      setThemeCardColor(profile?.theme_card_color ?? DEFAULT_CARD);
      setThemeTextColor(profile?.theme_text_color ?? DEFAULT_TEXT);
      setThemeAccentColor(profile?.theme_accent_color ?? DEFAULT_ACCENT);
      setUiScale(profile?.ui_scale ?? DEFAULT_UI_SCALE);
    } catch (error) {
      console.error(error);
      setErrorMessage("プロフィールの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop() || "png";
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      alert("アイコン画像をアップしました");
    } catch (error) {
      console.error(error);
      alert("アイコン画像アップロード失敗");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const validateUsername = (value: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(value);
  };

  const handleSaveProfile = async () => {
    if (!userId) {
      alert("ログインしてね");
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      alert("username を入力してね");
      return;
    }

    if (!validateUsername(trimmedUsername)) {
      alert("username は 3〜20文字、英字・数字・_ のみ使えます");
      return;
    }

    setSaving(true);

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("username", trimmedUsername)
        .neq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        alert("username確認失敗: " + checkError.message);
        setSaving(false);
        return;
      }

      if (existingUser) {
        alert("その username はすでに使われています");
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          display_name: displayName.trim() || null,
          username: trimmedUsername,
          bio: bio.trim() || null,
          avatar_url: avatarUrl || null,
          theme_background_color: themeBackgroundColor,
          theme_card_color: themeCardColor,
          theme_text_color: themeTextColor,
          theme_accent_color: themeAccentColor,
          ui_scale: uiScale,
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) {
        alert("保存失敗: " + error.message);
        setSaving(false);
        return;
      }

      setUsername(trimmedUsername);
      alert("プロフィールを保存しました");
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleResetTheme = () => {
    setThemeBackgroundColor(DEFAULT_BACKGROUND);
    setThemeCardColor(DEFAULT_CARD);
    setThemeTextColor(DEFAULT_TEXT);
    setThemeAccentColor(DEFAULT_ACCENT);
    setUiScale(DEFAULT_UI_SCALE);
  };

  const applyPresetTheme = (preset: {
    background: string;
    card: string;
    text: string;
    accent: string;
  }) => {
    setThemeBackgroundColor(preset.background);
    setThemeCardColor(preset.card);
    setThemeTextColor(preset.text);
    setThemeAccentColor(preset.accent);
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "14px",
    borderRadius: "14px",
    border: `1px solid ${theme.border}`,
    background: theme.background,
    color: theme.text,
    fontSize: uiSize.input,
    outline: "none",
    minWidth: 0,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: theme.background,
        color: theme.text,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          margin: "0 auto",
          borderLeft: `1px solid ${theme.border}`,
          borderRight: `1px solid ${theme.border}`,
          minHeight: "100vh",
          background: theme.background,
          boxSizing: "border-box",
          overflowX: "hidden",
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
              fontSize: uiSize.title,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "6px",
            }}
          >
            Ulein
          </div>

          <div
            style={{
              color: theme.muted,
              fontSize: uiSize.label,
            }}
          >
            プロフィール設定
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

        <section
          style={{
            padding: "20px",
            boxSizing: "border-box",
            overflowX: "hidden",
          }}
        >
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
              ログインしてね
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "16px",
                width: "100%",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  border: `1px solid ${theme.border}`,
                  borderRadius: "22px",
                  padding: "20px",
                  background: theme.card,
                  boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                  boxSizing: "border-box",
                  width: "100%",
                  minWidth: 0,
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
                        width: uiSize.avatar,
                        height: uiSize.avatar,
                        borderRadius: "9999px",
                        objectFit: "cover",
                        border: `2px solid ${theme.border}`,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: uiSize.avatar,
                        height: uiSize.avatar,
                        borderRadius: "9999px",
                        background: theme.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        fontWeight: "bold",
                        fontSize: uiSize.avatar / 2.7,
                        flexShrink: 0,
                      }}
                    >
                      {(displayName || "U").slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: uiSize.text + 4,
                        marginBottom: "6px",
                        wordBreak: "break-word",
                      }}
                    >
                      {displayName || "名前未設定"}
                    </div>

                    <div
                      style={{
                        color: theme.muted,
                        fontSize: uiSize.label,
                        marginBottom: "6px",
                        wordBreak: "break-word",
                      }}
                    >
                      @{username || "username未設定"}
                    </div>

                    <div
                      style={{
                        color: theme.muted,
                        fontSize: uiSize.label,
                        marginBottom: "10px",
                        wordBreak: "break-all",
                      }}
                    >
                      {userEmail}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ maxWidth: "100%" }}
                    />

                    {uploadingAvatar && (
                      <div
                        style={{
                          marginTop: "8px",
                          color: theme.muted,
                          fontSize: uiSize.label,
                        }}
                      >
                        アップロード中...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  border: `1px solid ${theme.border}`,
                  borderRadius: "22px",
                  padding: "20px",
                  background: theme.card,
                  boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                  display: "grid",
                  gap: "14px",
                  boxSizing: "border-box",
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                  <span style={{ fontSize: uiSize.label, fontWeight: "bold" }}>
                    表示名
                  </span>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="表示名を入力"
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                  <span style={{ fontSize: uiSize.label, fontWeight: "bold" }}>
                    公開ID（username）
                  </span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="例: kazuki_ulein"
                    style={inputStyle}
                  />
                  <div
                    style={{
                      color: theme.muted,
                      fontSize: uiSize.label,
                      lineHeight: 1.5,
                    }}
                  >
                    3〜20文字、英字・数字・_ のみ使えます
                  </div>
                </label>

                <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                  <span style={{ fontSize: uiSize.label, fontWeight: "bold" }}>
                    自己紹介
                  </span>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="自己紹介を入力"
                    style={{
                      ...inputStyle,
                      minHeight: "120px",
                      resize: "vertical",
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  border: `1px solid ${theme.border}`,
                  borderRadius: "22px",
                  padding: "20px",
                  background: theme.card,
                  boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                  display: "grid",
                  gap: "14px",
                  boxSizing: "border-box",
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: uiSize.text,
                    fontWeight: "bold",
                  }}
                >
                  テーマ設定
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  {PRESET_THEMES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPresetTheme(preset)}
                      style={{
                        background: preset.card,
                        color: preset.text,
                        border: `1px solid ${theme.border}`,
                        padding: "10px 14px",
                        borderRadius: "9999px",
                        cursor: "pointer",
                        fontSize: uiSize.button,
                        fontWeight: "bold",
                        minWidth: "72px",
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                  <span style={{ fontSize: uiSize.label, fontWeight: "bold" }}>
                    背景色
                  </span>
                  <input
                    value={themeBackgroundColor}
                    onChange={(e) => setThemeBackgroundColor(e.target.value)}
                    placeholder="#15202b"
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                  <span style={{ fontSize: uiSize.label, fontWeight: "bold" }}>
                    カード色
                  </span>
                  <input
                    value={themeCardColor}
                    onChange={(e) => setThemeCardColor(e.target.value)}
                    placeholder="#192734"
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                  <span style={{ fontSize: uiSize.label, fontWeight: "bold" }}>
                    文字色
                  </span>
                  <input
                    value={themeTextColor}
                    onChange={(e) => setThemeTextColor(e.target.value)}
                    placeholder="#ffffff"
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                  <span style={{ fontSize: uiSize.label, fontWeight: "bold" }}>
                    アクセント色
                  </span>
                  <input
                    value={themeAccentColor}
                    onChange={(e) => setThemeAccentColor(e.target.value)}
                    placeholder="#1d9bf0"
                    style={inputStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: "8px", minWidth: 0 }}>
                  <span style={{ fontSize: uiSize.label, fontWeight: "bold" }}>
                    表示サイズ
                  </span>
                  <select
                    value={uiScale}
                    onChange={(e) => setUiScale(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="compact">小さめ</option>
                    <option value="normal">標準</option>
                    <option value="large">大きめ</option>
                  </select>
                </label>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={handleResetTheme}
                    type="button"
                    style={{
                      background: "transparent",
                      color: theme.muted,
                      border: `1px solid ${theme.border}`,
                      padding: `${uiSize.buttonPaddingY}px ${uiSize.buttonPaddingX}px`,
                      borderRadius: "9999px",
                      cursor: "pointer",
                      fontSize: uiSize.button,
                      fontWeight: "bold",
                    }}
                  >
                    初期値に戻す
                  </button>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    type="button"
                    style={{
                      background: theme.accent,
                      color: "#ffffff",
                      border: "none",
                      padding: `${uiSize.buttonPaddingY}px ${uiSize.buttonPaddingX}px`,
                      borderRadius: "9999px",
                      cursor: saving ? "not-allowed" : "pointer",
                      fontSize: uiSize.button,
                      fontWeight: "bold",
                      boxShadow: "0 8px 20px rgba(29,155,240,0.28)",
                    }}
                  >
                    {saving ? "保存中..." : "保存する"}
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
