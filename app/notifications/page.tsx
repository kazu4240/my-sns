"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Notification = {
  id: number;
  user_id: string;
  actor_user_id: string | null;
  type: "like" | "reply" | "follow";
  post_id: number | null;
  is_read: boolean;
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

type Post = {
  id: number;
  content: string;
  user_id: string | null;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_CARD = "#192734";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [postsMap, setPostsMap] = useState<Record<number, Post>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const currentTheme = useMemo(() => {
    if (!currentUserId || !profiles[currentUserId]) {
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

    const me = profiles[currentUserId];
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
  }, [profiles, currentUserId]);

  const uiScale =
    currentUserId && profiles[currentUserId]?.ui_scale
      ? profiles[currentUserId].ui_scale
      : "normal";

  const sizes =
    uiScale === "compact"
      ? {
          avatar: 40,
          title: 22,
          text: 14,
          meta: 12,
        }
      : uiScale === "large"
      ? {
          avatar: 56,
          title: 28,
          text: 17,
          meta: 14,
        }
      : {
          avatar: 48,
          title: 24,
          text: 15,
          meta: 13,
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

  const getDisplayName = (userId: string | null) => {
    if (!userId) return "ユーザー";
    const profile = profiles[userId];
    if (!profile) return "ユーザー";
    return profile.display_name || profile.username || "ユーザー";
  };

  const getUsername = (userId: string | null) => {
    if (!userId) return "user";
    const profile = profiles[userId];
    if (!profile) return "user";
    return profile.username || "user";
  };

  const getAvatarUrl = (userId: string | null) => {
    if (!userId) return null;
    return profiles[userId]?.avatar_url || null;
  };

  const buildNotificationText = (notification: Notification) => {
    const actorName = getDisplayName(notification.actor_user_id);
    const actorUsername = getUsername(notification.actor_user_id);

    if (notification.type === "follow") {
      return {
        title: `${actorName} があなたをフォローしました`,
        sub: `@${actorUsername}`,
      };
    }

    if (notification.type === "like") {
      const post = notification.post_id ? postsMap[notification.post_id] : null;

      return {
        title: `${actorName} があなたの投稿にいいねしました`,
        sub: post?.content
          ? post.content.length > 80
            ? `${post.content.slice(0, 80)}...`
            : post.content
          : `@${actorUsername}`,
      };
    }

    const post = notification.post_id ? postsMap[notification.post_id] : null;

    return {
      title: `${actorName} があなたの投稿に返信しました`,
      sub: post?.content
        ? post.content.length > 80
          ? `${post.content.slice(0, 80)}...`
          : post.content
        : `@${actorUsername}`,
    };
  };

  const loadNotifications = async () => {
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
        setCurrentUserId(null);
        setNotifications([]);
        setProfiles({});
        setPostsMap({});
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const { data: notificationData, error: notificationError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (notificationError) {
        throw new Error(notificationError.message);
      }

      const notificationsData = (notificationData ?? []) as Notification[];
      setNotifications(notificationsData);

      const actorIds = notificationsData
        .map((item) => item.actor_user_id)
        .filter((value): value is string => !!value);

      const postIds = notificationsData
        .map((item) => item.post_id)
        .filter((value): value is number => typeof value === "number");

      const uniqueUserIds = Array.from(new Set([user.id, ...actorIds]));

      if (uniqueUserIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
          )
          .in("user_id", uniqueUserIds);

        if (profileError) {
          console.error(profileError);
          setProfiles({});
        } else {
          const profileMap: Record<string, Profile> = {};
          for (const profile of profileData ?? []) {
            profileMap[profile.user_id] = profile;
          }
          setProfiles(profileMap);
        }
      } else {
        setProfiles({});
      }

      if (postIds.length > 0) {
        const uniquePostIds = Array.from(new Set(postIds));

        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("id, content, user_id")
          .in("id", uniquePostIds);

        if (postError) {
          console.error(postError);
          setPostsMap({});
        } else {
          const nextPostsMap: Record<number, Post> = {};
          for (const post of postData ?? []) {
            nextPostsMap[post.id] = post;
          }
          setPostsMap(nextPostsMap);
        }
      } else {
        setPostsMap({});
      }

      const unreadIds = notificationsData
        .filter((item) => !item.is_read)
        .map((item) => item.id);

      if (unreadIds.length > 0) {
        const { error: updateError } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .in("id", unreadIds);

        if (updateError) {
          console.error(updateError);
        } else {
          setNotifications((prev) =>
            prev.map((item) =>
              unreadIds.includes(item.id) ? { ...item, is_read: true } : item
            )
          );
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("通知の読み込みに失敗しました。");
      setNotifications([]);
      setProfiles({});
      setPostsMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: currentTheme.background,
        color: currentTheme.text,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          borderLeft: `1px solid ${currentTheme.border}`,
          borderRight: `1px solid ${currentTheme.border}`,
          minHeight: "100vh",
          background: currentTheme.background,
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            background: `${currentTheme.background}ee`,
            backdropFilter: "blur(8px)",
            borderBottom: `1px solid ${currentTheme.border}`,
            padding: "18px 20px",
            zIndex: 10,
          }}
        >
          <Link
            href="/"
            style={{
              color: currentTheme.accent,
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-block",
              marginBottom: "8px",
            }}
          >
            ← ホームに戻る
          </Link>

          <h1
            style={{
              margin: 0,
              fontSize: sizes.title,
              fontWeight: "bold",
            }}
          >
            通知
          </h1>
        </header>

        {errorMessage && (
          <div
            style={{
              padding: "20px",
              color: "#ffb4b4",
              borderBottom: `1px solid ${currentTheme.border}`,
            }}
          >
            {errorMessage}
          </div>
        )}

        <section>
          {loading ? (
            <p style={{ padding: "20px", color: currentTheme.muted }}>
              読み込み中...
            </p>
          ) : !currentUserId ? (
            <p style={{ padding: "20px", color: currentTheme.muted }}>
              ログインしてね
            </p>
          ) : notifications.length === 0 ? (
            <p style={{ padding: "20px", color: currentTheme.muted }}>
              まだ通知がない
            </p>
          ) : (
            notifications.map((notification) => {
              const actorId = notification.actor_user_id;
              const avatarUrl = getAvatarUrl(actorId);
              const actorName = getDisplayName(actorId);
              const actorUsername = getUsername(actorId);
              const profileHref = actorId ? `/users/${actorId}` : "/profile";
              const text = buildNotificationText(notification);

              return (
                <article
                  key={notification.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "18px 20px",
                    borderBottom: `1px solid ${currentTheme.border}`,
                    background: currentTheme.background,
                  }}
                >
                  {avatarUrl ? (
                    <Link href={profileHref}>
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        style={{
                          width: sizes.avatar,
                          height: sizes.avatar,
                          borderRadius: "9999px",
                          objectFit: "cover",
                          border: `1px solid ${currentTheme.border}`,
                          flexShrink: 0,
                        }}
                      />
                    </Link>
                  ) : (
                    <Link
                      href={profileHref}
                      style={{
                        width: sizes.avatar,
                        height: sizes.avatar,
                        borderRadius: "9999px",
                        background: currentTheme.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        textDecoration: "none",
                        fontWeight: "bold",
                        flexShrink: 0,
                      }}
                    >
                      {actorName.slice(0, 1).toUpperCase()}
                    </Link>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <Link
                        href={profileHref}
                        style={{
                          color: currentTheme.text,
                          textDecoration: "none",
                          fontWeight: "bold",
                          fontSize: sizes.text,
                        }}
                      >
                        {actorName}
                      </Link>

                      <span
                        style={{
                          color: currentTheme.muted,
                          fontSize: sizes.meta,
                          wordBreak: "break-all",
                        }}
                      >
                        @{actorUsername}
                      </span>

                      <span
                        style={{
                          color: currentTheme.muted,
                          fontSize: sizes.meta,
                        }}
                      >
                        ・ {formatDate(notification.created_at)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: sizes.text,
                        lineHeight: 1.6,
                        marginBottom: "6px",
                        wordBreak: "break-word",
                      }}
                    >
                      {text.title}
                    </div>

                    <div
                      style={{
                        color: currentTheme.muted,
                        fontSize: sizes.meta,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {text.sub}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
