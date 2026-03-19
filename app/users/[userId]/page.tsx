"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  header_image_url: string | null;
  theme_background_color: string | null;
  theme_card_color: string | null;
  theme_text_color: string | null;
  theme_accent_color: string | null;
  ui_scale: string | null;
};

type PageTab = "posts" | "videos" | "media";

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_CARD = "#192734";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";

function ReplyIcon({
  size,
  color,
}: {
  size: number;
  color: string;
}) {
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

function MoreIcon({
  size,
  color,
}: {
  size: number;
  color: string;
}) {
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

function isVideoUrl(url: string | null) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes(".mp4") ||
    lower.includes(".webm") ||
    lower.includes(".mov") ||
    lower.includes(".m4v")
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const userIdParam = Array.isArray(params.userId) ? params.userId[0] : params.userId;

  const [loading, setLoading] = useState(true);
  const [pageTab, setPageTab] = useState<PageTab>("posts");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<number[]>([]);
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);

  const theme = useMemo(() => {
    const textColor = targetProfile?.theme_text_color || DEFAULT_TEXT;
    return {
      background: targetProfile?.theme_background_color || DEFAULT_BACKGROUND,
      card: targetProfile?.theme_card_color || DEFAULT_CARD,
      text: textColor,
      accent: targetProfile?.theme_accent_color || DEFAULT_ACCENT,
      border: DEFAULT_BORDER,
      muted: textColor === "#000000" ? "#555555" : "#8899a6",
      softText: textColor === "#000000" ? "#444444" : "#cfd9de",
    };
  }, [targetProfile]);

  const uiScale = useMemo(() => {
    const value = targetProfile?.ui_scale || "normal";

    if (value === "compact") {
      return {
        headerTitle: 24,
        avatar: 46,
        heroAvatar: 84,
        postText: 15,
        replyText: 14,
        metaText: 12,
        actionText: 12,
        icon: 18,
        menuIcon: 18,
        actionHeight: 34,
        actionMinWidth: 42,
        actionGap: 18,
      };
    }

    if (value === "large") {
      return {
        headerTitle: 30,
        avatar: 56,
        heroAvatar: 104,
        postText: 18,
        replyText: 16,
        metaText: 14,
        actionText: 14,
        icon: 22,
        menuIcon: 20,
        actionHeight: 40,
        actionMinWidth: 52,
        actionGap: 22,
      };
    }

    return {
      headerTitle: 27,
      avatar: 50,
      heroAvatar: 92,
      postText: 17,
      replyText: 15,
      metaText: 13,
      actionText: 13,
      icon: 20,
      menuIcon: 19,
      actionHeight: 36,
      actionMinWidth: 46,
      actionGap: 20,
    };
  }, [targetProfile]);

  const rootPosts = useMemo(() => {
    return posts.filter((post) => post.parent_id === null);
  }, [posts]);

  const repliesByParent = useMemo(() => {
    const map: Record<number, Post[]> = {};

    for (const post of posts) {
      if (post.parent_id !== null) {
        if (!map[post.parent_id]) map[post.parent_id] = [];
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

  const filteredPosts = useMemo(() => {
    if (pageTab === "posts") {
      return rootPosts;
    }

    if (pageTab === "videos") {
      return rootPosts.filter((post) => isVideoUrl(post.image_url));
    }

    return rootPosts.filter(
      (post) => !!post.image_url && !isVideoUrl(post.image_url)
    );
  }, [pageTab, rootPosts]);

  const actionButtonBase = {
    height: `${uiScale.actionHeight}px`,
    minWidth: `${uiScale.actionMinWidth}px`,
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

  const menuItemStyle = {
    width: "100%",
    textAlign: "left" as const,
    background: "transparent",
    border: "none",
    padding: "11px 14px",
    color: theme.text,
    fontSize: uiScale.actionText,
    fontWeight: "bold" as const,
    cursor: "pointer",
  };

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const id = user?.id ?? null;
    setCurrentUserId(id);
    return id;
  };

  const fetchFollowingIds = async (viewerId: string | null) => {
    if (!viewerId) {
      setFollowingUserIds([]);
      return [];
    }

    const { data, error } = await supabase
      .from("follows")
      .select("following_user_id")
      .eq("follower_user_id", viewerId);

    if (error) {
      console.error(error);
      setFollowingUserIds([]);
      return [];
    }

    const ids = (data ?? [])
      .map((item) => item.following_user_id)
      .filter((value): value is string => !!value);

    setFollowingUserIds(ids);
    return ids;
  };

  const fetchLikes = async (viewerId: string | null) => {
    if (!viewerId) {
      setLikedPostIds([]);
      return;
    }

    const { data, error } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", viewerId);

    if (error) {
      console.error(error);
      setLikedPostIds([]);
      return;
    }

    const ids = (data ?? [])
      .map((item) => item.post_id)
      .filter((value): value is number => typeof value === "number");

    setLikedPostIds(ids);
  };

  const fetchBookmarks = async (viewerId: string | null) => {
    if (!viewerId) {
      setBookmarkedPostIds([]);
      return;
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", viewerId);

    if (error) {
      console.error(error);
      setBookmarkedPostIds([]);
      return;
    }

    const ids = (data ?? [])
      .map((item) => item.post_id)
      .filter((value): value is number => typeof value === "number");

    setBookmarkedPostIds(ids);
  };

  const fetchFollowCounts = async (targetUserId: string) => {
    const [{ count: following }, { count: followers }] = await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_user_id", targetUserId),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_user_id", targetUserId),
    ]);

    setFollowingCount(following ?? 0);
    setFollowersCount(followers ?? 0);
  };

  const fetchPage = async () => {
    if (!userIdParam) return;

    setLoading(true);

    const viewerId = await fetchCurrentUser();
    await fetchFollowingIds(viewerId);
    await fetchLikes(viewerId);
    await fetchBookmarks(viewerId);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        "user_id, display_name, username, bio, avatar_url, header_image_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
      )
      .eq("user_id", userIdParam)
      .maybeSingle();

    if (profileError) {
      console.error(profileError);
      setLoading(false);
      return;
    }

    const target = (profileData as Profile | null) ?? null;
    setTargetProfile(target);

    if (target?.user_id) {
      await fetchFollowCounts(target.user_id);
    }

    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userIdParam)
      .order("created_at", { ascending: false });

    if (postError) {
      console.error(postError);
      setPosts([]);
      setLoading(false);
      return;
    }

    const loadedPosts = (postData ?? []) as Post[];
    setPosts(loadedPosts);

    const idSet = new Set<string>();
    for (const post of loadedPosts) {
      if (post.user_id) idSet.add(post.user_id);
    }
    if (target?.user_id) idSet.add(target.user_id);

    const ids = Array.from(idSet);
    if (ids.length > 0) {
      const { data: profileList, error: profileListError } = await supabase
        .from("profiles")
        .select(
          "user_id, display_name, username, bio, avatar_url, header_image_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
        )
        .in("user_id", ids);

      if (!profileListError) {
        const map: Record<string, Profile> = {};
        for (const item of profileList ?? []) {
          map[item.user_id] = item;
        }
        setProfiles(map);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPage();
  }, [userIdParam]);

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
  }: {
    user_id: string;
    actor_user_id: string;
    type: "like" | "reply" | "follow";
    post_id: number | null;
  }) => {
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

  const handleLike = async (post: Post) => {
    if (!currentUserId) {
      alert("ログインしてね");
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
      alert("ログインしてね");
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

  const handleFollowToggle = async () => {
    if (!currentUserId || !targetProfile) {
      alert("ログインしてね");
      return;
    }

    if (currentUserId === targetProfile.user_id) return;

    setFollowLoading(true);

    try {
      const isFollowing = followingUserIds.includes(targetProfile.user_id);

      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_user_id", currentUserId)
          .eq("following_user_id", targetProfile.user_id);

        if (error) {
          alert("フォロー解除失敗: " + error.message);
          setFollowLoading(false);
          return;
        }

        setFollowingUserIds((prev) =>
          prev.filter((id) => id !== targetProfile.user_id)
        );
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_user_id: currentUserId,
          following_user_id: targetProfile.user_id,
        });

        if (error) {
          alert("フォロー失敗: " + error.message);
          setFollowLoading(false);
          return;
        }

        setFollowingUserIds((prev) => [...prev, targetProfile.user_id]);
        setFollowersCount((prev) => prev + 1);

        await createNotification({
          user_id: targetProfile.user_id,
          actor_user_id: currentUserId,
          type: "follow",
          post_id: null,
        });
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleDelete = async (post: Post) => {
    if (!currentUserId || post.user_id !== currentUserId) {
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
    setBookmarkedPostIds((prev) => prev.filter((id) => id !== post.id));
    setLikedPostIds((prev) => prev.filter((id) => id !== post.id));
    setOpenMenuPostId(null);
  };

  const handleReply = (post: Post) => {
    window.location.href = `/?replyTo=${post.id}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
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

  const tabStyle = (tab: PageTab) => ({
    flex: 1,
    background: "transparent",
    color: pageTab === tab ? theme.text : theme.muted,
    border: "none",
    borderBottom:
      pageTab === tab ? `3px solid ${theme.accent}` : "3px solid transparent",
    padding: "14px 12px 11px",
    cursor: "pointer",
    fontSize: `${uiScale.actionText}px`,
    fontWeight: "bold" as const,
  });

  const renderPostCard = (post: Post, isReply = false) => {
    const isOwner = !!currentUserId && post.user_id === currentUserId;
    const replies = repliesByParent[post.id] ?? [];
    const profileHref = post.user_id ? `/users/${post.user_id}` : "/profile";
    const isBookmarked = bookmarkedPostIds.includes(post.id);
    const isLiked = likedPostIds.includes(post.id);
    const isMenuOpen = openMenuPostId === post.id;

    return (
      <article
        key={post.id}
        style={{
          display: "flex",
          gap: "12px",
          padding: isReply ? "12px 0 0 0" : "14px 20px",
          borderBottom: isReply ? "none" : `1px solid ${theme.border}`,
        }}
      >
        {!isReply &&
          (getAvatarUrl(post) ? (
            <Link href={profileHref} style={{ flexShrink: 0 }}>
              <img
                src={getAvatarUrl(post)!}
                alt="avatar"
                style={{
                  width: uiScale.avatar,
                  height: uiScale.avatar,
                  borderRadius: "9999px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </Link>
          ) : (
            <Link
              href={profileHref}
              style={{
                width: uiScale.avatar,
                height: uiScale.avatar,
                borderRadius: "9999px",
                background: theme.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                flexShrink: 0,
                color: "#ffffff",
                textDecoration: "none",
                fontSize: uiScale.postText,
              }}
            >
              {getDisplayName(post).slice(0, 1).toUpperCase()}
            </Link>
          ))}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              alignItems: "flex-start",
              marginBottom: "6px",
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
                  color: theme.text,
                  textDecoration: "none",
                  fontSize: isReply ? uiScale.replyText : uiScale.postText - 1,
                }}
              >
                {getDisplayName(post)}
              </Link>

              <span
                style={{
                  color: theme.muted,
                  fontSize: uiScale.metaText,
                }}
              >
                @{getUsername(post)}
              </span>

              <span
                style={{
                  color: theme.muted,
                  fontSize: uiScale.metaText,
                }}
              >
                ・ {formatDate(post.created_at)}
              </span>
            </div>

            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={(e) => {
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
                <MoreIcon size={uiScale.menuIcon} color={theme.muted} />
              </button>

              {isMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "38px",
                    minWidth: "140px",
                    background: theme.background,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "14px",
                    overflow: "hidden",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
                    zIndex: 50,
                  }}
                >
                  {isOwner ? (
                    <button
                      onClick={() => handleDelete(post)}
                      style={{
                        ...menuItemStyle,
                        color: "#ff6b6b",
                      }}
                    >
                      削除
                    </button>
                  ) : (
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

          <p
            style={{
              fontSize: isReply ? uiScale.replyText : uiScale.postText,
              lineHeight: 1.75,
              whiteSpace: "pre-wrap",
              margin: 0,
              marginBottom: post.image_url ? "12px" : "10px",
              color: theme.text,
              wordBreak: "break-word",
            }}
          >
            {post.content}
          </p>

          {post.image_url && (
            <div
              style={{
                marginBottom: "12px",
                border: `1px solid ${theme.border}`,
                borderRadius: "16px",
                overflow: "hidden",
                background: theme.background,
              }}
            >
              {isVideoUrl(post.image_url) ? (
                <video
                  src={post.image_url}
                  controls
                  style={{
                    width: "100%",
                    maxHeight: "420px",
                    display: "block",
                    background: "#000000",
                  }}
                />
              ) : (
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
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: `${uiScale.actionGap}px`,
              flexWrap: "nowrap",
              overflowX: "auto",
              paddingTop: "2px",
            }}
          >
            <button
              onClick={() => handleReply(post)}
              style={{
                ...actionButtonBase,
                color: theme.muted,
              }}
            >
              <ReplyIcon size={uiScale.icon} color={theme.muted} />
              <span
                style={{
                  fontSize: uiScale.actionText,
                  fontWeight: "bold",
                  lineHeight: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                {replies.length}
              </span>
            </button>

            <button
              onClick={() => handleLike(post)}
              style={{
                ...actionButtonBase,
                color: isLiked ? "#ff5a79" : theme.muted,
              }}
            >
              <HeartIcon
                size={uiScale.icon}
                color={isLiked ? "#ff5a79" : theme.muted}
                filled={isLiked}
              />
              <span
                style={{
                  fontSize: uiScale.actionText,
                  fontWeight: "bold",
                  lineHeight: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                {post.likes}
              </span>
            </button>

            <button
              onClick={() => handleToggleBookmark(post)}
              style={{
                ...actionButtonBase,
                color: isBookmarked ? "#ffd166" : theme.muted,
              }}
            >
              <BookmarkIcon
                size={uiScale.icon}
                color={isBookmarked ? "#ffd166" : theme.muted}
                filled={isBookmarked}
              />
            </button>
          </div>

          {!isReply && replies.length > 0 && (
            <div
              style={{
                marginTop: "10px",
                marginLeft: "6px",
                paddingLeft: "12px",
                borderLeft: `2px solid ${theme.border}`,
              }}
            >
              {replies.map((reply) => renderPostCard(reply, true))}
            </div>
          )}
        </div>
      </article>
    );
  };

  const isOwnProfile = currentUserId && targetProfile?.user_id === currentUserId;
  const isFollowing =
    !!targetProfile && followingUserIds.includes(targetProfile.user_id);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: DEFAULT_BACKGROUND,
          color: DEFAULT_TEXT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        読み込み中...
      </main>
    );
  }

  if (!targetProfile) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: DEFAULT_BACKGROUND,
          color: DEFAULT_TEXT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        ユーザーが見つかりません
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: theme.background,
        color: theme.text,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          borderLeft: `1px solid ${theme.border}`,
          borderRight: `1px solid ${theme.border}`,
          minHeight: "100vh",
          background: theme.background,
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: `${theme.background}dd`,
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${theme.border}`,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Link
            href="/"
            style={{
              color: theme.accent,
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            ← 戻る
          </Link>

          <div>
            <div
              style={{
                fontSize: `${uiScale.headerTitle}px`,
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {targetProfile.display_name || targetProfile.username || "ユーザー"}
            </div>
            <div
              style={{
                color: theme.muted,
                fontSize: `${uiScale.metaText}px`,
              }}
            >
              @{targetProfile.username || "user"}
            </div>
          </div>
        </header>

        <section
          style={{
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              height: "180px",
              background: targetProfile.header_image_url
                ? `center / cover no-repeat url(${targetProfile.header_image_url})`
                : theme.card === theme.background
                ? "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
                : theme.card,
              borderBottom: `1px solid ${theme.border}`,
            }}
          />

          <div style={{ padding: "0 20px 16px" }}>
            <div
              style={{
                marginTop: "-46px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: uiScale.heroAvatar,
                  height: uiScale.heroAvatar,
                  borderRadius: "9999px",
                  overflow: "hidden",
                  border: `4px solid ${theme.background}`,
                  background: theme.card,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "28px",
                  flexShrink: 0,
                }}
              >
                {targetProfile.avatar_url ? (
                  <img
                    src={targetProfile.avatar_url}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  (targetProfile.display_name || "U").slice(0, 1).toUpperCase()
                )}
              </div>

              {!isOwnProfile && (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  style={{
                    background: isFollowing ? "transparent" : theme.accent,
                    color: "#ffffff",
                    border: isFollowing ? `1px solid ${theme.border}` : "none",
                    padding: "10px 18px",
                    borderRadius: "9999px",
                    fontWeight: "bold",
                    fontSize: `${uiScale.actionText}px`,
                    cursor: followLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {followLoading ? "処理中..." : isFollowing ? "フォロー中" : "フォロー"}
                </button>
              )}

              {isOwnProfile && (
                <Link
                  href="/profile"
                  style={{
                    background: theme.accent,
                    color: "#ffffff",
                    textDecoration: "none",
                    padding: "10px 18px",
                    borderRadius: "9999px",
                    fontWeight: "bold",
                    fontSize: `${uiScale.actionText}px`,
                  }}
                >
                  編集
                </Link>
              )}
            </div>

            <div style={{ marginTop: "14px" }}>
              <div
                style={{
                  fontSize: `${uiScale.headerTitle}px`,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  marginBottom: "4px",
                }}
              >
                {targetProfile.display_name || "ユーザー"}
              </div>

              <div
                style={{
                  color: theme.muted,
                  fontSize: `${uiScale.replyText}px`,
                  marginBottom: "12px",
                }}
              >
                @{targetProfile.username || "user"}
              </div>

              <div
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.7,
                  fontSize: `${uiScale.postText}px`,
                  marginBottom: "12px",
                }}
              >
                {targetProfile.bio || "自己紹介はまだありません"}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "18px",
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginBottom: "4px",
                }}
              >
                <Link
                  href={`/users/${targetProfile.user_id}/following`}
                  style={{
                    textDecoration: "none",
                    color: theme.text,
                    fontSize: `${uiScale.replyText}px`,
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{followingCount}</span>
                  <span style={{ color: theme.muted }}> フォロー中</span>
                </Link>

                <Link
                  href={`/users/${targetProfile.user_id}/followers`}
                  style={{
                    textDecoration: "none",
                    color: theme.text,
                    fontSize: `${uiScale.replyText}px`,
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{followersCount}</span>
                  <span style={{ color: theme.muted }}> フォロワー</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "flex",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <button onClick={() => setPageTab("posts")} style={tabStyle("posts")}>
            投稿
          </button>
          <button onClick={() => setPageTab("videos")} style={tabStyle("videos")}>
            動画
          </button>
          <button onClick={() => setPageTab("media")} style={tabStyle("media")}>
            画像
          </button>
        </section>

        <section>
          {filteredPosts.length === 0 ? (
            <div
              style={{
                padding: "28px 20px",
                color: theme.muted,
                fontSize: `${uiScale.replyText}px`,
              }}
            >
              {pageTab === "posts" && "まだ投稿がない"}
              {pageTab === "videos" && "まだ動画がない"}
              {pageTab === "media" && "まだ画像がない"}
            </div>
          ) : (
            filteredPosts.map((post) => renderPostCard(post))
          )}
        </section>
      </div>
    </main>
  );
}
