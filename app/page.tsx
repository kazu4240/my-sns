"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Post = {
  id: number;
  content: string;
  created_at: string;
  likes: number;
  user_id: string | null;
  user_email: string | null;
  image_url: string | null;
  parent_id: number | null;
};

type Profile = {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme_background_color: string | null;
  theme_card_color: string | null;
  theme_text_color: string | null;
  theme_accent_color: string | null;
};

type NotificationInsert = {
  user_id: string;
  actor_user_id: string;
  type: "like" | "reply" | "follow";
  post_id: number | null;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_CARD = "#192734";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const maxLength = 140;
  const remaining = useMemo(() => maxLength - text.length, [text]);

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

  const rootPosts = useMemo(() => {
    return posts.filter((post) => post.parent_id === null);
  }, [posts]);

  const repliesByParent = useMemo(() => {
    const map: Record<number, Post[]> = {};

    for (const post of posts) {
      if (post.parent_id !== null) {
        if (!map[post.parent_id]) {
          map[post.parent_id] = [];
        }
        map[post.parent_id].push(post);
      }
    }

    for (const key of Object.keys(map)) {
      map[Number(key)].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return map;
  }, [posts]);

  const fetchUnreadNotifications = async (currentUserId?: string | null) => {
    if (!currentUserId) {
      setUnreadNotifications(0);
      return;
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", currentUserId)
      .eq("is_read", false);

    if (error) {
      console.error(error);
      setUnreadNotifications(0);
      return;
    }

    setUnreadNotifications(count ?? 0);
  };

  const createNotification = async ({
    user_id,
    actor_user_id,
    type,
    post_id,
  }: NotificationInsert) => {
    if (user_id === actor_user_id) return;

    const { error } = await supabase.from("notifications").insert({
      user_id,
      actor_user_id,
      type,
      post_id,
    });

    if (error) {
      console.error("通知作成失敗:", error.message);
    }
  };

  const fetchPostsAndProfiles = async (currentUserId?: string | null) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(error.message);
      }

      const postsData = (data ?? []) as Post[];
      setPosts(postsData);

      const idSet = new Set<string>();

      for (const post of postsData) {
        if (post.user_id) {
          idSet.add(post.user_id);
        }
      }

      if (currentUserId) {
        idSet.add(currentUserId);
      }

      const userIds = Array.from(idSet);

      if (userIds.length === 0) {
        setProfiles({});
        await fetchUnreadNotifications(currentUserId);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "user_id, display_name, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color"
        )
        .in("user_id", userIds);

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

      await fetchUnreadNotifications(currentUserId);
    } catch (error) {
      console.error(error);
      setPosts([]);
      setProfiles({});
      setErrorMessage("ホームの読み込みに失敗しました。再読み込みしてみて。");
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error(error);
    }

    const currentEmail = user?.email ?? null;
    const currentId = user?.id ?? null;

    setUserEmail(currentEmail);
    setUserId(currentId);

    return {
      currentEmail,
      currentId,
    };
  };

  useEffect(() => {
    const init = async () => {
      const { currentId } = await checkUser();
      await fetchPostsAndProfiles(currentId);
    };

    init();
  }, []);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    setSelectedImage(file);

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl("");
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl("");
  };

  const uploadPostImage = async () => {
    if (!selectedImage || !userId) return null;

    const fileExt = selectedImage.name.split(".").pop() || "png";
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(filePath, selectedImage, {
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("post-images").getPublicUrl(filePath);

    return data.publicUrl;
  };

  const resetComposer = () => {
    setText("");
    setSelectedImage(null);
    setPreviewUrl("");
    setEditingId(null);
    setReplyingToId(null);
  };

  const handlePost = async () => {
    if (!userEmail || !userId) {
      alert("投稿するにはログインしてね");
      return;
    }

    if (!text.trim() && !selectedImage) return;
    if (text.length > maxLength) return;

    setSubmitting(true);

    try {
      if (editingId !== null) {
        const targetPost = posts.find((post) => post.id === editingId);

        if (!targetPost || targetPost.user_id !== userId) {
          alert("自分の投稿だけ編集できるよ");
          setSubmitting(false);
          return;
        }

        const { error } = await supabase
          .from("posts")
          .update({ content: text.trim() })
          .eq("id", editingId);

        if (error) {
          alert("更新失敗: " + error.message);
          setSubmitting(false);
          return;
        }

        setPosts((prev) =>
          prev.map((post) =>
            post.id === editingId ? { ...post, content: text.trim() } : post
          )
        );

        resetComposer();
        setSubmitting(false);
        return;
      }

      let imageUrl: string | null = null;

      if (selectedImage) {
        imageUrl = await uploadPostImage();
      }

      const replyTarget =
        replyingToId !== null
          ? posts.find((post) => post.id === replyingToId) ?? null
          : null;

      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            content: text.trim(),
            likes: 0,
            user_id: userId,
            user_email: userEmail,
            image_url: imageUrl,
            parent_id: replyingToId,
          },
        ])
        .select()
        .single();

      if (error) {
        alert("投稿失敗: " + error.message);
        setSubmitting(false);
        return;
      }

      if (data) {
        setPosts((prev) => [data as Post, ...prev]);

        if (
          replyingToId !== null &&
          replyTarget?.user_id &&
          replyTarget.user_id !== userId
        ) {
          await createNotification({
            user_id: replyTarget.user_id,
            actor_user_id: userId,
            type: "reply",
            post_id: replyTarget.id,
          });
        }
      }

      resetComposer();
    } catch (error) {
      console.error(error);
      alert("投稿失敗");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (post: Post) => {
    if (!userId) {
      alert("いいねするにはログインしてね");
      return;
    }

    const { error } = await supabase
      .from("posts")
      .update({ likes: post.likes + 1 })
      .eq("id", post.id);

    if (error) {
      alert("いいね失敗: " + error.message);
      return;
    }

    setPosts((prev) =>
      prev.map((item) =>
        item.id === post.id ? { ...item, likes: post.likes + 1 } : item
      )
    );

    if (post.user_id && post.user_id !== userId) {
      await createNotification({
        user_id: post.user_id,
        actor_user_id: userId,
        type: "like",
        post_id: post.id,
      });
    }
  };

  const handleDelete = async (post: Post) => {
    if (!userId || post.user_id !== userId) {
      alert("自分の投稿だけ削除できるよ");
      return;
    }

    const ok = window.confirm("この投稿を削除する？");
    if (!ok) return;

    const { error } = await supabase.from("posts").delete().eq("id", post.id);

    if (error) {
      alert("削除失敗: " + error.message);
      return;
    }

    setPosts((prev) => prev.filter((item) => item.id !== post.id));

    if (editingId === post.id || replyingToId === post.id) {
      resetComposer();
    }
  };

  const handleEdit = (post: Post) => {
    if (!userId || post.user_id !== userId) {
      alert("自分の投稿だけ編集できるよ");
      return;
    }

    setEditingId(post.id);
    setReplyingToId(null);
    setText(post.content);
    setSelectedImage(null);
    setPreviewUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReply = (post: Post) => {
    if (!userId) {
      alert("返信するにはログインしてね");
      return;
    }

    setEditingId(null);
    setReplyingToId(post.id);
    setText("");
    setSelectedImage(null);
    setPreviewUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetComposer();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("ログアウト失敗: " + error.message);
      return;
    }

    setUserEmail(null);
    setUserId(null);
    resetComposer();
    setProfiles({});
    setUnreadNotifications(0);
    await fetchPostsAndProfiles(null);
    alert("ログアウトしたよ");
  };

  const handleRefresh = async () => {
    const { currentId } = await checkUser();
    await fetchPostsAndProfiles(currentId);
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

  const getDisplayName = (post: Post) => {
    if (post.user_id && profiles[post.user_id]?.display_name) {
      return profiles[post.user_id].display_name!;
    }
    return post.user_email?.split("@")[0] ?? "Kazuki";
  };

  const getUsername = (post: Post) => {
    return post.user_email?.split("@")[0] ?? "kazuki";
  };

  const getAvatarUrl = (post: Post) => {
    if (post.user_id && profiles[post.user_id]?.avatar_url) {
      return profiles[post.user_id].avatar_url!;
    }
    return null;
  };

  const myAvatarUrl =
    userId && profiles[userId]?.avatar_url ? profiles[userId].avatar_url : null;

  const replyTargetPost =
    replyingToId !== null
      ? posts.find((post) => post.id === replyingToId) ?? null
      : null;

  const renderPostCard = (post: Post, isReply = false) => {
    const isOwner = !!userId && post.user_id === userId;
    const replies = repliesByParent[post.id] ?? [];
    const profileHref = post.user_id ? `/users/${post.user_id}` : "/profile";

    return (
      <article
        key={post.id}
        style={{
          display: "flex",
          gap: "14px",
          padding: isReply ? "16px 0 0 0" : "18px 20px",
          borderBottom: isReply ? "none" : `1px solid ${currentTheme.border}`,
          marginLeft: isReply ? "20px" : "0",
        }}
      >
        {getAvatarUrl(post) ? (
          <Link href={profileHref} style={{ flexShrink: 0 }}>
            <img
              src={getAvatarUrl(post)!}
              alt="avatar"
              style={{
                width: isReply ? "40px" : "48px",
                height: isReply ? "40px" : "48px",
                borderRadius: "9999px",
                objectFit: "cover",
                display: "block",
                border: `1px solid ${currentTheme.border}`,
                boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
              }}
            />
          </Link>
        ) : (
          <Link
            href={profileHref}
            style={{
              width: isReply ? "40px" : "48px",
              height: isReply ? "40px" : "48px",
              borderRadius: "9999px",
              background: currentTheme.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              flexShrink: 0,
              color: "#ffffff",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
            }}
          >
            {getDisplayName(post).slice(0, 1).toUpperCase()}
          </Link>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              background: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: isReply ? "18px" : "20px",
              padding: isReply ? "14px 16px" : "16px 18px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                marginBottom: "10px",
                flexWrap: "wrap",
              }}
            >
              <Link
                href={profileHref}
                style={{
                  fontWeight: "bold",
                  color: currentTheme.text,
                  textDecoration: "none",
                  fontSize: isReply ? "15px" : "16px",
                }}
              >
                {getDisplayName(post)}
              </Link>

              <span style={{ color: currentTheme.muted, fontSize: "14px" }}>
                @{getUsername(post)}
              </span>

              <span style={{ color: currentTheme.muted, fontSize: "13px" }}>
                ・ {formatDate(post.created_at)}
              </span>

              {isReply && (
                <span
                  style={{
                    color: currentTheme.accent,
                    fontSize: "12px",
                    fontWeight: "bold",
                    padding: "4px 8px",
                    borderRadius: "9999px",
                    background: "rgba(29,155,240,0.12)",
                  }}
                >
                  返信
                </span>
              )}
            </div>

            <p
              style={{
                fontSize: isReply ? "15px" : "17px",
                lineHeight: 1.75,
                whiteSpace: "pre-wrap",
                margin: 0,
                marginBottom: post.image_url ? "12px" : "14px",
                color: currentTheme.text,
                wordBreak: "break-word",
              }}
            >
              {post.content}
            </p>

            {post.image_url && (
              <div
                style={{
                  marginBottom: "14px",
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: "18px",
                  overflow: "hidden",
                  background: currentTheme.background,
                }}
              >
                <img
                  src={post.image_url}
                  alt="post image"
                  style={{
                    width: "100%",
                    maxHeight: "420px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                paddingTop: "2px",
              }}
            >
              <button
                onClick={() => handleLike(post)}
                style={{
                  background: "transparent",
                  color: currentTheme.muted,
                  border: `1px solid ${currentTheme.border}`,
                  padding: "8px 14px",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "bold",
                }}
              >
                ❤️ いいね {post.likes}
              </button>

              {!isReply && (
                <button
                  onClick={() => handleReply(post)}
                  style={{
                    background: "transparent",
                    color: currentTheme.accent,
                    border: `1px solid ${currentTheme.border}`,
                    padding: "8px 14px",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "bold",
                  }}
                >
                  💬 返信 {replies.length}
                </button>
              )}

              {isOwner && (
                <>
                  <button
                    onClick={() => handleEdit(post)}
                    style={{
                      background: "transparent",
                      color: "#ffd166",
                      border: `1px solid ${currentTheme.border}`,
                      padding: "8px 14px",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    ✏️ 編集
                  </button>

                  <button
                    onClick={() => handleDelete(post)}
                    style={{
                      background: "transparent",
                      color: "#ff6b6b",
                      border: `1px solid ${currentTheme.border}`,
                      padding: "8px 14px",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    🗑 削除
                  </button>
                </>
              )}
            </div>
          </div>

          {!isReply && replies.length > 0 && (
            <div
              style={{
                marginTop: "12px",
                paddingLeft: "8px",
                borderLeft: `2px solid ${currentTheme.border}`,
              }}
            >
              {replies.map((reply) => renderPostCard(reply, true))}
            </div>
          )}
        </div>
      </article>
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
          maxWidth: "720px",
          margin: "0 auto",
          borderLeft: `1px solid ${currentTheme.border}`,
          borderRight: `1px solid ${currentTheme.border}`,
          minHeight: "100vh",
          background: currentTheme.background,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.02)",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            background: `${currentTheme.background}ee`,
            backdropFilter: "blur(14px)",
            borderBottom: `1px solid ${currentTheme.border}`,
            padding: "16px 20px 14px",
            zIndex: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "16px",
              marginBottom: "12px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: currentTheme.text,
                  letterSpacing: "-0.02em",
                }}
              >
                Ulein
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <Link
                href="/search"
                style={{
                  color: currentTheme.accent,
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                検索
              </Link>

              <Link
                href="/notifications"
                style={{
                  color: currentTheme.accent,
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "bold",
                  position: "relative",
                }}
              >
                通知
                {unreadNotifications > 0 && (
                  <span
                    style={{
                      marginLeft: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "20px",
                      height: "20px",
                      padding: "0 6px",
                      borderRadius: "9999px",
                      background: "#ff4d4f",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "bold",
                      boxShadow: "0 4px 12px rgba(255,77,79,0.3)",
                    }}
                  >
                    {unreadNotifications}
                  </span>
                )}
              </Link>

              <Link
                href="/profile"
                style={{
                  color: currentTheme.accent,
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                プロフィール
              </Link>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {userEmail ? (
              <>
                <span
                  style={{
                    fontSize: "13px",
                    color: currentTheme.muted,
                    wordBreak: "break-all",
                  }}
                >
                  ログイン中: {userEmail}
                </span>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    style={{
                      background: currentTheme.card,
                      color: currentTheme.accent,
                      border: `1px solid ${currentTheme.border}`,
                      padding: "8px 14px",
                      borderRadius: "9999px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    再読み込み
                  </button>

                  <button
                    onClick={handleLogout}
                    style={{
                      background: currentTheme.card,
                      color: "#ff6b6b",
                      border: `1px solid ${currentTheme.border}`,
                      padding: "8px 14px",
                      borderRadius: "9999px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    ログアウト
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                style={{
                  color: currentTheme.accent,
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                ログインはこちら
              </Link>
            )}
          </div>
        </header>

        <section
          style={{
            padding: "18px 20px 20px",
            borderBottom: `1px solid ${currentTheme.border}`,
          }}
        >
          {!userEmail && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "16px",
                background: "rgba(255,209,102,0.10)",
                border: "1px solid rgba(255,209,102,0.25)",
                color: "#ffd166",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              投稿するにはログインしてね
            </div>
          )}

          {replyTargetPost && (
            <div
              style={{
                marginBottom: "14px",
                padding: "14px 16px",
                borderRadius: "18px",
                border: `1px solid ${currentTheme.border}`,
                background: currentTheme.card,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: currentTheme.accent,
                  marginBottom: "8px",
                  fontWeight: "bold",
                  letterSpacing: "0.02em",
                }}
              >
                返信先
              </div>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                  color: currentTheme.text,
                }}
              >
                {getDisplayName(replyTargetPost)}
              </div>
              <div
                style={{
                  color: currentTheme.softText,
                  fontSize: "14px",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                }}
              >
                {replyTargetPost.content}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "flex-start",
            }}
          >
            {myAvatarUrl ? (
              <img
                src={myAvatarUrl}
                alt="my avatar"
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "9999px",
                  objectFit: "cover",
                  flexShrink: 0,
                  border: `1px solid ${currentTheme.border}`,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
                }}
              />
            ) : (
              <Link
                href="/profile"
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "9999px",
                  background: currentTheme.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  flexShrink: 0,
                  color: "#ffffff",
                  textDecoration: "none",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.14)",
                }}
              >
                K
              </Link>
            )}

            <div
              style={{
                flex: 1,
                minWidth: 0,
                background: currentTheme.card,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "22px",
                padding: "16px",
                boxShadow: "0 12px 32px rgba(0,0,0,0.10)",
              }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  userEmail
                    ? editingId !== null
                      ? "投稿を編集"
                      : replyingToId !== null
                      ? "返信を入力"
                      : "いま何してる？"
                    : "ログインすると投稿できる"
                }
                disabled={!userEmail || submitting}
                style={{
                  width: "100%",
                  minHeight: "120px",
                  background: "transparent",
                  color: currentTheme.text,
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: "22px",
                  lineHeight: 1.6,
                  opacity: userEmail ? 1 : 0.5,
                }}
              />

              {previewUrl && (
                <div
                  style={{
                    marginTop: "12px",
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: "18px",
                    overflow: "hidden",
                    maxWidth: "100%",
                    background: currentTheme.background,
                  }}
                >
                  <img
                    src={previewUrl}
                    alt="preview"
                    style={{
                      width: "100%",
                      maxHeight: "360px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              )}

              {editingId === null && (
                <div style={{ marginTop: "14px" }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={!userEmail || submitting}
                    style={{
                      color: currentTheme.text,
                      fontSize: "14px",
                    }}
                  />

                  {selectedImage && (
                    <div style={{ marginTop: "10px" }}>
                      <button
                        onClick={clearImage}
                        type="button"
                        style={{
                          background: "transparent",
                          color: "#ff6b6b",
                          border: `1px solid ${currentTheme.border}`,
                          padding: "8px 14px",
                          borderRadius: "9999px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "bold",
                        }}
                      >
                        画像を外す
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "14px",
                  paddingTop: "14px",
                  borderTop: `1px solid ${currentTheme.border}`,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: remaining < 0 ? "#ff4d4f" : currentTheme.muted,
                    fontWeight: "bold",
                  }}
                >
                  {editingId !== null
                    ? "編集中"
                    : replyingToId !== null
                    ? "返信中"
                    : `あと ${remaining} 文字`}
                </span>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {(editingId !== null || replyingToId !== null) && (
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        background: "transparent",
                        color: currentTheme.muted,
                        border: `1px solid ${currentTheme.border}`,
                        padding: "10px 18px",
                        borderRadius: "9999px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      キャンセル
                    </button>
                  )}

                  <button
                    onClick={handlePost}
                    disabled={
                      !userEmail ||
                      (!text.trim() && !selectedImage) ||
                      remaining < 0 ||
                      submitting
                    }
                    style={{
                      background:
                        !userEmail ||
                        (!text.trim() && !selectedImage) ||
                        remaining < 0 ||
                        submitting
                          ? "#375a7f"
                          : currentTheme.accent,
                      color: "#ffffff",
                      border: "none",
                      padding: "11px 20px",
                      borderRadius: "9999px",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor:
                        !userEmail ||
                        (!text.trim() && !selectedImage) ||
                        remaining < 0 ||
                        submitting
                          ? "not-allowed"
                          : "pointer",
                      boxShadow:
                        !userEmail ||
                        (!text.trim() && !selectedImage) ||
                        remaining < 0 ||
                        submitting
                          ? "none"
                          : "0 8px 20px rgba(29,155,240,0.28)",
                    }}
                  >
                    {submitting
                      ? "送信中..."
                      : editingId !== null
                      ? "更新"
                      : replyingToId !== null
                      ? "返信"
                      : "投稿"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
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

          {loading ? (
            <p style={{ padding: "24px 20px", color: currentTheme.muted }}>
              読み込み中...
            </p>
          ) : rootPosts.length === 0 ? (
            <p style={{ padding: "24px 20px", color: currentTheme.muted }}>
              まだ投稿がない
            </p>
          ) : (
            rootPosts.map((post) => renderPostCard(post))
          )}
        </section>
      </div>
    </main>
  );
}