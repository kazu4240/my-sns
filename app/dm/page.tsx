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
  theme_background_color: string | null;
  theme_card_color: string | null;
  theme_text_color: string | null;
  theme_accent_color: string | null;
  ui_scale: string | null;
};

type DirectMessage = {
  id: number;
  sender_user_id: string;
  receiver_user_id: string;
  content: string;
  created_at: string;
};

type DmPin = {
  id: number;
  user_id: string;
  target_user_id: string;
  created_at: string;
};

type DmNote = {
  id: number;
  user_id: string;
  target_user_id: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type ConversationItem = {
  userId: string;
  profile: Profile | null;
  latestMessage: DirectMessage;
  pinned: boolean;
  note: string;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_CARD = "#192734";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";

function PinIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M15.5 4.5L19.5 8.5L16.3 9.7L13.7 12.3L13.9 18.3L11.7 16.1L9.6 14L6.4 15.2L10.4 11.2L11.6 8L15.5 4.5Z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinejoin="round"
        fill={active ? color : "none"}
        fillOpacity={active ? 0.12 : 0}
      />
      <path
        d="M12 18L8.5 21.5"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NoteIcon({ color }: { color: string }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M7 4.5H17C17.8284 4.5 18.5 5.17157 18.5 6V18L14.5 15.5L10.5 18L7 15.8V6C7 5.17157 7.67157 4.5 8.5 4.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 8H15"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 11.5H15"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DMPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [pins, setPins] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pinLoadingUserId, setPinLoadingUserId] = useState<string | null>(null);
  const [noteLoadingUserId, setNoteLoadingUserId] = useState<string | null>(null);

  const currentTheme = useMemo(() => {
    if (!userId || !profiles[userId]) {
      return {
        background: DEFAULT_BACKGROUND,
        card: DEFAULT_CARD,
        text: DEFAULT_TEXT,
        accent: DEFAULT_ACCENT,
        border: DEFAULT_BORDER,
        muted: "#8899a6",
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
    };
  }, [profiles, userId]);

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
      setPins({});
      setNotes({});
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [sentRes, receivedRes, pinRes, noteRes] = await Promise.all([
        supabase
          .from("direct_messages")
          .select("id, sender_user_id, receiver_user_id, content, created_at")
          .eq("sender_user_id", currentUserId),

        supabase
          .from("direct_messages")
          .select("id, sender_user_id, receiver_user_id, content, created_at")
          .eq("receiver_user_id", currentUserId),

        supabase
          .from("dm_pins")
          .select("id, user_id, target_user_id, created_at")
          .eq("user_id", currentUserId),

        supabase
          .from("dm_notes")
          .select("id, user_id, target_user_id, note, created_at, updated_at")
          .eq("user_id", currentUserId),
      ]);

      if (sentRes.error) console.error("sent direct_messages取得失敗:", sentRes.error);
      if (receivedRes.error) console.error("received direct_messages取得失敗:", receivedRes.error);
      if (pinRes.error) console.error("dm_pins取得失敗:", pinRes.error);
      if (noteRes.error) console.error("dm_notes取得失敗:", noteRes.error);

      const mergedMessages = [
        ...((sentRes.data ?? []) as DirectMessage[]),
        ...((receivedRes.data ?? []) as DirectMessage[]),
      ];

      const uniqueMessageMap = new Map<number, DirectMessage>();
      for (const message of mergedMessages) {
        uniqueMessageMap.set(message.id, message);
      }

      const loadedMessages = Array.from(uniqueMessageMap.values()).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMessages(loadedMessages);

      const userIds = new Set<string>();
      userIds.add(currentUserId);

      for (const message of loadedMessages) {
        userIds.add(message.sender_user_id);
        userIds.add(message.receiver_user_id);
      }

      const ids = Array.from(userIds);

      if (ids.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
          )
          .in("user_id", ids);

        if (profileError) {
          console.error("profiles取得失敗:", profileError);
          setProfiles({});
        } else {
          const nextProfiles: Record<string, Profile> = {};
          for (const profile of profileData ?? []) {
            nextProfiles[profile.user_id] = profile;
          }
          setProfiles(nextProfiles);
        }
      } else {
        setProfiles({});
      }

      if (!pinRes.error) {
        const nextPins: Record<string, boolean> = {};
        for (const pin of (pinRes.data ?? []) as DmPin[]) {
          nextPins[pin.target_user_id] = true;
        }
        setPins(nextPins);
      } else {
        setPins({});
      }

      if (!noteRes.error) {
        const nextNotes: Record<string, string> = {};
        for (const note of (noteRes.data ?? []) as DmNote[]) {
          nextNotes[note.target_user_id] = note.note || "";
        }
        setNotes(nextNotes);
      } else {
        setNotes({});
      }
    } catch (error) {
      console.error("DM一覧取得失敗:", error);
      setMessages([]);
      setProfiles({});
      setPins({});
      setNotes({});
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

  useEffect(() => {
    const reload = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await fetchDMList(user?.id ?? null);
    };

    const handleFocus = async () => {
      await reload();
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await reload();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const conversationList = useMemo(() => {
    if (!userId) return [];

    const latestMap = new Map<string, DirectMessage>();

    for (const message of messages) {
      const partnerId =
        message.sender_user_id === userId
          ? message.receiver_user_id
          : message.sender_user_id;

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
        pinned: !!pins[partnerId],
        note: notes[partnerId] || "",
      })
    );

    list.sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return (
        new Date(b.latestMessage.created_at).getTime() -
        new Date(a.latestMessage.created_at).getTime()
      );
    });

    return list;
  }, [messages, profiles, pins, notes, userId]);

  const filteredConversationList = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return conversationList;

    return conversationList.filter((item) => {
      const displayName = item.profile?.display_name?.toLowerCase() ?? "";
      const username = item.profile?.username?.toLowerCase() ?? "";
      const content = item.latestMessage.content?.toLowerCase() ?? "";
      const note = item.note.toLowerCase();

      return (
        displayName.includes(keyword) ||
        username.includes(keyword) ||
        content.includes(keyword) ||
        note.includes(keyword)
      );
    });
  }, [conversationList, searchText]);

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

  const getShownAvatar = (item: ConversationItem) => {
    return item.profile?.avatar_url || null;
  };

  const handleTogglePin = async (targetUserId: string) => {
    if (!userId) return;

    const isPinned = !!pins[targetUserId];
    setPinLoadingUserId(targetUserId);

    try {
      if (isPinned) {
        const { error } = await supabase
          .from("dm_pins")
          .delete()
          .eq("user_id", userId)
          .eq("target_user_id", targetUserId);

        if (error) {
          alert("ピン解除失敗: " + error.message);
          return;
        }

        setPins((prev) => {
          const next = { ...prev };
          delete next[targetUserId];
          return next;
        });
      } else {
        const { error } = await supabase.from("dm_pins").insert({
          user_id: userId,
          target_user_id: targetUserId,
        });

        if (error) {
          alert("ピン留め失敗: " + error.message);
          return;
        }

        setPins((prev) => ({ ...prev, [targetUserId]: true }));
      }
    } finally {
      setPinLoadingUserId(null);
    }
  };

  const handleEditNote = async (targetUserId: string) => {
    if (!userId) return;

    const currentNote = notes[targetUserId] || "";
    const nextNote = window.prompt("メモを入力してね", currentNote);

    if (nextNote === null) return;

    setNoteLoadingUserId(targetUserId);

    try {
      if (!nextNote.trim()) {
        const { error } = await supabase
          .from("dm_notes")
          .delete()
          .eq("user_id", userId)
          .eq("target_user_id", targetUserId);

        if (error) {
          alert("メモ削除失敗: " + error.message);
          return;
        }

        setNotes((prev) => {
          const next = { ...prev };
          delete next[targetUserId];
          return next;
        });

        return;
      }

      const { error } = await supabase.from("dm_notes").upsert(
        {
          user_id: userId,
          target_user_id: targetUserId,
          note: nextNote.trim(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,target_user_id",
        }
      );

      if (error) {
        alert("メモ保存失敗: " + error.message);
        return;
      }

      setNotes((prev) => ({ ...prev, [targetUserId]: nextNote.trim() }));
    } finally {
      setNoteLoadingUserId(null);
    }
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
            backdropFilter: "blur(10px)",
            borderBottom: `1px solid ${currentTheme.border}`,
          }}
        >
          <div
            style={{
              padding: "16px 18px 12px",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                fontWeight: 800,
                marginBottom: "14px",
                color: currentTheme.text,
              }}
            >
              トーク
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
            filteredConversationList.map((item) => (
              <div
                key={item.userId}
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "center",
                  padding: "14px 18px",
                  borderBottom: `1px solid ${currentTheme.border}`,
                  background: currentTheme.background,
                }}
              >
                <Link
                  href={`/dm/${item.userId}`}
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "center",
                    flex: 1,
                    minWidth: 0,
                    textDecoration: "none",
                    color: currentTheme.text,
                  }}
                >
                  {getShownAvatar(item) ? (
                    <img
                      src={getShownAvatar(item)!}
                      alt="avatar"
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "9999px",
                        objectFit: "cover",
                        flexShrink: 0,
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
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
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "18px",
                          color: currentTheme.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getShownName(item)}
                      </span>

                      <span
                        style={{
                          marginLeft: "auto",
                          color: currentTheme.muted,
                          fontSize: "13px",
                          flexShrink: 0,
                        }}
                      >
                        {formatTime(item.latestMessage.created_at)}
                      </span>
                    </div>

                    {item.note && (
                      <div
                        style={{
                          color: currentTheme.accent,
                          fontSize: "13px",
                          marginBottom: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        メモ: {item.note}
                      </div>
                    )}

                    <div
                      style={{
                        color: currentTheme.muted,
                        fontSize: "15px",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.latestMessage.content || "メッセージ"}
                    </div>
                  </div>
                </Link>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => handleTogglePin(item.userId)}
                    disabled={pinLoadingUserId === item.userId}
                    title={item.pinned ? "ピン解除" : "ピン留め"}
                    style={{
                      width: "44px",
                      height: "44px",
                      border: `1px solid ${item.pinned ? currentTheme.accent : currentTheme.border}`,
                      background: item.pinned
                        ? "rgba(29,155,240,0.12)"
                        : "transparent",
                      color: item.pinned ? currentTheme.accent : currentTheme.muted,
                      borderRadius: "9999px",
                      cursor:
                        pinLoadingUserId === item.userId ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PinIcon
                      active={item.pinned}
                      color={item.pinned ? currentTheme.accent : currentTheme.muted}
                    />
                  </button>

                  <button
                    onClick={() => handleEditNote(item.userId)}
                    disabled={noteLoadingUserId === item.userId}
                    title="メモ"
                    style={{
                      width: "44px",
                      height: "44px",
                      border: `1px solid ${currentTheme.border}`,
                      background: "transparent",
                      color: currentTheme.muted,
                      borderRadius: "9999px",
                      cursor:
                        noteLoadingUserId === item.userId ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <NoteIcon color={currentTheme.muted} />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
