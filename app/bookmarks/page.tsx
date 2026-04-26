"use client";

import Link from "next/link";
import {
  FormEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../../lib/supabase";

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

type BookmarkRow = {
  post_id: number;
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

export default function BookmarksPage() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<number[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [replyingToPost, setReplyingToPost] = useState<Post | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

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
          postText: 15,
          meta: 12,
          icon: 18,
          actionText: 12,
          menuIcon: 18,
        }
      : uiScale === "large"
      ? {
          avatar: 56,
          postText: 18,
          meta: 14,
          icon: 22,
          actionText: 14,
          menuIcon: 20,
        }
      : {
          avatar: 48,
          postText: 17,
          meta: 13,
          icon: 20,
          actionText: 13,
          menuIcon: 19,
        };

  const repliesByParent = useMemo(() => {
    const map: Record<number, Post[]> = {};

    for (const reply of replies) {
      if (reply.parent_id !== null) {
        if (!map[reply.parent_id]) {
          map[reply.parent_id] = [];
        }
        map[reply.parent_id].push(reply);
      }
    }

    return map;
  }, [replies]);

  const menuItemStyle = {
    width: "100%",
    textAlign: "left" as const,
    background: "transparent",
    border: "none",
    padding: "11px 14px",
    color: currentTheme.text,
    fontSize: sizes.actionText,
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

  const loadBookmarks = async () => {
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
        setCurrentUserEmail(null);
        setPosts([]);
        setReplies([]);
        setProfiles({});
        setBookmarkedPostIds([]);
        setLikedPostIds([]);
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);
      setCurrentUserEmail(user.email ?? null);

      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", user.id);

      if (bookmarkError) {
        throw new Error(bookmarkError.message);
      }

      const bookmarkIds = ((bookmarkData ?? []) as BookmarkRow[])
        .map((item) => item.post_id)
        .filter((value): value is number => typeof value === "number");

      setBookmarkedPostIds(bookmarkIds);

      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (likesError) {
        console.error(likesError);
        setLikedPostIds([]);
      } else {
        const likeIds = (likesData ?? [])
          .map((item) => item.post_id)
          .filter((value): value is number => typeof value === "number");
        setLikedPostIds(likeIds);
      }

      if (bookmarkIds.length === 0) {
        const { data: myProfile } = await supabase
          .from("profiles")
          .select(
            "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (myProfile) {
          setProfiles({
            [user.id]: myProfile as Profile,
          });
        } else {
          setProfiles({});
        }

        setPosts([]);
        setReplies([]);
        setLoading(false);
        return;
      }

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .in("id", bookmarkIds)
        .order("created_at", { ascending: false });

      if (postError) {
        throw new Error(postError.message);
      }

      const postsData = (postData ?? []) as Post[];
      setPosts(postsData);

      const postIds = postsData.map((post) => post.id);

      if (postIds.length > 0) {
        const { data: replyData, error: replyError } = await supabase
          .from("posts")
          .select("*")
          .in("parent_id", postIds)
          .order("created_at", { ascending: true });

        if (replyError) {
          console.error(replyError);
          setReplies([]);
        } else {
          setReplies((replyData ?? []) as Post[]);
        }
      } else {
        setReplies([]);
      }

      const userIds = Array.from(
        new Set(
          [
            user.id,
            ...postsData.map((post) => post.user_id).filter(Boolean),
            ...replies.map((reply) => reply.user_id).filter(Boolean),
          ] as string[]
        )
      );

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
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
    } catch (error) {
      console.error(error);
      setErrorMessage("ブックマークの読み込みに失敗しました。");
      setPosts([]);
      setReplies([]);
      setProfiles({});
      setBookmarkedPostIds([]);
      setLikedPostIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  useEffect(() => {
    const handleWindowClick = () => {
      setOpenMenuPostId(null);
    };

    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

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
    if (post.user_id && profiles[post.user_id]?.username) {
      return profiles[post.user_id].username!;
    }
    return "ユーザー";
  };

  const getUsername = (post: Post) => {
    if (post.user_id && profiles[post.user_id]?.username) {
      return profiles[post.user_id].username!;
    }
    return "user";
  };

  const getAvatarUrl = (post: Post) => {
    if (post.user_id && profiles[post.user_id]?.avatar_url) {
      return profiles[post.user_id].avatar_url!;
    }
    return null;
  };

  const handleLike = async (post: Post) => {
    if (!currentUserId) {
      alert("いいねするにはログインしてね");
      return;
    }

    const alreadyLiked = likedPostIds.includes(post.id);

    if (alreadyLiked) {
      const { error: likeDeleteError } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", currentUserId)
        .eq("post_id", post.id);

      if (likeDeleteError) {
        alert("いいね解除失敗: " + likeDeleteError.message);
        return;
      }

      const nextLikes = Math.max(0, post.likes - 1);
      const { error: postUpdateError } = await supabase
        .from("posts")
        .update({ likes: nextLikes })
        .eq("id", post.id);

      if (postUpdateError) {
        alert("投稿更新失敗: " + postUpdateError.message);
        return;
      }

      setLikedPostIds((prev) => prev.filter((id) => id !== post.id));
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id ? { ...item, likes: nextLikes } : item
        )
      );
      return;
    }

    const { error: likeInsertError } = await supabase.from("likes").insert({
      user_id: currentUserId,
      post_id: post.id,
    });

    if (likeInsertError) {
      alert("いいね失敗: " + likeInsertError.message);
      return;
    }

    const nextLikes = post.likes + 1;
    const { error: postUpdateError } = await supabase
      .from("posts")
      .update({ likes: nextLikes })
      .eq("id", post.id);

    if (postUpdateError) {
      alert("投稿更新失敗: " + postUpdateError.message);
      return;
    }

    setLikedPostIds((prev) => [...prev, post.id]);
    setPosts((prev) =>
      prev.map((item) =>
        item.id === post.id ? { ...item, likes: nextLikes } : item
      )
    );

    if (post.user_id) {
      await createNotification({
        user_id: post.user_id,
        actor_user_id: currentUserId,
        type: "like",
        post_id: post.id,
      });
    }
  };

  const handleToggleBookmark = async (post: Post) => {
    if (!currentUserId) {
      alert("ブックマークするにはログインしてね");
      return;
    }

    const isBookmarked = bookmarkedPostIds.includes(post.id);

    if (isBookmarked) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", currentUserId)
        .eq("post_id", post.id);

      if (error) {
        alert("ブックマーク解除失敗: " + error.message);
        return;
      }

      setBookmarkedPostIds((prev) => prev.filter((id) => id !== post.id));
      setPosts((prev) => prev.filter((item) => item.id !== post.id));
      return;
    }

    const { error } = await supabase.from("bookmarks").insert({
      user_id: currentUserId,
      post_id: post.id,
    });

    if (error) {
      alert("ブックマーク失敗: " + error.message);
      return;
    }

    setBookmarkedPostIds((prev) => [...prev, post.id]);
  };

  const handleOpenReply = (post: Post) => {
    if (!currentUserId) {
      alert("返信するにはログインしてね");
      return;
    }

    setReplyingToPost(post);
    setReplyText("");
  };

  const handleSubmitReply = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
        setReplies((prev) => [...prev, newReply]);

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

  const renderPostCard = (post: Post) => {
    const profileHref = post.user_id ? `/users/${post.user_id}` : "/profile";
    const avatarUrl = getAvatarUrl(post);
    const isBookmarked = bookmarkedPostIds.includes(post.id);
    const isLiked = likedPostIds.includes(post.id);
    const repliesCount = repliesByParent[post.id]?.length ?? 0;
    const isMenuOpen = openMenuPostId === post.id;
    const isOwner = !!currentUserId && post.user_id === currentUserId;

    return (
      <article
        key={post.id}
        style={{
          display: "flex",
          gap: "12px",
          padding: "18px 20px",
          borderBottom: `1px solid ${currentTheme.border}`,
        }}
      >
        {avatarUrl ? (
          <Link href={profileHref} style={{ flexShrink: 0 }}>
            <img
              src={avatarUrl}
              alt="avatar"
              style={{
                width: sizes.avatar,
                height: sizes.avatar,
                borderRadius: "9999px",
                objectFit: "cover",
                border: `1px solid ${currentTheme.border}`,
                display: "block",
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
              fontWeight: "bold",
              color: "#ffffff",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            {getDisplayName(post).slice(0, 1).toUpperCase()}
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
                  color: currentTheme.text,
                  fontWeight: "bold",
                  textDecoration: "none",
                }}
              >
                {getDisplayName(post)}
              </Link>

              <span style={{ color: currentTheme.muted, fontSize: sizes.meta }}>
                @{getUsername(post)}
              </span>

              <span style={{ color: currentTheme.muted, fontSize: sizes.meta }}>
                ・ {formatDate(post.created_at)}
              </span>
            </div>

            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  setOpenMenuPostId((prev) => (prev === post.id ? null : post.id));
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
                <MoreIcon size={sizes.menuIcon} color={currentTheme.muted} />
              </button>

              {isMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "38px",
                    minWidth: "150px",
                    background: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: "14px",
                    overflow: "hidden",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
                    zIndex: 50,
                  }}
                >
                  <button
                    onClick={() => handleToggleBookmark(post)}
                    style={menuItemStyle}
                  >
                    {isBookmarked ? "保存を解除" : "保存"}
                  </button>

                  {!isOwner && (
                    <Link
                      href={`/report/post/${post.id}`}
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

          <Link
            href={`/posts/${post.id}`}
            style={{
              display: "block",
              color: currentTheme.text,
              textDecoration: "none",
            }}
          >
            <p
              style={{
                margin: 0,
                marginBottom: post.image_url ? "12px" : "0",
                color: currentTheme.text,
                lineHeight: 1.6,
                fontSize: sizes.postText,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {post.content}
            </p>

            {post.image_url && (
              <div
                style={{
                  marginTop: "12px",
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: "16px",
                  overflow: "hidden",
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
          </Link>

          <div
            style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flexWrap: "nowrap",
              overflowX: "auto",
            }}
          >
            <button
              onClick={() => handleOpenReply(post)}
              style={{
                ...actionButtonBase,
                color: currentTheme.muted,
              }}
            >
              <ReplyIcon size={sizes.icon} color={currentTheme.muted} />
              <span
                style={{
                  fontSize: sizes.actionText,
                  fontWeight: "bold",
                  lineHeight: 1,
                }}
              >
                {repliesCount}
              </span>
            </button>

            <button
              onClick={() => handleLike(post)}
              style={{
                ...actionButtonBase,
                color: isLiked ? "#ff5a79" : currentTheme.muted,
              }}
            >
              <HeartIcon
                size={sizes.icon}
                color={isLiked ? "#ff5a79" : currentTheme.muted}
                filled={isLiked}
              />
              <span
                style={{
                  fontSize: sizes.actionText,
                  fontWeight: "bold",
                  lineHeight: 1,
                }}
              >
                {post.likes}
              </span>
            </button>

            <button
              onClick={() => handleToggleBookmark(post)}
              style={{
                ...actionButtonBase,
                color: isBookmarked ? "#ffd166" : currentTheme.muted,
              }}
            >
              <BookmarkIcon
                size={sizes.icon}
                color={isBookmarked ? "#ffd166" : currentTheme.muted}
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
            ブックマーク
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
            <div
              style={{
                padding: "24px 20px",
                color: currentTheme.muted,
                lineHeight: 1.7,
              }}
            >
              <p style={{ marginTop: 0 }}>ブックマークを見るにはログインしてね。</p>
              <Link
                href="/login"
                style={{
                  color: currentTheme.accent,
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                ログインはこちら
              </Link>
            </div>
          ) : posts.length === 0 ? (
            <p style={{ padding: "20px", color: currentTheme.muted }}>
              まだブックマークがない
            </p>
          ) : (
            posts.map((post) => renderPostCard(post))
          )}
        </section>
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
          <form
            onSubmit={handleSubmitReply}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(680px, 100vw)",
              minHeight: "100vh",
              background: currentTheme.background,
              color: currentTheme.text,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
                background: `${currentTheme.background}f2`,
                backdropFilter: "blur(12px)",
                borderBottom: `1px solid ${currentTheme.border}`,
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
                  color: currentTheme.text,
                  fontSize: sizes.actionText,
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
                  fontSize: sizes.postText,
                }}
              >
                返信
              </div>

              <button
                type="submit"
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
                      : currentTheme.accent,
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "9999px",
                  fontSize: sizes.actionText,
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
                  border: `1px solid ${currentTheme.border}`,
                  background: "transparent",
                }}
              >
                <div
                  style={{
                    fontSize: sizes.meta,
                    color: currentTheme.accent,
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
                    color: currentTheme.text,
                    fontSize: sizes.actionText,
                  }}
                >
                  {getDisplayName(replyingToPost)}
                </div>

                <div
                  style={{
                    color: currentTheme.softText,
                    fontSize: sizes.actionText,
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
                  color: currentTheme.text,
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: sizes.postText + 4,
                  lineHeight: 1.6,
                  padding: 0,
                }}
              />

              <div
                style={{
                  marginTop: "14px",
                  paddingTop: "14px",
                  borderTop: `1px solid ${currentTheme.border}`,
                  color: replyText.length > 140 ? "#ff4d4f" : currentTheme.muted,
                  fontSize: sizes.meta,
                  fontWeight: "bold",
                }}
              >
                あと {140 - replyText.length} 文字
              </div>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}