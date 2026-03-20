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
  latestMessage: Message;
  pinned: boolean;
  note: string;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_CARD = "#192734";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";

function PinIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M14.5 4.5L19.5 9.5L16.5 10.5L13.5 13.5V19.5L11.5 17.5L10.5 14.5L7.5 11.5L4.5 12.5L9.5 7.5L10.5 4.5H14.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 19.5L8 23.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NoteIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
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
  const [messages, setMessages] = useState<Message[]>([]);
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

      if (ids.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
          )
          .in("user_id", ids);

        if (profileError) {
          console.error(profileError);
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

      const { data: pinData, error: pinError } = await supabase
        .from("dm_pins")
        .select("id, user_id, target_user_id, created_at")
        .eq("user_id", currentUserId);

      if (pinError) {
        console.error(pinError);
        setPins({});
      } else {
        const nextPins: Record<string, boolean> = {};
        for (const pin of (pinData ?? []) as DmPin[]) {
          nextPins[pin.target_user_id] = true;
        }
        setPins(nextPins);
      }

      const { data: noteData, error: noteError } = await supabase
        .from("dm_notes")
        .select("id, user_id, target_user_id, note, created_at, updated_at")
        .eq("user_id", currentUserId);

      if (noteError) {
        console.error(noteError);
        setNotes({});
      } else {
        const nextNotes: Record<string, string> = {};
        for (const note of (noteData ?? []) as DmNote[]) {
          nextNotes[note.target_user_id] = note.note || "";
        }
        setNotes(nextNotes);
      }
    } catch (error) {
      console.error(error);
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
          setPinLoadingUserId(null);
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
          setPinLoadingUserId(null);
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
          setNoteLoadingUserId(null);
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
        setNoteLoadingUserId(null);
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

                      {item.pinned && (
                        <span
                          style={{
                            color: currentTheme.accent,
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <PinIcon filled={true} color={currentTheme.accent} />
                        </span>
                      )}

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
                    gap: "8px",
                    flexShrink: 0,
                  }}
                >
                  <button
                    onClick={() => handleTogglePin(item.userId)}
                    disabled={pinLoadingUserId === item.userId}
                    style={{
                      border: `1px solid ${currentTheme.border}`,
                      background: item.pinned ? currentTheme.accent : "transparent",
                      color: item.pinned ? "#ffffff" : currentTheme.muted,
                      borderRadius: "9999px",
                      padding: "8px 10px",
                      cursor:
                        pinLoadingUserId === item.userId ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PinIcon
                      filled={item.pinned}
                      color={item.pinned ? "#ffffff" : currentTheme.muted}
                    />
                  </button>

                  <button
                    onClick={() => handleEditNote(item.userId)}
                    disabled={noteLoadingUserId === item.userId}
                    style={{
                      border: `1px solid ${currentTheme.border}`,
                      background: "transparent",
                      color: currentTheme.muted,
                      borderRadius: "9999px",
                      padding: "8px 10px",
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
