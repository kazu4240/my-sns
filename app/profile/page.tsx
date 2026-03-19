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
  header_image_url: string | null;
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

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);

  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [selectedHeaderImage, setSelectedHeaderImage] = useState<File | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [cardColor, setCardColor] = useState(DEFAULT_CARD);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [uiScale, setUiScale] = useState("normal");

  const currentTheme = useMemo(() => {
    return {
      background: backgroundColor || DEFAULT_BACKGROUND,
      card: cardColor || DEFAULT_CARD,
      text: textColor || DEFAULT_TEXT,
      accent: accentColor || DEFAULT_ACCENT,
      border: DEFAULT_BORDER,
      muted: (textColor || DEFAULT_TEXT) === "#000000" ? "#555555" : "#8899a6",
      softBorder: (textColor || DEFAULT_TEXT) === "#000000" ? "#d8d8d8" : "#2f3336",
    };
  }, [backgroundColor, cardColor, textColor, accentColor]);

  const sizes = useMemo(() => {
    if (uiScale === "compact") {
      return {
        pageTitle: 24,
        sectionTitle: 15,
        label: 16,
        helper: 12,
        avatar: 92,
        button: 14,
        input: 16,
      };
    }

    if (uiScale === "large") {
      return {
        pageTitle: 32,
        sectionTitle: 18,
        label: 18,
        helper: 14,
        avatar: 112,
        button: 16,
        input: 18,
      };
    }

    return {
      pageTitle: 28,
      sectionTitle: 16,
      label: 17,
      helper: 13,
      avatar: 100,
      button: 15,
      input: 17,
    };
  }, [uiScale]);

  const loadProfile = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "user_id, display_name, username, bio, avatar_url, header_image_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const profile = data as Profile | null;

    setDisplayName(profile?.display_name || "");
    setUsername(profile?.username || "");
    setBio(profile?.bio || "");
    setAvatarUrl(profile?.avatar_url || "");
    setHeaderImageUrl(profile?.header_image_url || "");
    setBackgroundColor(profile?.theme_background_color || DEFAULT_BACKGROUND);
    setCardColor(profile?.theme_card_color || DEFAULT_CARD);
    setTextColor(profile?.theme_text_color || DEFAULT_TEXT);
    setAccentColor(profile?.theme_accent_color || DEFAULT_ACCENT);
    setUiScale(profile?.ui_scale || "normal");

    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedAvatar(file);

    if (file) {
      const preview = URL.createObjectURL(file);
      setAvatarUrl(preview);
    }
  };

  const handleHeaderImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedHeaderImage(file);

    if (file) {
      const preview = URL.createObjectURL(file);
      setHeaderImageUrl(preview);
    }
  };

  const uploadAvatarIfNeeded = async () => {
    if (!selectedAvatar || !userId) return null;

    const fileExt = selectedAvatar.name.split(".").pop() || "png";
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, selectedAvatar, {
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const uploadHeaderIfNeeded = async () => {
    if (!selectedHeaderImage || !userId) return null;

    const fileExt = selectedHeaderImage.name.split(".").pop() || "png";
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("headers")
      .upload(filePath, selectedHeaderImage, {
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("headers").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const normalizeUsername = (value: string) => {
    return value.trim().toLowerCase().replace(/^@+/, "");
  };

  const handleResetTheme = () => {
    setBackgroundColor(DEFAULT_BACKGROUND);
    setCardColor(DEFAULT_CARD);
    setTextColor(DEFAULT_TEXT);
    setAccentColor(DEFAULT_ACCENT);
    setUiScale("normal");
  };

  const handleRemoveHeaderImage = () => {
    setSelectedHeaderImage(null);
    setHeaderImageUrl("");
  };

  const handleSave = async () => {
    if (!userId) {
      alert("ログインが必要です");
      return;
    }

    const cleanDisplayName = displayName.trim();
    const cleanUsername = normalizeUsername(username);
    const cleanBio = bio.trim();

    if (!cleanDisplayName) {
      alert("表示名を入力してね");
      return;
    }

    if (!cleanUsername) {
      alert("username を入力してね");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      alert("username は半角英小文字・数字・_ だけ使えるよ");
      return;
    }

    setSaving(true);

    try {
      const { data: existingUsername, error: usernameCheckError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", cleanUsername)
        .neq("user_id", userId)
        .maybeSingle();

      if (usernameCheckError) {
        throw new Error(usernameCheckError.message);
      }

      if (existingUsername) {
        alert("その username はすでに使われています");
        setSaving(false);
        return;
      }

      let nextAvatarUrl = avatarUrl;
      let nextHeaderImageUrl = headerImageUrl;

      if (selectedAvatar) {
        const uploadedAvatarUrl = await uploadAvatarIfNeeded();
        if (uploadedAvatarUrl) {
          nextAvatarUrl = uploadedAvatarUrl;
        }
      }

      if (selectedHeaderImage) {
        const uploadedHeaderUrl = await uploadHeaderIfNeeded();
        if (uploadedHeaderUrl) {
          nextHeaderImageUrl = uploadedHeaderUrl;
        }
      }

      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          display_name: cleanDisplayName,
          username: cleanUsername,
          bio: cleanBio || null,
          avatar_url: nextAvatarUrl || null,
          header_image_url: nextHeaderImageUrl || null,
          theme_background_color: backgroundColor,
          theme_card_color: cardColor,
          theme_text_color: textColor,
          theme_accent_color: accentColor,
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

      setSelectedAvatar(null);
      setSelectedHeaderImage(null);
      alert("保存できた！");
      await loadProfile();
    } catch (error) {
      console.error(error);
      alert("保存失敗");
    } finally {
      setSaving(false);
    }
  };

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: "14px",
    alignItems: "center",
    padding: "18px 20px",
    borderTop: `1px solid ${currentTheme.softBorder}`,
  } as const;

  const inputStyle = {
    width: "100%",
    background: "transparent",
    color: currentTheme.text,
    border: "none",
    outline: "none",
    fontSize: `${sizes.input}px`,
    padding: 0,
    fontFamily: "inherit",
  } as const;

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: DEFAULT_BACKGROUND,
          color: DEFAULT_TEXT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        読み込み中...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: currentTheme.background,
        color: currentTheme.text,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          borderLeft: `1px solid ${currentTheme.softBorder}`,
          borderRight: `1px solid ${currentTheme.softBorder}`,
          minHeight: "100vh",
          background: currentTheme.background,
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: `${currentTheme.background}ee`,
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${currentTheme.softBorder}`,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              padding: "14px 16px",
            }}
          >
            <Link
              href="/"
              style={{
                color: currentTheme.accent,
                textDecoration: "none",
                fontSize: `${sizes.button}px`,
                fontWeight: "bold",
                justifySelf: "start",
              }}
            >
              キャンセル
            </Link>

            <div
              style={{
                fontSize: `${sizes.pageTitle}px`,
                fontWeight: 800,
                justifySelf: "center",
              }}
            >
              プロフィール
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                justifySelf: "end",
                background: saving ? "#375a7f" : currentTheme.accent,
                color: "#ffffff",
                border: "none",
                padding: "10px 16px",
                borderRadius: "9999px",
                fontSize: `${sizes.button}px`,
                fontWeight: 800,
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 8px 20px rgba(29,155,240,0.25)",
              }}
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </header>

        <section>
          <div
            style={{
              height: "180px",
              background: headerImageUrl
                ? `center / cover no-repeat url(${headerImageUrl})`
                : currentTheme.card === currentTheme.background
                ? "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
                : currentTheme.card,
              borderBottom: `1px solid ${currentTheme.softBorder}`,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: "14px",
                bottom: "14px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  background: "rgba(0,0,0,0.55)",
                  color: "#ffffff",
                  padding: "8px 12px",
                  borderRadius: "9999px",
                  fontSize: `${sizes.button}px`,
                  fontWeight: "bold",
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                ヘッダー変更
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderImageChange}
                  style={{ display: "none" }}
                />
              </label>

              {headerImageUrl && (
                <button
                  onClick={handleRemoveHeaderImage}
                  type="button"
                  style={{
                    background: "rgba(0,0,0,0.55)",
                    color: "#ffffff",
                    padding: "8px 12px",
                    borderRadius: "9999px",
                    fontSize: `${sizes.button}px`,
                    fontWeight: "bold",
                    cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.18)",
                  }}
                >
                  ヘッダー削除
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              padding: "0 20px 18px",
              position: "relative",
            }}
          >
            <div
              style={{
                marginTop: "-46px",
                display: "flex",
                alignItems: "flex-end",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: sizes.avatar,
                  height: sizes.avatar,
                  borderRadius: "9999px",
                  background: currentTheme.card,
                  border: `4px solid ${currentTheme.background}`,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: currentTheme.text,
                  fontWeight: "bold",
                  fontSize: "28px",
                  flexShrink: 0,
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  (displayName || "U").slice(0, 1).toUpperCase()
                )}
              </div>

              <label
                style={{
                  border: `1px solid ${currentTheme.softBorder}`,
                  color: currentTheme.text,
                  padding: "10px 14px",
                  borderRadius: "9999px",
                  fontSize: `${sizes.button}px`,
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                画像を変更
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>
        </section>

        <section
          style={{
            borderTop: `1px solid ${currentTheme.softBorder}`,
            borderBottom: `1px solid ${currentTheme.softBorder}`,
          }}
        >
          <div style={rowStyle}>
            <div
              style={{
                fontWeight: 800,
                fontSize: `${sizes.label}px`,
              }}
            >
              名前
            </div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名を入力"
              style={inputStyle}
            />
          </div>

          <div style={rowStyle}>
            <div
              style={{
                fontWeight: 800,
                fontSize: `${sizes.label}px`,
              }}
            >
              username
            </div>
            <div>
              <input
                value={username}
                onChange={(e) => setUsername(normalizeUsername(e.target.value))}
                placeholder="username"
                style={inputStyle}
              />
              <div
                style={{
                  marginTop: "6px",
                  color: currentTheme.muted,
                  fontSize: `${sizes.helper}px`,
                }}
              >
                半角英小文字・数字・_ が使えます
              </div>
            </div>
          </div>

          <div style={rowStyle}>
            <div
              style={{
                fontWeight: 800,
                fontSize: `${sizes.label}px`,
                alignSelf: "start",
              }}
            >
              自己紹介
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="プロフィールに自己紹介を追加する"
              style={{
                ...inputStyle,
                minHeight: "110px",
                resize: "vertical",
              }}
            />
          </div>
        </section>

        <section
          style={{
            padding: "20px 20px 8px",
            color: currentTheme.muted,
            fontWeight: 800,
            fontSize: `${sizes.sectionTitle}px`,
          }}
        >
          テーマ設定
        </section>

        <section
          style={{
            borderTop: `1px solid ${currentTheme.softBorder}`,
            borderBottom: `1px solid ${currentTheme.softBorder}`,
          }}
        >
          <div style={rowStyle}>
            <div
              style={{
                fontWeight: 800,
                fontSize: `${sizes.label}px`,
              }}
            >
              背景色
            </div>
            <input
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              placeholder="#15202b"
              style={inputStyle}
            />
          </div>

          <div style={rowStyle}>
            <div
              style={{
                fontWeight: 800,
                fontSize: `${sizes.label}px`,
              }}
            >
              カード色
            </div>
            <input
              value={cardColor}
              onChange={(e) => setCardColor(e.target.value)}
              placeholder="#192734"
              style={inputStyle}
            />
          </div>

          <div style={rowStyle}>
            <div
              style={{
                fontWeight: 800,
                fontSize: `${sizes.label}px`,
              }}
            >
              文字色
            </div>
            <input
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              placeholder="#ffffff"
              style={inputStyle}
            />
          </div>

          <div style={rowStyle}>
            <div
              style={{
                fontWeight: 800,
                fontSize: `${sizes.label}px`,
              }}
            >
              アクセント色
            </div>
            <input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#1d9bf0"
              style={inputStyle}
            />
          </div>

          <div style={rowStyle}>
            <div
              style={{
                fontWeight: 800,
                fontSize: `${sizes.label}px`,
              }}
            >
              表示サイズ
            </div>
            <select
              value={uiScale}
              onChange={(e) => setUiScale(e.target.value)}
              style={{
                ...inputStyle,
                appearance: "none",
                WebkitAppearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="compact">小さめ</option>
              <option value="normal">普通</option>
              <option value="large">大きめ</option>
            </select>
          </div>
        </section>

        <section
          style={{
            padding: "20px",
            borderBottom: `1px solid ${currentTheme.softBorder}`,
          }}
        >
          <button
            onClick={handleResetTheme}
            style={{
              background: "transparent",
              color: currentTheme.muted,
              border: `1px solid ${currentTheme.softBorder}`,
              padding: "11px 16px",
              borderRadius: "9999px",
              fontSize: `${sizes.button}px`,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            初期値に戻す
          </button>
        </section>
      </div>
    </main>
  );
}
