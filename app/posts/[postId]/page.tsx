"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type NotificationInsert = {
  user_id: string;
  actor_user_id: string;
  type: "like" | "reply" | "follow";
  post_id: number | null;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";
const DEFAULT_MUTED = "#8899a6";

function ReplyIcon({ size, color }: { size: number; color: string }) {
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

function HeartIcon({
  size,
  color,
  filled,
}: {
  size: number;
  color: string;
  filled: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M12 20.5C11.7 20.5 11.4 20.4 11.1 20.2C8.7 18.5 3 14.3 3 9.2C3 6.3 5.2 4 8.1 4C9.8 4 11.1 4.8 12 5.8C12.9 4.8 14.2 4 15.9 4C18.8 4 21 6.3 21 9.2C21 14.3 15.3 18.5 12.9 20.2C12.6 20.4 12.3 20.5 12 20.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon({
  size,
  color,
  filled,
}: {
  size: number;
  color: string;
  filled: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M7 4.5H17C17.8284 4.5 18.5 5.17157 18.5 6V20L12 16L5.5 20V6C5.5 5.17157 6.17157 4.5 7 4.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <circle cx="6" cy="12" r="1.8" fill={color} />
      <circle cx="12" cy="12" r="1.8" fill={color} />
      <circle cx="18" cy="12" r="1.8" fill={color} />
    </svg>
  );
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [errorMessage, setErrorMessage] = useState("");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<number[]>([]);
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);

  const [replyingToPost, setReplyingToPost] = useState<Post | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  const numericPostId = useMemo(() => Number(postId), [postId]);

  const allPosts = useMemo(() => {
    return post ? [post, ...replies] : replies;
  }, [post, replies]);

  const loadPostPage = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      if (!Number.isFinite(numericPostId)) {
        setErrorMessage("投稿が見つかりません。");
        setPost(null);
        setReplies([]);
        setProfiles({});
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userId = user?.id ?? null;
      const userEmail = user?.email ?? null;

      setCurrentUserId(userId);
      setCurrentUserEmail(userEmail);

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", numericPostId)
        .maybeSingle();

      if (postError) {
        throw new Error(postError.message);
      }

      if (!postData) {
        setErrorMessage("投稿が見つかりません。");
        setPost(null);
        setReplies([]);
        setProfiles({});
        setLoading(false);
        return;
      }

      const mainPost = postData as Post;
      setPost(mainPost);

      const { data: repliesData, error: repliesError } = await supabase
        .from("posts")
        .select("*")
        .eq("parent_id", numericPostId)
        .order("created_at", { ascending: true });

      if (repliesError) {
        throw new Error(repliesError.message);
      }

      const replyPosts = (repliesData ?? []) as Post[];
      setReplies(replyPosts);

      if (userId) {
        const targetIds = [mainPost.id, ...replyPosts.map((item) => item.id)];

        const { data: likesData, error: likesError } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", userId)
          .in("post_id", targetIds);

        if (likesError) {
          console.error(likesError);
          setLikedPostIds([]);
        } else {
          const ids = (likesData ?? [])
            .map((item) => item.post_id)
            .filter((value): value is number => typeof value === "number");
          setLikedPostIds(ids);
        }

        const { data: bookmarkData, error: bookmarkError } = await supabase
          .from("bookmarks")
          .select("post_id")
          .eq("user_id", userId)
          .in("post_id", targetIds);

        if (bookmarkError) {
          console.error(bookmarkError);
          setBookmarkedPostIds([]);
        } else {
          const ids = (bookmarkData ?? [])
            .map((item) => item.post_id)
            .filter((value): value is number => typeof value === "number");
          setBookmarkedPostIds(ids);
        }
      } else {
        setLikedPostIds([]);
        setBookmarkedPostIds([]);
      }

      const userIds = Array.from(
        new Set(
          [
            userId,
            mainPost.user_id,
            ...replyPosts.map((item) => item.user_id),
          ].filter((value): value is string => !!value)
        )
      );

      if (userIds.length === 0) {
        setProfiles({});
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, bio, avatar_url")
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
    } catch (error) {
      console.error(error);
      setErrorMessage("投稿の読み込みに失敗しました。");
      setPost(null);
      setReplies([]);
      setProfiles({});
      setLikedPostIds([]);
      setBookmarkedPostIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostPage();
  }, [numericPostId]);

  useEffect(() => {
    const handleWindowClick = () => {
      setOpenMenuPostId(null);
    };

    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

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

  const getDisplayName = (item: Post) => {
    if (item.user_id && profiles[item.user_id]?.display_name) {
      return profiles[item.user_id].display_name!;
    }
    if (item.user_id && profiles[item.user_id]?.username) {
      return profiles[item.user_id].username!;
    }
    return item.user_email?.split("@")[0] ?? "ユーザー";
  };

  const getUsername = (item: Post) => {
    if (item.user_id && profiles[item.user_id]?.username) {
      return profiles[item.user_id].username!;
    }
    return item.user_email?.split("@")[0] ?? "user";
  };

  const getAvatarUrl = (item: Post) => {
    if (item.user_id && profiles[item.user_id]?.avatar_url) {
      return profiles[item.user_id].avatar_url!;
    }
    return null;
  };

  const replacePostInState = (postIdValue: number, nextLikes: number) => {
    setPost((prev) =>
      prev && prev.id === postIdValue ? { ...prev, likes: nextLikes } : prev
    );

    setReplies((prev) =>
      prev.map((item) =>
        item.id === postIdValue ? { ...item, likes: nextLikes } : item
      )
    );
  };

  const handleLike = async (item: Post) => {
    if (!currentUserId) {
      alert("いいねするにはログインしてね");
      return;
    }

    const alreadyLiked = likedPostIds.includes(item.id);

    if (alreadyLiked) {
      const { error: likeDeleteError } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", currentUserId)
        .eq("post_id", item.id);

      if (likeDeleteError) {
        alert("いいね解除失敗: " + likeDeleteError.message);
        return;
      }

      const nextLikes = Math.max(0, item.likes - 1);

      const { error: postUpdateError } = await supabase
        .from("posts")
        .update({ likes: nextLikes })
        .eq("id", item.id);

      if (postUpdateError) {
        alert("投稿更新失敗: " + postUpdateError.message);
        return;
      }

      setLikedPostIds((prev) => prev.filter((id) => id !== item.id));
      replacePostInState(item.id, nextLikes);
      return;
    }

    const { error: likeInsertError } = await supabase.from("likes").insert({
      user_id: currentUserId,
      post_id: item.id,
    });

    if (likeInsertError) {
      alert("いいね失敗: " + likeInsertError.message);
      return;
    }

    const nextLikes = item.likes + 1;

    const { error: postUpdateError } = await supabase
      .from("posts")
      .update({ likes: nextLikes })
      .eq("id", item.id);

    if (postUpdateError) {
      alert("投稿更新失敗: " + postUpdateError.message);
      return;
    }

    setLikedPostIds((prev) => [...prev, item.id]);
    replacePostInState(item.id, nextLikes);

    if (item.user_id) {
      await createNotification({
        user_id: item.user_id,
        actor_user_id: currentUserId,
        type: "like",
        post_id: item.id,
      });
    }
  };

  const handleToggleBookmark = async (item: Post) => {
    if (!currentUserId) {
      alert("ブックマークするにはログインしてね");
      return;
    }

    const isBookmarked = bookmarkedPostIds.includes(item.id);

    if (isBookmarked) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", currentUserId)
        .eq("post_id", item.id);

      if (error) {
        alert("ブックマーク解除失敗: " + error.message);
        return;
      }

      setBookmarkedPostIds((prev) => prev.filter((id) => id !== item.id));
      setOpenMenuPostId(null);
      return;
    }

    const { error } = await supabase.from("bookmarks").insert({
      user_id: currentUserId,
      post_id: item.id,
    });

    if (error) {
      alert("ブックマーク失敗: " + error.message);
      return;
    }

    setBookmarkedPostIds((prev) => [...prev, item.id]);
    setOpenMenuPostId(null);
  };

  const handleOpenReply = (item: Post) => {
    if (!currentUserId) {
      alert("返信するにはログインしてね");
      return;
    }

    setReplyingToPost(item);
    setReplyText("");
  };

  const handleSubmitReply = async () => {
    if (!currentUserId || !currentUserEmail) {
      alert("返信するにはログインしてね");
      return;
    }

    if (!replyingToPost) return;

    if (!replyText.trim()) {
      alert("返信内容を入力してね");
      return;
    }

    if (replyText.length > 140) {
      alert("返信は140文字以内にしてね");
      return;
    }

    setSubmittingReply(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            content: replyText.trim(),
            likes: 0,
            user_id: currentUserId,
            user_email: currentUserEmail,
            image_url: null,
            parent_id: replyingToPost.id,
          },
        ])
        .select()
        .single();

      if (error) {
        alert("返信失敗: " + error.message);
        setSubmittingReply(false);
        return;
      }

      if (data) {
        const newReply = data as Post;

        if (replyingToPost.id === numericPostId) {
          setReplies((prev) => [...prev, newReply]);
        }

        if (replyingToPost.user_id && replyingToPost.user_id !== currentUserId) {
          await createNotification({
            user_id: replyingToPost.user_id,
            actor_user_id: currentUserId,
            type: "reply",
            post_id: replyingToPost.id,
          });
        }
      }

      setReplyingToPost(null);
      setReplyText("");
    } catch (error) {
      console.error(error);
      alert("返信失敗");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async (item: Post) => {
    if (!currentUserId || item.user_id !== currentUserId) {
      alert("自分の投稿だけ削除できるよ");
      return;
    }

    const ok = window.confirm(
      item.parent_id === null ? "この投稿を削除する？" : "この返信を削除する？"
    );
    if (!ok) return;

    setDeletingPostId(item.id);

    try {
      await supabase.from("likes").delete().eq("post_id", item.id);
      await supabase.from("bookmarks").delete().eq("post_id", item.id);
      await supabase.from("notifications").delete().eq("post_id", item.id);

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", item.id)
        .eq("user_id", currentUserId);

      if (error) {
        alert("削除失敗: " + error.message);
        setDeletingPostId(null);
        return;
      }

      if (item.id === numericPostId) {
        router.push("/");
        return;
      }

      setReplies((prev) => prev.filter((reply) => reply.id !== item.id));
      setLikedPostIds((prev) => prev.filter((id) => id !== item.id));
      setBookmarkedPostIds((prev) => prev.filter((id) => id !== item.id));
      setOpenMenuPostId(null);
    } catch (error) {
      console.error(error);
      alert("削除失敗");
    } finally {
      setDeletingPostId(null);
    }
  };

  const menuItemStyle = {
    width: "100%",
    textAlign: "left" as const,
    background: "transparent",
    border: "none",
    padding: "11px 14px",
    color: DEFAULT_TEXT,
    fontSize: "13px",
    fontWeight: "bold" as const,
    cursor: "pointer",
  };

  const actionButtonBase = {
    height: "36px",
    minWidth: "46px",
    border: "none",
    background: "transparent",
    borderRadius: "9999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "0 2px",
    cursor: "pointer",
    flexShrink: 0,
  } as const;

  const renderPostCard = (item: Post, isReply = false) => {
    const profileHref = item.user_id ? `/users/${item.user_id}` : "/profile";
    const avatarUrl = getAvatarUrl(item);
    const isLiked = likedPostIds.includes(item.id);
    const isBookmarked = bookmarkedPostIds.includes(item.id);
    const isOwner = !!currentUserId && item.user_id === currentUserId;
    const isMenuOpen = openMenuPostId === item.id;

    const replyCount = isReply
      ? 0
      : replies.filter((reply) => reply.parent_id === item.id).length;

    return (
      <article
        key={item.id}
        style={{
          display: "flex",
          gap: "14px",
          padding: isReply ? "18px 20px" : "20px",
          borderBottom: `1px solid ${DEFAULT_BORDER}`,
        }}
      >
        {avatarUrl ? (
          <Link href={profileHref} style={{ flexShrink: 0 }}>
            <img
              src={avatarUrl}
              alt="avatar"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "9999px",
                objectFit: "cover",
                flexShrink: 0,
                border: `1px solid ${DEFAULT_BORDER}`,
                display: "block",
              }}
            />
          </Link>
        ) : (
          <Link
            href={profileHref}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "9999px",
              background: DEFAULT_ACCENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              flexShrink: 0,
              color: "#ffffff",
              textDecoration: "none",
            }}
          >
            {getDisplayName(item).slice(0, 1).toUpperCase()}
          </Link>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              alignItems: "flex-start",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap",
                minWidth: 0,
              }}
            >
              <Link
                href={profileHref}
                style={{
                  fontWeight: "bold",
                  color: DEFAULT_TEXT,
                  textDecoration: "none",
                }}
              >
                {getDisplayName(item)}
              </Link>

              <span style={{ color: DEFAULT_MUTED }}>@{getUsername(item)}</span>

              <span style={{ color: DEFAULT_MUTED, fontSize: "14px" }}>
                ・ {formatDate(item.created_at)}
              </span>

              {isReply && (
                <span style={{ color: DEFAULT_ACCENT, fontSize: "13px" }}>
                  返信
                </span>
              )}
            </div>

            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuPostId((prev) =>
                    prev === item.id ? null : item.id
                  );
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MoreIcon size={19} color={DEFAULT_MUTED} />
              </button>

              {isMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "38px",
                    minWidth: "150px",
                    background: DEFAULT_BACKGROUND,
                    border: `1px solid ${DEFAULT_BORDER}`,
                    borderRadius: "14px",
                    overflow: "hidden",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
                    zIndex: 50,
                  }}
                >
                  <button
                    onClick={() => handleToggleBookmark(item)}
                    style={menuItemStyle}
                  >
                    {isBookmarked ? "保存を解除" : "保存"}
                  </button>

                  {isOwner ? (
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingPostId === item.id}
                      style={{
                        ...menuItemStyle,
                        color: "#ff6b6b",
                        cursor:
                          deletingPostId === item.id ? "not-allowed" : "pointer",
                      }}
                    >
                      {deletingPostId === item.id
                        ? "削除中..."
                        : isReply
                        ? "返信を削除"
                        : "削除"}
                    </button>
                  ) : (
                    <Link
                      href={`/report/post/${item.id}`}
                      onClick={() => setOpenMenuPostId(null)}
                      style={{
                        display: "block",
                        ...menuItemStyle,
                        color: "#ff6b6b",
                        textDecoration: "none",
                      }}
                    >
                      通報
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          <p
            style={{
              fontSize: "18px",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
              margin: 0,
              marginBottom: item.image_url ? "12px" : "10px",
              wordBreak: "break-word",
            }}
          >
            {item.content}
          </p>

          {item.image_url && (
            <div
              style={{
                border: `1px solid ${DEFAULT_BORDER}`,
                borderRadius: "16px",
                overflow: "hidden",
                marginBottom: "12px",
              }}
            >
              <img
                src={item.image_url}
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
              alignItems: "center",
              gap: "20px",
              flexWrap: "nowrap",
              overflowX: "auto",
              paddingTop: "2px",
            }}
          >
            <button
              onClick={() => handleOpenReply(item)}
              style={{
                ...actionButtonBase,
                color: DEFAULT_MUTED,
              }}
            >
              <ReplyIcon size={20} color={DEFAULT_MUTED} />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  lineHeight: 1,
                }}
              >
                {replyCount}
              </span>
            </button>

            <button
              onClick={() => handleLike(item)}
              style={{
                ...actionButtonBase,
                color: isLiked ? "#ff5a79" : DEFAULT_MUTED,
              }}
            >
              <HeartIcon
                size={20}
                color={isLiked ? "#ff5a79" : DEFAULT_MUTED}
                filled={isLiked}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  lineHeight: 1,
                }}
              >
                {item.likes}
              </span>
            </button>

            <button
              onClick={() => handleToggleBookmark(item)}
              style={{
                ...actionButtonBase,
                color: isBookmarked ? "#ffd166" : DEFAULT_MUTED,
              }}
            >
              <BookmarkIcon
                size={20}
                color={isBookmarked ? "#ffd166" : DEFAULT_MUTED}
                filled={isBookmarked}
              />
            </button>
          </div>
        </div>
      </article>
    );
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
          maxWidth: "680px",
          margin: "0 auto",
          borderLeft: `1px solid ${DEFAULT_BORDER}`,
          borderRight: `1px solid ${DEFAULT_BORDER}`,
          minHeight: "100vh",
          background: DEFAULT_BACKGROUND,
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            background: "rgba(21,32,43,0.95)",
            backdropFilter: "blur(8px)",
            borderBottom: `1px solid ${DEFAULT_BORDER}`,
            padding: "18px 20px",
            zIndex: 10,
          }}
        >
          <Link
            href="/"
            style={{
              color: DEFAULT_ACCENT,
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            ← ホームに戻る
          </Link>

          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            投稿詳細
          </h1>
        </header>

        {errorMessage && (
          <div
            style={{
              padding: "20px",
              color: "#ffb4b4",
              borderBottom: `1px solid ${DEFAULT_BORDER}`,
            }}
          >
            {errorMessage}
          </div>
        )}

        {loading ? (
          <p style={{ padding: "20px", color: DEFAULT_MUTED }}>読み込み中...</p>
        ) : !post ? null : (
          <>
            <section>{renderPostCard(post)}</section>

            <section>
              <div
                style={{
                  padding: "18px 20px",
                  borderBottom: `1px solid ${DEFAULT_BORDER}`,
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                返信
              </div>

              {replies.length === 0 ? (
                <p style={{ padding: "20px", color: DEFAULT_MUTED }}>
                  まだ返信がありません
                </p>
              ) : (
                replies.map((reply) => renderPostCard(reply, true))
              )}
            </section>
          </>
        )}
      </div>

      {replyingToPost && (
        <div
          onClick={() => setReplyingToPost(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 80,
            display: "flex",
            justifyContent: "center",
            alignItems: "stretch",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(680px, 100vw)",
              minHeight: "100vh",
              background: DEFAULT_BACKGROUND,
              color: DEFAULT_TEXT,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                background: "rgba(21,32,43,0.95)",
                backdropFilter: "blur(12px)",
                borderBottom: `1px solid ${DEFAULT_BORDER}`,
                padding: "14px 16px",
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={() => setReplyingToPost(null)}
                style={{
                  justifySelf: "start",
                  background: "transparent",
                  border: "none",
                  color: DEFAULT_TEXT,
                  fontSize: "13px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                キャンセル
              </button>

              <div
                style={{
                  justifySelf: "center",
                  fontWeight: 800,
                  fontSize: "17px",
                }}
              >
                返信
              </div>

              <button
                type="button"
                onClick={handleSubmitReply}
                disabled={
                  submittingReply ||
                  !replyText.trim() ||
                  replyText.length > 140
                }
                style={{
                  justifySelf: "end",
                  background:
                    submittingReply ||
                    !replyText.trim() ||
                    replyText.length > 140
                      ? "#375a7f"
                      : DEFAULT_ACCENT,
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "9999px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor:
                    submittingReply ||
                    !replyText.trim() ||
                    replyText.length > 140
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {submittingReply ? "送信中..." : "返信"}
              </button>
            </div>

            <div
              style={{
                padding: "18px 20px 130px",
                flex: 1,
              }}
            >
              <div
                style={{
                  marginBottom: "14px",
                  padding: "12px 14px",
                  borderRadius: "14px",
                  border: `1px solid ${DEFAULT_BORDER}`,
                  background: "transparent",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: DEFAULT_ACCENT,
                    marginBottom: "8px",
                    fontWeight: "bold",
                  }}
                >
                  返信先
                </div>

                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "6px",
                    color: DEFAULT_TEXT,
                    fontSize: "15px",
                  }}
                >
                  {getDisplayName(replyingToPost)}
                </div>

                <div
                  style={{
                    color: "#cfd9de",
                    fontSize: "15px",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  {replyingToPost.content}
                </div>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="返信を入力"
                disabled={submittingReply}
                style={{
                  width: "100%",
                  minHeight: "180px",
                  background: "transparent",
                  color: DEFAULT_TEXT,
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: "22px",
                  lineHeight: 1.6,
                  padding: 0,
                }}
              />

              <div
                style={{
                  marginTop: "14px",
                  paddingTop: "14px",
                  borderTop: `1px solid ${DEFAULT_BORDER}`,
                  color: replyText.length > 140 ? "#ff4d4f" : DEFAULT_MUTED,
                  fontSize: "13px",
                  fontWeight: "bold",
                }}
              >
                あと {140 - replyText.length} 文字
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}