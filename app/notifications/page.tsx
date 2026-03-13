"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Notification = {
  id: number;
  user_id: string;
  actor_user_id: string;
  type: "like" | "reply" | "follow";
  post_id: number | null;
  is_read: boolean;
  created_at: string;
};

type Profile = {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type Post = {
  id: number;
  content: string;
};

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [posts, setPosts] = useState<Record<number, Post>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.is_read).length;
  }, [notifications]);

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
        setPosts({});
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(error.message);
      }

      const notificationData = (data ?? []) as Notification[];
      setNotifications(notificationData);

      const actorIds = Array.from(
        new Set(notificationData.map((item) => item.actor_user_id))
      );

      const postIds = Array.from(
        new Set(
          notificationData
            .map((item) => item.post_id)
            .filter((value): value is number => value !== null)
        )
      );

      if (actorIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, display_name, bio, avatar_url")
          .in("user_id", actorIds);

        if (profileError) {
          console.error(profileError);
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
        const { data: postData, error: postError } = await supabase
          .from("posts")
          .select("id, content")
          .in("id", postIds);

        if (postError) {
          console.error(postError);
        } else {
          const postMap: Record<number, Post> = {};
          for (const post of postData ?? []) {
            postMap[post.id] = post;
          }
          setPosts(postMap);
        }
      } else {
        setPosts({});
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("通知の読み込みに失敗しました。");
      setNotifications([]);
      setProfiles({});
      setPosts({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllAsRead = async () => {
    if (!currentUserId) return;

    const unreadIds = notifications
      .filter((item) => !item.is_read)
      .map((item) => item.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds)
      .eq("user_id", currentUserId);

    if (error) {
      alert("既読失敗: " + error.message);
      return;
    }

    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        is_read: true,
      }))
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActorName = (actorUserId: string) => {
    return profiles[actorUserId]?.display_name || "ユーザー";
  };

  const getActorAvatar = (actorUserId: string) => {
    return profiles[actorUserId]?.avatar_url || null;
  };

  const getNotificationText = (item: Notification) => {
    if (item.type === "like") {
      return "あなたの投稿にいいねしました";
    }

    if (item.type === "reply") {
      return "あなたの投稿に返信しました";
    }

    return "あなたをフォローしました";
  };

  const getNotificationLabel = (item: Notification) => {
    if (item.type === "like") return "いいね";
    if (item.type === "reply") return "返信";
    return "フォロー";
  };

  const getNotificationAccent = (item: Notification) => {
    if (item.type === "like") return "#ff6b81";
    if (item.type === "reply") return "#1d9bf0";
    return "#22c55e";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#15202b",
        color: "white",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          borderLeft: "1px solid #2f3336",
          borderRight: "1px solid #2f3336",
          minHeight: "100vh",
          background: "#15202b",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.02)",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            background: "rgba(21,32,43,0.93)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid #2f3336",
            padding: "16px 20px 14px",
            zIndex: 20,
          }}
        >
          <Link
            href="/"
            style={{
              color: "#1d9bf0",
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
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: "6px",
                }}
              >
                Ulein
              </div>

              <div
                style={{
                  color: "#8899a6",
                  fontSize: "14px",
                }}
              >
                未読 {unreadCount} 件
              </div>
            </div>

            <button
              onClick={markAllAsRead}
              style={{
                background: "#192734",
                color: "#1d9bf0",
                border: "1px solid #2f3336",
                padding: "10px 16px",
                borderRadius: "9999px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
                boxShadow: "0 8px 20px rgba(0,0,0,0.10)",
              }}
            >
              すべて既読にする
            </button>
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

        <section style={{ padding: "18px 20px 24px" }}>
          {loading ? (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "20px",
                padding: "18px",
                color: "#8899a6",
                background: "#192734",
              }}
            >
              読み込み中...
            </div>
          ) : notifications.length === 0 ? (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "20px",
                padding: "22px",
                color: "#8899a6",
                background: "#192734",
                textAlign: "center",
                boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
              }}
            >
              まだ通知がない
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {notifications.map((item) => {
                const actorHref = `/users/${item.actor_user_id}`;
                const actorAvatar = getActorAvatar(item.actor_user_id);
                const relatedPost = item.post_id ? posts[item.post_id] : null;
                const accentColor = getNotificationAccent(item);

                return (
                  <article
                    key={item.id}
                    style={{
                      display: "flex",
                      gap: "14px",
                      padding: "18px",
                      border: item.is_read
                        ? "1px solid #2f3336"
                        : `1px solid ${accentColor}55`,
                      borderRadius: "22px",
                      background: item.is_read ? "#192734" : "#173144",
                      boxShadow: item.is_read
                        ? "0 10px 28px rgba(0,0,0,0.08)"
                        : "0 12px 30px rgba(0,0,0,0.12)",
                    }}
                  >
                    {actorAvatar ? (
                      <Link href={actorHref} style={{ flexShrink: 0 }}>
                        <img
                          src={actorAvatar}
                          alt="avatar"
                          style={{
                            width: "52px",
                            height: "52px",
                            borderRadius: "9999px",
                            objectFit: "cover",
                            border: "1px solid #2f3336",
                            display: "block",
                            boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
                          }}
                        />
                      </Link>
                    ) : (
                      <Link
                        href={actorHref}
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "9999px",
                          background: accentColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          color: "white",
                          textDecoration: "none",
                          flexShrink: 0,
                          boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
                        }}
                      >
                        {getActorName(item.actor_user_id).charAt(0).toUpperCase()}
                      </Link>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                          flexWrap: "wrap",
                          marginBottom: "10px",
                        }}
                      >
                        <Link
                          href={actorHref}
                          style={{
                            color: "white",
                            fontWeight: "bold",
                            textDecoration: "none",
                            fontSize: "15px",
                          }}
                        >
                          {getActorName(item.actor_user_id)}
                        </Link>

                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            padding: "4px 8px",
                            borderRadius: "9999px",
                            background: `${accentColor}22`,
                            color: accentColor,
                          }}
                        >
                          {getNotificationLabel(item)}
                        </span>

                        {!item.is_read && (
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "bold",
                              padding: "4px 8px",
                              borderRadius: "9999px",
                              background: "rgba(255,255,255,0.08)",
                              color: "#ffffff",
                            }}
                          >
                            未読
                          </span>
                        )}

                        <span style={{ color: "#8899a6", fontSize: "13px" }}>
                          ・ {formatDate(item.created_at)}
                        </span>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          marginBottom: relatedPost ? "12px" : "0",
                          color: "white",
                          lineHeight: 1.7,
                          fontSize: "15px",
                        }}
                      >
                        {getNotificationText(item)}
                      </p>

                      {relatedPost && (
                        <Link
                          href={`/posts/${relatedPost.id}`}
                          style={{
                            display: "block",
                            border: "1px solid #2f3336",
                            borderRadius: "16px",
                            padding: "14px",
                            color: "#cfd9de",
                            fontSize: "14px",
                            whiteSpace: "pre-wrap",
                            textDecoration: "none",
                            background: "#15202b",
                            lineHeight: 1.7,
                            wordBreak: "break-word",
                          }}
                        >
                          {relatedPost.content}
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}