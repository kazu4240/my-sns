"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

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

type ConversationItem = {
  partnerId: string;
  lastMessage: DirectMessage;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_BORDER = "#2f3336";
const DEFAULT_MUTED = "#8899a6";
const DEFAULT_ACCENT = "#1d9bf0";

export default function DMPage() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  const loadPage = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const myId = user?.id ?? null;
    setCurrentUserId(myId);

    if (!myId) {
      setMessages([]);
      setProfiles({});
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`sender_user_id.eq.${myId},receiver_user_id.eq.${myId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessages([]);
      setProfiles({});
      setLoading(false);
      return;
    }

    const loadedMessages = (data ?? []) as DirectMessage[];
    setMessages(loadedMessages);

    const partnerIds = new Set<string>();
    for (const message of loadedMessages) {
      const partnerId =
        message.sender_user_id === myId
          ? message.receiver_user_id
          : message.sender_user_id;
      partnerIds.add(partnerId);
    }

    const ids = Array.from(partnerIds);
    if (ids.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, bio, avatar_url")
        .in("user_id", ids);

      if (!profileError) {
        const map: Record<string, Profile> = {};
        for (const item of profileData ?? []) {
          map[item.user_id] = item;
        }
        setProfiles(map);
      }
    } else {
      setProfiles({});
    }

    setLoading(false);
  };

  useEffect(() => {
    loadPage();
  }, []);

  const conversations = useMemo(() => {
    if (!currentUserId) return [];

    const map = new Map<string, DirectMessage>();

    for (const message of messages) {
      const partnerId =
        message.sender_user_id === currentUserId
          ? message.receiver_user_id
          : message.sender_user_id;

      if (!map.has(partnerId)) {
        map.set(partnerId, message);
      }
    }

    return Array.from(map.entries()).map(([partnerId, lastMessage]) => ({
      partnerId,
      lastMessage,
    })) as ConversationItem[];
  }, [messages, currentUserId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            href="/"
            style={{
              color: DEFAULT_ACCENT,
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            ← 戻る
          </Link>

          <div
            style={{
              fontSize: "28px",
              fontWeight: 800,
            }}
          >
            DM
          </div>
        </header>

        {!currentUserId ? (
          <div
            style={{
              padding: "28px 20px",
              color: DEFAULT_MUTED,
            }}
          >
            ログインするとDMが見れるよ
          </div>
        ) : loading ? (
          <div
            style={{
              padding: "28px 20px",
              color: DEFAULT_MUTED,
            }}
          >
            読み込み中...
          </div>
        ) : conversations.length === 0 ? (
          <div
            style={{
              padding: "28px 20px",
              color: DEFAULT_MUTED,
            }}
          >
            まだDMがない
          </div>
        ) : (
          conversations.map((conversation) => {
            const profile = profiles[conversation.partnerId];
            const displayName =
              profile?.display_name || profile?.username || "ユーザー";
            const username = profile?.username || "user";
            const avatarUrl = profile?.avatar_url || null;

            return (
              <Link
                key={conversation.partnerId}
                href={`/dm/${conversation.partnerId}`}
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "16px 20px",
                  borderBottom: `1px solid ${DEFAULT_BORDER}`,
                  textDecoration: "none",
                  color: DEFAULT_TEXT,
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "9999px",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "9999px",
                      background: DEFAULT_ACCENT,
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "17px",
                      }}
                    >
                      {displayName}
                    </div>

                    <div
                      style={{
                        color: DEFAULT_MUTED,
                        fontSize: "13px",
                        flexShrink: 0,
                      }}
                    >
                      {formatDate(conversation.lastMessage.created_at)}
                    </div>
                  </div>

                  <div
                    style={{
                      color: DEFAULT_MUTED,
                      fontSize: "14px",
                      marginBottom: "6px",
                    }}
                  >
                    @{username}
                  </div>

                  <div
                    style={{
                      color: DEFAULT_TEXT,
                      fontSize: "15px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {conversation.lastMessage.content}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
