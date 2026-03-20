"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Message = {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

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

type ConversationItem = {
  userId: string;
  profile: Profile | null;
  latestMessage: Message;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_CARD = "#192734";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";

export default function DMPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  const currentTheme = useMemo(() => {
    if (!userId || !profiles[userId]) {
      return {
        background: DEFAULT_BACKGROUND,
        card: DEFAULT_CARD,
        text: DEFAULT_TEXT,
        accent: DEFAULT_ACCENT,
        border: DEFAULT_BORDER,
        muted: "#8899a6",
        softText: "#cfd9de",
      };
    }

    const me = profiles[userId];
    const textColor = me.theme_text_color || DEFAULT_TEXT;

    return {
      background: me.theme_background_color || DEFAULT_BACKGROUND,
      card: me.theme_card_color || DEFAULT_CARD,
      text: textColor,
      accent: me.theme_accent_color || DEFAULT_ACCENT,
      border: DEFAULT_BORDER,
      muted: textColor === "#000000" ? "#555555" : "#8899a6",
      softText: textColor === "#000000" ? "#444444" : "#cfd9de",
    };
  }, [profiles, userId]);

  const conversationList = useMemo(() => {
    if (!userId) return [];

    const latestMap = new Map<string, Message>();

    for (const message of messages) {
      const partnerId =
        message.sender_id === userId ? message.receiver_id : message.sender_id;

      const prev = latestMap.get(partnerId);
      if (!prev) {
        latestMap.set(partnerId, message);
        continue;
      }

      if (
        new Date(message.created_at).getTime() >
        new Date(prev.created_at).getTime()
      ) {
        latestMap.set(partnerId, message);
      }
    }

    const list: ConversationItem[] = Array.from(latestMap.entries()).map(
      ([partnerId, latestMessage]) => ({
        userId: partnerId,
        profile: profiles[partnerId] ?? null,
        latestMessage,
      })
    );

    list.sort(
      (a, b) =>
        new Date(b.latestMessage.created_at).getTime() -
        new Date(a.latestMessage.created_at).getTime()
    );

    return list;
  }, [messages, profiles, userId]);

  const filteredConversationList = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return conversationList;

    return conversationList.filter((item) => {
      const displayName = item.profile?.display_name?.toLowerCase() ?? "";
      const username = item.profile?.username?.toLowerCase() ?? "";
      const content = item.latestMessage.content?.toLowerCase() ?? "";

      return (
        displayName.includes(keyword) ||
        username.includes(keyword) ||
        content.includes(keyword)
      );
    });
  }, [conversationList, searchText]);

  const checkUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error(error);
    }

    const currentId = user?.id ?? null;
    setUserId(currentId);
    return currentId;
  };

  const fetchDMList = async (currentUserId: string | null) => {
    if (!currentUserId) {
      setMessages([]);
      setProfiles({});
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (messageError) {
        console.error(messageError);
        setMessages([]);
        setLoading(false);
        return;
      }

      const loadedMessages = (messageData ?? []) as Message[];
      setMessages(loadedMessages);

      const userIds = new Set<string>();
      userIds.add(currentUserId);

      for (const message of loadedMessages) {
        userIds.add(message.sender_id);
        userIds.add(message.receiver_id);
      }

      const ids = Array.from(userIds);

      if (ids.length === 0) {
        setProfiles({});
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
        )
        .in("user_id", ids);

      if (profileError) {
        console.error(profileError);
        setProfiles({});
        setLoading(false);
        return;
      }

      const nextProfiles: Record<string, Profile> = {};
      for (const profile of profileData ?? []) {
        nextProfiles[profile.user_id] = profile;
      }
      setProfiles(nextProfiles);
    } catch (error) {
      console.error(error);
      setMessages([]);
      setProfiles({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const currentId = await checkUser();
      await fetchDMList(currentId);
    };

    init();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay) {
      return date.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getShownName = (item: ConversationItem) => {
    if (item.profile?.display_name) return item.profile.display_name;
    if (item.profile?.username) return item.profile.username;
    return "ユーザー";
  };

  const getShownUsername = (item: ConversationItem) => {
    if (item.profile?.username) return item.profile.username;
    return "user";
  };

  const getShownAvatar = (item: ConversationItem) => {
    return item.profile?.avatar_url || null;
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

  if (!userId) {
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
          background: currentTheme.background,
          borderLeft: `1px solid ${currentTheme.border}`,
          borderRight: `1px solid ${currentTheme.border}`,
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: `${currentTheme.background}ee`,
            backdropFilter: "blur(14px)",
            borderBottom: `1px solid ${currentTheme.border}`,
          }}
        >
          <div
            style={{
              padding: "14px 18px 12px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: 800,
                marginBottom: "12px",
              }}
            >
              メッセージ
            </div>

            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="検索"
              style={{
                width: "100%",
                background: currentTheme.card,
                color: currentTheme.text,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "9999px",
                padding: "12px 16px",
                outline: "none",
                fontSize: "15px",
              }}
            />
          </div>
        </header>

        <section>
          {filteredConversationList.length === 0 ? (
            <div
              style={{
                padding: "28px 20px",
                color: currentTheme.muted,
                fontSize: "15px",
              }}
            >
              {searchText.trim() ? "見つからない" : "まだDMがない"}
            </div>
          ) : (
            filteredConversationList.map((item) => {
              const isFromMe = item.latestMessage.sender_id === userId;

              return (
                <Link
                  key={item.userId}
                  href={`/dm/${item.userId}`}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "14px 18px",
                    borderBottom: `1px solid ${currentTheme.border}`,
                    textDecoration: "none",
                    color: currentTheme.text,
                    alignItems: "flex-start",
                  }}
                >
                  {getShownAvatar(item) ? (
                    <img
                      src={getShownAvatar(item)!}
                      alt="avatar"
                      style={{
                        width: "54px",
                        height: "54px",
                        borderRadius: "9999px",
                        objectFit: "cover",
                        flexShrink: 0,
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "54px",
                        height: "54px",
                        borderRadius: "9999px",
                        background: currentTheme.accent,
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "20px",
                        flexShrink: 0,
                      }}
                    >
                      {getShownName(item).slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "17px",
                          color: currentTheme.text,
                        }}
                      >
                        {getShownName(item)}
                      </span>

                      <span
                        style={{
                          color: currentTheme.muted,
                          fontSize: "14px",
                        }}
                      >
                        @{getShownUsername(item)}
                      </span>

                      <span
                        style={{
                          color: currentTheme.muted,
                          fontSize: "13px",
                          marginLeft: "auto",
                        }}
                      >
                        {formatTime(item.latestMessage.created_at)}
                      </span>
                    </div>

                    <div
                      style={{
                        color: currentTheme.muted,
                        fontSize: "15px",
                        lineHeight: 1.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isFromMe ? "あなた: " : ""}
                      {item.latestMessage.content || "メッセージ"}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
