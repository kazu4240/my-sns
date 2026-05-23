"use client";

import Link from "next/link";
import { MouseEvent as ReactMouseEvent, useEffect, useMemo, useState } from "react";
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

function BellIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M18 8.8C18 5.55 15.3 3 12 3C8.7 3 6 5.55 6 8.8V12.4C6 13.5 5.55 14.55 4.75 15.35L4 16.1V17.5H20V16.1L19.25 15.35C18.45 14.55 18 13.5 18 12.4V8.8Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.6 20C10.1 20.65 10.95 21 12 21C13.05 21 13.9 20.65 14.4 20"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeartMiniIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path d="M12 20.5C11.7 20.5 11.4 20.4 11.1 20.2C8.7 18.5 3 14.3 3 9.2C3 6.3 5.2 4 8.1 4C9.8 4 11.1 4.8 12 5.8C12.9 4.8 14.2 4 15.9 4C18.8 4 21 6.3 21 9.2C21 14.3 15.3 18.5 12.9 20.2C12.6 20.4 12.3 20.5 12 20.5Z" />
    </svg>
  );
}

function ReplyMiniIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M21 11.5C21 15.0899 17.6421 18 13.5 18H9L4 21V16.5C2.775 15.3107 2 13.491 2 11.5C2 7.91015 5.35786 5 9.5 5H13.5C17.6421 5 21 7.91015 21 11.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FollowMiniIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M15 19C15 16.7909 12.3137 15 9 15C5.68629 15 3 16.7909 3 19"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 12C11.2091 12 13 10.2091 13 8C13 5.79086 11.2091 4 9 4C6.79086 4 5 5.79086 5 8C5 10.2091 6.79086 12 9 12Z"
        stroke={color}
        strokeWidth="1.8"
      />
      <path
        d="M18 8V14"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15 11H21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [avatarFrames, setAvatarFrames] = useState<Record<string, AvatarFrame>>({});
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
          icon: 18,
        }
      : uiScale === "large"
      ? {
          avatar: 56,
          title: 28,
          text: 17,
          meta: 14,
          icon: 22,
        }
      : {
          avatar: 48,
          title: 24,
          text: 15,
          meta: 13,
          icon: 20,
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

  const getAvatarFrame = (userId: string | null) => {
    if (!userId) return null;

    const frameKey = profiles[userId]?.selected_avatar_frame_key;
    if (!frameKey) return null;

    return avatarFrames[frameKey] ?? null;
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    if (type === "like") {
      return <HeartMiniIcon size={sizes.icon} color="#ff5a79" />;
    }

    if (type === "reply") {
      return <ReplyMiniIcon size={sizes.icon} color={currentTheme.accent} />;
    }

    return <FollowMiniIcon size={sizes.icon} color="#63d471" />;
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
        setAvatarFrames({});
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

      const { data: frameData, error: frameError } = await supabase
        .from("avatar_frames")
        .select("frame_key, name, rarity, border_css, glow_css, sort_order")
        .order("sort_order", { ascending: true });

      if (frameError) {
        console.error(frameError);
        setAvatarFrames({});
      } else {
        const frameMap: Record<string, AvatarFrame> = {};
        for (const frame of frameData ?? []) {
          frameMap[frame.frame_key] = frame as AvatarFrame;
        }
        setAvatarFrames(frameMap);
      }

      if (uniqueUserIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "user_id, display_name, username, bio, avatar_url, selected_avatar_frame_key, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
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
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("通知の読み込みに失敗しました。");
      setNotifications([]);
      setProfiles({});
      setAvatarFrames({});
      setPostsMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const renderAvatar = ({
    userId,
    avatarUrl,
    actorName,
    profileHref,
  }: {
    userId: string | null;
    avatarUrl: string | null;
    actorName: string;
    profileHref: string;
  }) => {
    const frame = getAvatarFrame(userId);
    const framePadding = frame ? 3 : 0;

    return (
      <Link
        href={profileHref}
        onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
        style={{
          width: sizes.avatar,
          height: sizes.avatar,
          borderRadius: "9999px",
          padding: framePadding,
          border: frame?.border_css ?? "none",
          boxShadow: frame?.glow_css ?? "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          flexShrink: 0,
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: sizes.text,
            }}
          >
            {actorName.slice(0, 1).toUpperCase()}
          </div>
        )}
      </Link>
    );
  };

  const renderNotificationContent = (notification: Notification) => {
    const actorId = notification.actor_user_id;
    const avatarUrl = getAvatarUrl(actorId);
    const actorName = getDisplayName(actorId);
    const actorUsername = getUsername(actorId);
    const profileHref = actorId ? `/users/${actorId}` : "/profile";
    const text = buildNotificationText(notification);
    const postHref = notification.post_id ? `/posts/${notification.post_id}` : null;
    const unread = !notification.is_read;

    const card = (
      <article
        style={{
          display: "flex",
          gap: "12px",
          padding: "18px 20px",
          borderBottom: `1px solid ${currentTheme.border}`,
          background: unread ? `${currentTheme.card}` : currentTheme.background,
          position: "relative",
          cursor: postHref ? "pointer" : "default",
          transition: "background 0.15s ease",
        }}
      >
        {unread && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "8px",
              height: "8px",
              borderRadius: "9999px",
              background: currentTheme.accent,
            }}
          />
        )}

        <div style={{ position: "relative", flexShrink: 0 }}>
          {renderAvatar({
            userId: actorId,
            avatarUrl,
            actorName,
            profileHref,
          })}

          <div
            style={{
              position: "absolute",
              right: "-4px",
              bottom: "-4px",
              width: "26px",
              height: "26px",
              borderRadius: "9999px",
              background: currentTheme.background,
              border: `1px solid ${currentTheme.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {getNotificationIcon(notification.type)}
          </div>
        </div>

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
              onClick={(e: ReactMouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
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

            {unread && (
              <span
                style={{
                  color: currentTheme.accent,
                  fontSize: sizes.meta,
                  fontWeight: "bold",
                }}
              >
                未読
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: sizes.text,
              lineHeight: 1.6,
              marginBottom: "8px",
              wordBreak: "break-word",
              fontWeight: unread ? "bold" : "normal",
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
              border: postHref ? `1px solid ${currentTheme.border}` : "none",
              borderRadius: postHref ? "14px" : 0,
              padding: postHref ? "10px 12px" : 0,
              background: postHref ? "rgba(255,255,255,0.03)" : "transparent",
            }}
          >
            {text.sub}
          </div>

          {postHref && (
            <div
              style={{
                marginTop: "8px",
                color: currentTheme.accent,
                fontSize: sizes.meta,
                fontWeight: "bold",
              }}
            >
              投稿を見る
            </div>
          )}
        </div>
      </article>
    );

    if (!postHref) {
      return (
        <div key={notification.id}>
          {card}
        </div>
      );
    }

    return (
      <Link
        key={notification.id}
        href={postHref}
        style={{
          display: "block",
          color: "inherit",
          textDecoration: "none",
        }}
      >
        {card}
      </Link>
    );
  };

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
            backdropFilter: "blur(14px)",
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
              marginBottom: "10px",
              fontWeight: "bold",
            }}
          >
            ← ホームに戻る
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <BellIcon size={sizes.icon + 4} color={currentTheme.accent} />
            <h1
              style={{
                margin: 0,
                fontSize: sizes.title,
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              通知
            </h1>
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
            <div
              style={{
                padding: "34px 20px",
                color: currentTheme.muted,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "9999px",
                  border: `1px solid ${currentTheme.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <BellIcon size={28} color={currentTheme.muted} />
              </div>
              まだ通知がない
            </div>
          ) : (
            notifications.map((notification) => renderNotificationContent(notification))
          )}
        </section>
      </div>
    </main>
  );
}
