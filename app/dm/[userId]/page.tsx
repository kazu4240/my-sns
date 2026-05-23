"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Profile = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  selected_avatar_frame_key: string | null;
  theme_background_color: string | null;
  theme_card_color: string | null;
  theme_text_color: string | null;
  theme_accent_color: string | null;
  ui_scale: string | null;
};

type AvatarFrame = {
  frame_key: string;
  name: string;
  rarity: string;
  border_css: string;
  glow_css: string | null;
  sort_order: number | null;
};

type DirectMessage = {
  id: number;
  sender_user_id: string;
  receiver_user_id: string;
  content: string;
  created_at: string;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_BORDER = "#2f3336";
const DEFAULT_MUTED = "#8899a6";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_CARD = "#192734";

export default function DMChatPage() {
  const params = useParams();
  const targetUserId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [avatarFrames, setAvatarFrames] = useState<Record<string, AvatarFrame>>({});
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");

  const currentTheme = useMemo(() => {
    if (!currentProfile) {
      return {
        background: DEFAULT_BACKGROUND,
        card: DEFAULT_CARD,
        text: DEFAULT_TEXT,
        accent: DEFAULT_ACCENT,
        border: DEFAULT_BORDER,
        muted: DEFAULT_MUTED,
      };
    }

    const textColor = currentProfile.theme_text_color || DEFAULT_TEXT;

    return {
      background: currentProfile.theme_background_color || DEFAULT_BACKGROUND,
      card: currentProfile.theme_card_color || DEFAULT_CARD,
      text: textColor,
      accent: currentProfile.theme_accent_color || DEFAULT_ACCENT,
      border: DEFAULT_BORDER,
      muted: textColor === "#000000" ? "#555555" : DEFAULT_MUTED,
    };
  }, [currentProfile]);

  const uiScale = useMemo(() => {
    const value = currentProfile?.ui_scale || "normal";

    if (value === "compact") {
      return {
        title: 22,
        name: 15,
        text: 14,
        meta: 11,
        avatar: 36,
        headerAvatar: 42,
        input: 14,
      };
    }

    if (value === "large") {
      return {
        title: 28,
        name: 18,
        text: 17,
        meta: 13,
        avatar: 46,
        headerAvatar: 54,
        input: 17,
      };
    }

    return {
      title: 24,
      name: 16,
      text: 15,
      meta: 12,
      avatar: 40,
      headerAvatar: 48,
      input: 15,
    };
  }, [currentProfile]);

  const loadAvatarFrames = async () => {
    const { data, error } = await supabase
      .from("avatar_frames")
      .select("frame_key, name, rarity, border_css, glow_css, sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("avatar_frames取得失敗:", error);
      setAvatarFrames({});
      return;
    }

    const frameMap: Record<string, AvatarFrame> = {};
    for (const frame of data ?? []) {
      frameMap[frame.frame_key] = frame as AvatarFrame;
    }
    setAvatarFrames(frameMap);
  };

  const loadProfiles = async (myId: string, partnerId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "user_id, display_name, username, bio, avatar_url, selected_avatar_frame_key, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
      )
      .in("user_id", [myId, partnerId]);

    if (error) {
      console.error("profiles取得失敗:", error);
      setCurrentProfile(null);
      setTargetProfile(null);
      return;
    }

    const profileMap: Record<string, Profile> = {};
    for (const profile of data ?? []) {
      profileMap[profile.user_id] = profile as Profile;
    }

    setCurrentProfile(profileMap[myId] ?? null);
    setTargetProfile(profileMap[partnerId] ?? null);
  };

  const loadChat = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const myId = user?.id ?? null;
    setCurrentUserId(myId);

    if (!myId || !targetUserId) {
      setLoading(false);
      return;
    }

    await Promise.all([loadAvatarFrames(), loadProfiles(myId, targetUserId)]);

    const { data: messageData, error } = await supabase
      .from("direct_messages")
      .select("id, sender_user_id, receiver_user_id, content, created_at")
      .or(
        `and(sender_user_id.eq.${myId},receiver_user_id.eq.${targetUserId}),and(sender_user_id.eq.${targetUserId},receiver_user_id.eq.${myId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setMessages([]);
      setLoading(false);
      return;
    }

    setMessages((messageData ?? []) as DirectMessage[]);
    setLoading(false);
  };

  useEffect(() => {
    loadChat();
  }, [targetUserId]);

  useEffect(() => {
    if (!currentUserId || !targetUserId) return;

    const channel = supabase
      .channel(`dm-${currentUserId}-${targetUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        (payload) => {
          const newMessage = payload.new as DirectMessage;
          const isRelated =
            (newMessage.sender_user_id === currentUserId &&
              newMessage.receiver_user_id === targetUserId) ||
            (newMessage.sender_user_id === targetUserId &&
              newMessage.receiver_user_id === currentUserId);

          if (!isRelated) return;

          setMessages((prev) => {
            if (prev.some((item) => item.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, targetUserId]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();

    if (!currentUserId || !targetUserId) {
      alert("ログインしてね");
      return;
    }

    if (!text.trim()) return;

    setSending(true);

    const content = text.trim();

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        sender_user_id: currentUserId,
        receiver_user_id: targetUserId,
        content,
      })
      .select()
      .single();

    if (error) {
      alert("送信失敗: " + error.message);
      setSending(false);
      return;
    }

    if (data) {
      const inserted = data as DirectMessage;
      setMessages((prev) => {
        if (prev.some((item) => item.id === inserted.id)) return prev;
        return [...prev, inserted];
      });
    }

    setText("");
    setSending(false);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const title = useMemo(() => {
    return targetProfile?.display_name || targetProfile?.username || "DM";
  }, [targetProfile]);

  const getProfileName = (profile: Profile | null) => {
    return profile?.display_name || profile?.username || "ユーザー";
  };

  const getAvatarFrame = (profile: Profile | null) => {
    const frameKey = profile?.selected_avatar_frame_key;
    if (!frameKey) return null;
    return avatarFrames[frameKey] ?? null;
  };

  const renderAvatar = ({
    profile,
    href,
    size,
    fontSize,
  }: {
    profile: Profile | null;
    href: string;
    size: number;
    fontSize: number;
  }) => {
    const frame = getAvatarFrame(profile);
    const shownName = getProfileName(profile);
    const avatarUrl = profile?.avatar_url || null;

    return (
      <Link
        href={href}
        style={{
          width: size,
          height: size,
          borderRadius: "9999px",
          padding: frame ? 3 : 0,
          border: frame?.border_css ?? "none",
          boxShadow: frame?.glow_css ?? "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          textDecoration: "none",
          boxSizing: "border-box",
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "9999px",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "9999px",
              background: currentTheme.accent,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize,
            }}
          >
            {shownName.slice(0, 1).toUpperCase()}
          </div>
        )}
      </Link>
    );
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: DEFAULT_BACKGROUND,
          color: DEFAULT_TEXT,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        読み込み中...
      </main>
    );
  }

  if (!currentUserId) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: DEFAULT_BACKGROUND,
          color: DEFAULT_TEXT,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        ログインしてね
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
          minHeight: "100vh",
          borderLeft: `1px solid ${currentTheme.border}`,
          borderRight: `1px solid ${currentTheme.border}`,
          display: "flex",
          flexDirection: "column",
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
            borderBottom: `1px solid ${currentTheme.border}`,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Link
            href="/dm"
            style={{
              color: currentTheme.accent,
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            ← 戻る
          </Link>

          {renderAvatar({
            profile: targetProfile,
            href: targetUserId ? `/users/${targetUserId}` : "/dm",
            size: uiScale.headerAvatar,
            fontSize: uiScale.name,
          })}

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: uiScale.title,
                fontWeight: 800,
                color: currentTheme.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </div>
            {targetProfile?.username && (
              <div
                style={{
                  color: currentTheme.muted,
                  fontSize: uiScale.meta,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                @{targetProfile.username}
              </div>
            )}
          </div>
        </header>

        <div
          style={{
            flex: 1,
            padding: "18px 16px 110px",
          }}
        >
          {messages.length === 0 ? (
            <div style={{ color: currentTheme.muted, fontSize: uiScale.text }}>
              まだDMがない。最初の1通を送ってみよう。
            </div>
          ) : (
            messages.map((message) => {
              const isMine = message.sender_user_id === currentUserId;
              const bubbleProfile = isMine ? currentProfile : targetProfile;
              const profileHref = isMine
                ? "/profile"
                : targetUserId
                ? `/users/${targetUserId}`
                : "/dm";

              return (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    justifyContent: isMine ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  {!isMine &&
                    renderAvatar({
                      profile: bubbleProfile,
                      href: profileHref,
                      size: uiScale.avatar,
                      fontSize: uiScale.text,
                    })}

                  <div
                    style={{
                      maxWidth: "72%",
                      background: isMine ? currentTheme.accent : currentTheme.card,
                      color: isMine ? "#ffffff" : currentTheme.text,
                      padding: "12px 14px",
                      borderRadius: isMine
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                      border: isMine ? "none" : `1px solid ${currentTheme.border}`,
                    }}
                  >
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                        wordBreak: "break-word",
                        fontSize: uiScale.text,
                      }}
                    >
                      {message.content}
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: uiScale.meta,
                        opacity: 0.8,
                        textAlign: "right",
                      }}
                    >
                      {formatTime(message.created_at)}
                    </div>
                  </div>

                  {isMine &&
                    renderAvatar({
                      profile: bubbleProfile,
                      href: profileHref,
                      size: uiScale.avatar,
                      fontSize: uiScale.text,
                    })}
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={handleSend}
          style={{
            position: "sticky",
            bottom: 0,
            background: `${currentTheme.background}f2`,
            backdropFilter: "blur(12px)",
            borderTop: `1px solid ${currentTheme.border}`,
            padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
            display: "flex",
            gap: "10px",
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="メッセージを入力"
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              background: currentTheme.card,
              color: currentTheme.text,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: "18px",
              padding: "12px 14px",
              outline: "none",
              fontSize: uiScale.input,
              minHeight: "48px",
              maxHeight: "140px",
            }}
          />

          <button
            type="submit"
            disabled={sending || !text.trim()}
            style={{
              background: sending || !text.trim() ? "#375a7f" : currentTheme.accent,
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              padding: "12px 16px",
              fontWeight: 800,
              cursor: sending || !text.trim() ? "not-allowed" : "pointer",
              flexShrink: 0,
            }}
          >
            {sending ? "送信中..." : "送信"}
          </button>
        </form>
      </div>
    </main>
  );
}
