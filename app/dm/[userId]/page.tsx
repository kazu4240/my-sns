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
  const targetUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");

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

    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, bio, avatar_url")
      .eq("user_id", targetUserId)
      .maybeSingle();

    setTargetProfile((profileData as Profile | null) ?? null);

    const { data: messageData, error } = await supabase
      .from("direct_messages")
      .select("*")
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

  return (
    <main
      style={{
        minHeight: "100vh",
        background: DEFAULT_BACKGROUND,
        color: DEFAULT_TEXT,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          minHeight: "100vh",
          borderLeft: `1px solid ${DEFAULT_BORDER}`,
          borderRight: `1px solid ${DEFAULT_BORDER}`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: `${DEFAULT_BACKGROUND}ee`,
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${DEFAULT_BORDER}`,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Link
            href="/dm"
            style={{
              color: DEFAULT_ACCENT,
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            ← 戻る
          </Link>

          <div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 800,
              }}
            >
              {title}
            </div>
            {targetProfile?.username && (
              <div
                style={{
                  color: DEFAULT_MUTED,
                  fontSize: "13px",
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
          {!currentUserId ? (
            <div style={{ color: DEFAULT_MUTED }}>ログインするとDMできるよ</div>
          ) : loading ? (
            <div style={{ color: DEFAULT_MUTED }}>読み込み中...</div>
          ) : messages.length === 0 ? (
            <div style={{ color: DEFAULT_MUTED }}>まだDMがない。最初の1通を送ってみよう。</div>
          ) : (
            messages.map((message) => {
              const isMine = message.sender_user_id === currentUserId;

              return (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    justifyContent: isMine ? "flex-end" : "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "78%",
                      background: isMine ? DEFAULT_ACCENT : DEFAULT_CARD,
                      color: "#ffffff",
                      padding: "12px 14px",
                      borderRadius: "18px",
                    }}
                  >
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                        wordBreak: "break-word",
                        fontSize: "15px",
                      }}
                    >
                      {message.content}
                    </div>

                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "12px",
                        opacity: 0.8,
                        textAlign: "right",
                      }}
                    >
                      {formatTime(message.created_at)}
                    </div>
                  </div>
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
            background: `${DEFAULT_BACKGROUND}f2`,
            backdropFilter: "blur(12px)",
            borderTop: `1px solid ${DEFAULT_BORDER}`,
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
              background: DEFAULT_CARD,
              color: DEFAULT_TEXT,
              border: `1px solid ${DEFAULT_BORDER}`,
              borderRadius: "18px",
              padding: "12px 14px",
              outline: "none",
              fontSize: "15px",
              minHeight: "48px",
              maxHeight: "140px",
            }}
          />

          <button
            type="submit"
            disabled={sending || !text.trim()}
            style={{
              background: sending || !text.trim() ? "#375a7f" : DEFAULT_ACCENT,
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
