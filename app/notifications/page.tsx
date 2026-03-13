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

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#15202b",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          borderLeft: "1px solid #2f3336",
          borderRight: "1px solid #2f3336",
          minHeight: "100vh",
          background: "#15202b",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            background: "rgba(21,32,43,0.95)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #2f3336",
            padding: "18px 20px",
            zIndex: 10,
          }}
        >
          <Link
            href="/"
            style={{
              color: "#1d9bf0",
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-block",
              marginBottom: "8px",
            }}
          >
            ← ホームに戻る
          </Link>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              通知
            </h1>

            <button
              onClick={markAllAsRead}
              style={{
                background: "transparent",
                color: "#1d9bf0",
                border: "1px solid #2f3336",
                padding: "8px 14px",
                borderRadius: "9999px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              既読にする
            </button>
          </div>

          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "#8899a6",
              fontSize: "14px",
            }}
          >
            未読 {unreadCount} 件
          </p>
        </header>

        {errorMessage && (
          <div
            style={{
              padding: "20px",
              color: "#ffb4b4",
              borderBottom: "1px solid #2f3336",
            }}
          >
            {errorMessage}
          </div>
        )}

        <section>
          {loading ? (
            <p style={{ padding: "20px", color: "#8899a6" }}>読み込み中...</p>
          ) : notifications.length === 0 ? (
            <p style={{ padding: "20px", color: "#8899a6" }}>まだ通知がない</p>
          ) : (
            notifications.map((item) => {
              const actorHref = `/users/${item.actor_user_id}`;
              const actorAvatar = getActorAvatar(item.actor_user_id);
              const relatedPost = item.post_id ? posts[item.post_id] : null;

              return (
                <article
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "14px",
                    padding: "18px 20px",
                    borderBottom: "1px solid #2f3336",
                    background: item.is_read ? "transparent" : "#162d3d",
                  }}
                >
                  {actorAvatar ? (
                    <Link href={actorHref}>
                      <img
                        src={actorAvatar}
                        alt="avatar"
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "9999px",
                          objectFit: "cover",
                          border: "1px solid #2f3336",
                        }}
                      />
                    </Link>
                  ) : (
                    <Link
                      href={actorHref}
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "9999px",
                        background: "#1d9bf0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        color: "white",
                        textDecoration: "none",
                        flexShrink: 0,
                      }}
                    >
                      {getActorName(item.actor_user_id).charAt(0).toUpperCase()}
                    </Link>
                  )}

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: "8px",
                      }}
                    >
                      <Link
                        href={actorHref}
                        style={{
                          color: "white",
                          fontWeight: "bold",
                          textDecoration: "none",
                        }}
                      >
                        {getActorName(item.actor_user_id)}
                      </Link>

                      <span style={{ color: "#8899a6", fontSize: "14px" }}>
                        ・ {formatDate(item.created_at)}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        marginBottom: relatedPost ? "10px" : "0",
                        color: "white",
                        lineHeight: 1.6,
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
                          borderRadius: "14px",
                          padding: "12px",
                          color: "#cfd9de",
                          fontSize: "14px",
                          whiteSpace: "pre-wrap",
                          textDecoration: "none",
                        }}
                      >
                        {relatedPost.content}
                      </Link>
                    )}
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