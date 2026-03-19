"use client";

import Link from "next/link";
import {
  ChangeEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
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

type HomeTab = "all" | "following" | "popular";

type FeedItem =
  | { type: "post"; post: Post }
  | { type: "recommendation"; users: Profile[]; key: string };

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

function SettingsIcon({ size, color }: { size: number; color: string }) {
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
        d="M12 8.8A3.2 3.2 0 1 0 12 15.2A3.2 3.2 0 1 0 12 8.8Z"
        stroke={color}
        strokeWidth="1.8"
      />
      <path
        d="M19.4 13.5C19.47 13.01 19.5 12.51 19.5 12C19.5 11.49 19.47 10.99 19.4 10.5L21.2 9.1L19.4 5.9L17.2 6.5C16.45 5.86 15.58 5.36 14.62 5.05L14.3 2.8H10.7L10.38 5.05C9.42 5.36 8.55 5.86 7.8 6.5L5.6 5.9L3.8 9.1L5.6 10.5C5.53 10.99 5.5 11.49 5.5 12C5.5 12.51 5.53 13.01 5.6 13.5L3.8 14.9L5.6 18.1L7.8 17.5C8.55 18.14 9.42 18.64 10.38 18.95L10.7 21.2H14.3L14.62 18.95C15.58 18.64 16.45 18.14 17.2 17.5L19.4 18.1L21.2 14.9L19.4 13.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<number[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<Profile[]>([]);
  const [recommendedFollowLoadingUserId, setRecommendedFollowLoadingUserId] =
    useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<HomeTab>("all");
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);
  const [openSettingsMenu, setOpenSettingsMenu] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);

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

  const uiScale = useMemo(() => {
    const value =
      userId && profiles[userId]?.ui_scale ? profiles[userId].ui_scale : "normal";

    if (value === "compact") {
      return {
        headerTitle: 22,
        avatar: 40,
        composerAvatar: 44,
        recommendedAvatar: 42,
        postText: 15,
        replyText: 14,
        metaText: 12,
        actionText: 12,
        textarea: 18,
        tabText: 13,
        headerLink: 13,
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
        composerAvatar: 60,
        recommendedAvatar: 56,
        postText: 18,
        replyText: 16,
        metaText: 14,
        actionText: 14,
        textarea: 24,
        tabText: 15,
        headerLink: 15,
        icon: 22,
        menuIcon: 20,
        actionHeight: 40,
        actionMinWidth: 52,
        actionGap: 22,
      };
    }

    return {
      headerTitle: 26,
      avatar: 48,
      composerAvatar: 52,
      recommendedAvatar: 48,
      postText: 17,
      replyText: 15,
      metaText: 13,
      actionText: 13,
      textarea: 22,
      tabText: 14,
      headerLink: 14,
      icon: 20,
      menuIcon: 19,
      actionHeight: 36,
      actionMinWidth: 46,
      actionGap: 20,
    };
  }, [profiles, userId]);

  const rootPosts = useMemo(() => {
    return posts.filter((post) => post.parent_id === null);
  }, [posts]);

  const displayedPosts = useMemo(() => {
    if (activeTab === "all") {
      return rootPosts;
    }

    if (activeTab === "following") {
      if (!userId) return [];
      return rootPosts.filter(
        (post) => !!post.user_id && followingUserIds.includes(post.user_id)
      );
    }

    return [...rootPosts].sort((a, b) => {
      if (b.likes !== a.likes) {
        return b.likes - a.likes;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [activeTab, rootPosts, followingUserIds, userId]);

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

  const recommendedChunks = useMemo(() => {
    const chunkSize = 3;
    const chunks: Profile[][] = [];

    for (let i = 0; i < recommendedUsers.length; i += chunkSize) {
      chunks.push(recommendedUsers.slice(i, i + chunkSize));
    }

    return chunks;
  }, [recommendedUsers]);

  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];
    const interval = 10;

    displayedPosts.forEach((post, index) => {
      items.push({ type: "post", post });

      const shouldInsertRecommendation =
        recommendedChunks.length > 0 &&
        (index + 1) % interval === 0 &&
        Math.floor((index + 1) / interval) - 1 < recommendedChunks.length;

      if (shouldInsertRecommendation) {
        const chunkIndex = Math.floor((index + 1) / interval) - 1;
        items.push({
          type: "recommendation",
          users: recommendedChunks[chunkIndex],
          key: `recommendation-${chunkIndex}`,
        });
      }
    });

    if (
      displayedPosts.length > 0 &&
      displayedPosts.length < interval &&
      recommendedChunks.length > 0
    ) {
      items.push({
        type: "recommendation",
        users: recommendedChunks[0],
        key: "recommendation-tail",
      });
    }

    return items;
  }, [displayedPosts, recommendedChunks]);

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

  const fetchFollowingIds = async (currentUserId?: string | null) => {
    if (!currentUserId) {
      setFollowingUserIds([]);
      return [];
    }

    const { data, error } = await supabase
      .from("follows")
      .select("following_user_id")
      .eq("follower_user_id", currentUserId);

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

  const fetchBookmarks = async (currentUserId?: string | null) => {
    if (!currentUserId) {
      setBookmarkedPostIds([]);
      return;
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", currentUserId);

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

  const fetchLikes = async (currentUserId?: string | null) => {
    if (!currentUserId) {
      setLikedPostIds([]);
      return;
    }

    const { data, error } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", currentUserId);

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

  const fetchRecommendedUsers = async (
    currentUserId?: string | null,
    excludedUserIds: string[] = []
  ) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "user_id, display_name, username, bio, avatar_url, theme_background_color, theme_card_color, theme_text_color, theme_accent_color, ui_scale"
        )
        .limit(20);

      if (error) {
        console.error(error);
        setRecommendedUsers([]);
        return;
      }

      const excludedSet = new Set<string>(excludedUserIds);
      if (currentUserId) {
        excludedSet.add(currentUserId);
      }

      const filtered = ((data ?? []) as Profile[])
        .filter((profile) => !excludedSet.has(profile.user_id))
        .sort((a, b) => {
          const aScore =
            (a.avatar_url ? 1 : 0) +
            (a.display_name ? 1 : 0) +
            (a.bio ? 1 : 0) +
            (a.username ? 1 : 0);

          const bScore =
            (b.avatar_url ? 1 : 0) +
            (b.display_name ? 1 : 0) +
            (b.bio ? 1 : 0) +
            (b.username ? 1 : 0);

          return bScore - aScore;
        })
        .slice(0, 9);

      setRecommendedUsers(filtered);
    } catch (error) {
      console.error(error);
      setRecommendedUsers([]);
    }
  };

  const fetchPostsAndProfiles = async (currentUserId?: string | null) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const followingIds = await fetchFollowingIds(currentUserId);
      await fetchLikes(currentUserId);

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(80);

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
        await fetchBookmarks(currentUserId);
        await fetchRecommendedUsers(currentUserId, followingIds);
        return;
      }

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

      await fetchBookmarks(currentUserId);
      await fetchRecommendedUsers(currentUserId, followingIds);
    } catch (error) {
      console.error(error);
      setPosts([]);
      setProfiles({});
      setFollowingUserIds([]);
      setBookmarkedPostIds([]);
      setLikedPostIds([]);
      setRecommendedUsers([]);
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

  useEffect(() => {
    if (activeTab === "following" && !userId) {
      setActiveTab("all");
    }
  }, [activeTab, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const replyTo = params.get("replyTo");
    if (!replyTo) return;

    const replyId = Number(replyTo);
    if (!Number.isFinite(replyId)) return;

    const targetPost = posts.find((post) => post.id === replyId);
    if (!targetPost) return;

    setEditingId(null);
    setReplyingToId(replyId);
    setText("");
    setSelectedImage(null);
    setPreviewUrl("");
    setIsComposerOpen(true);

    params.delete("replyTo");
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, [posts]);

  useEffect(() => {
    const handleWindowClick = () => {
      setOpenMenuPostId(null);
      setOpenSettingsMenu(false);
    };

    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (isComposerOpen) return;
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastY;

        if (currentY <= 12) {
          setHeaderHidden(false);
          window.dispatchEvent(
            new CustomEvent("bottom-nav-visibility", {
              detail: { hidden: false },
            })
          );
        } else if (diff > 8) {
          setHeaderHidden(true);
          window.dispatchEvent(
            new CustomEvent("bottom-nav-visibility", {
              detail: { hidden: true },
            })
          );
        } else if (diff < -8) {
          setHeaderHidden(false);
          window.dispatchEvent(
            new CustomEvent("bottom-nav-visibility", {
              detail: { hidden: false },
            })
          );
        }

        lastY = currentY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isComposerOpen]);

  useEffect(() => {
    if (!isComposerOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isComposerOpen]);

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

  const closeComposer = () => {
    resetComposer();
    setIsComposerOpen(false);

    window.dispatchEvent(
      new CustomEvent("bottom-nav-visibility", {
        detail: { hidden: false },
      })
    );

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("replyTo");
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, "", nextUrl);
    }
  };

  const handleOpenComposer = () => {
    if (!userEmail || !userId) {
      alert("投稿するにはログインしてね");
      return;
    }

    resetComposer();
    setIsComposerOpen(true);
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

        closeComposer();
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

      closeComposer();
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

    const alreadyLiked = likedPostIds.includes(post.id);

    if (alreadyLiked) {
      const { error: likeDeleteError } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
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
      user_id: userId,
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
        actor_user_id: userId,
        type: "like",
        post_id: post.id,
      });
    }
  };

  const handleToggleBookmark = async (post: Post) => {
    if (!userId) {
      alert("ブックマークするにはログインしてね");
      return;
    }

    const isBookmarked = bookmarkedPostIds.includes(post.id);

    if (isBookmarked) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", post.id);

      if (error) {
        alert("ブックマーク解除失敗: " + error.message);
        return;
      }

      setBookmarkedPostIds((prev) => prev.filter((id) => id !== post.id));
      return;
    }

    const { error } = await supabase.from("bookmarks").insert({
      user_id: userId,
      post_id: post.id,
    });

    if (error) {
      alert("ブックマーク失敗: " + error.message);
      return;
    }

    setBookmarkedPostIds((prev) => [...prev, post.id]);
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
    setBookmarkedPostIds((prev) => prev.filter((id) => id !== post.id));
    setLikedPostIds((prev) => prev.filter((id) => id !== post.id));
    setOpenMenuPostId(null);

    if (editingId === post.id || replyingToId === post.id) {
      closeComposer();
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
    setOpenMenuPostId(null);
    setIsComposerOpen(true);
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
    setIsComposerOpen(true);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("ログアウト失敗: " + error.message);
      return;
    }

    setUserEmail(null);
    setUserId(null);
    setFollowingUserIds([]);
    setBookmarkedPostIds([]);
    setLikedPostIds([]);
    setRecommendedUsers([]);
    setActiveTab("all");
    setOpenMenuPostId(null);
    setOpenSettingsMenu(false);
    closeComposer();
    setProfiles({});
    await fetchPostsAndProfiles(null);
    alert("ログアウトしたよ");
  };

  const handleRefresh = async () => {
    const { currentId } = await checkUser();
    await fetchPostsAndProfiles(currentId);
    setOpenSettingsMenu(false);
  };

  const handleRecommendedFollow = async (
    e: ReactMouseEvent<HTMLButtonElement>,
    targetUserId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      alert("フォローするにはログインしてね");
      return;
    }

    if (userId === targetUserId) {
      return;
    }

    setRecommendedFollowLoadingUserId(targetUserId);

    try {
      const isFollowing = followingUserIds.includes(targetUserId);

      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_user_id", userId)
          .eq("following_user_id", targetUserId);

        if (error) {
          alert("フォロー解除失敗: " + error.message);
          setRecommendedFollowLoadingUserId(null);
          return;
        }

        setFollowingUserIds((prev) => prev.filter((id) => id !== targetUserId));
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_user_id: userId,
          following_user_id: targetUserId,
        });

        if (error) {
          alert("フォロー失敗: " + error.message);
          setRecommendedFollowLoadingUserId(null);
          return;
        }

        await createNotification({
          user_id: targetUserId,
          actor_user_id: userId,
          type: "follow",
          post_id: null,
        });

        setFollowingUserIds((prev) => [...prev, targetUserId]);
      }
    } catch (error) {
      console.error(error);
      alert("フォロー処理失敗");
    } finally {
      setRecommendedFollowLoadingUserId(null);
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

  const myAvatarUrl =
    userId && profiles[userId]?.avatar_url ? profiles[userId].avatar_url : null;

  const replyTargetPost =
    replyingToId !== null
      ? posts.find((post) => post.id === replyingToId) ?? null
      : null;

  const menuItemStyle = {
    width: "100%",
    textAlign: "left" as const,
    background: "transparent",
    border: "none",
    padding: "11px 14px",
    color: currentTheme.text,
    fontSize: uiScale.actionText,
    fontWeight: "bold" as const,
    cursor: "pointer",
  };

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

  const renderRecommendedSection = (users: Profile[], key: string) => {
    if (users.length === 0) return null;

    return (
      <section
        key={key}
        style={{
          borderBottom: `1px solid ${currentTheme.border}`,
        }}
      >
        <div
          style={{
            padding: "18px 20px 12px",
            fontSize: uiScale.postText,
            fontWeight: "bold",
          }}
        >
          おすすめユーザー
        </div>

        {users.map((profile) => {
          const shownName = profile.display_name || profile.username || "ユーザー";
          const shownBio = profile.bio || "自己紹介はまだありません";
          const shownUsername = profile.username || "user";
          const isFollowingRecommended = followingUserIds.includes(profile.user_id);
          const isLoadingFollow = recommendedFollowLoadingUserId === profile.user_id;

          return (
            <div
              key={profile.user_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 20px",
                borderTop: `1px solid ${currentTheme.border}`,
              }}
            >
              <Link
                href={`/users/${profile.user_id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  minWidth: 0,
                  flex: 1,
                  textDecoration: "none",
                  color: currentTheme.text,
                }}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    style={{
                      width: uiScale.recommendedAvatar,
                      height: uiScale.recommendedAvatar,
                      borderRadius: "9999px",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: uiScale.recommendedAvatar,
                      height: uiScale.recommendedAvatar,
                      borderRadius: "9999px",
                      background: currentTheme.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontWeight: "bold",
                      flexShrink: 0,
                      fontSize: uiScale.replyText,
                    }}
                  >
                    {shownName.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: uiScale.replyText,
                      marginBottom: "4px",
                      wordBreak: "break-word",
                    }}
                  >
                    {shownName}
                  </div>

                  <div
                    style={{
                      color: currentTheme.muted,
                      fontSize: uiScale.metaText,
                      marginBottom: "4px",
                      wordBreak: "break-word",
                    }}
                  >
                    @{shownUsername}
                  </div>

                  <div
                    style={{
                      color: currentTheme.muted,
                      fontSize: uiScale.metaText,
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                    }}
                  >
                    {shownBio}
                  </div>
                </div>
              </Link>

              <button
                onClick={(e) => handleRecommendedFollow(e, profile.user_id)}
                disabled={isLoadingFollow}
                style={{
                  background: isFollowingRecommended
                    ? "transparent"
                    : currentTheme.accent,
                  color: "#ffffff",
                  padding: "9px 14px",
                  borderRadius: "9999px",
                  fontSize: uiScale.actionText,
                  fontWeight: "bold",
                  flexShrink: 0,
                  border: isFollowingRecommended
                    ? `1px solid ${currentTheme.border}`
                    : "none",
                  cursor: isLoadingFollow ? "not-allowed" : "pointer",
                }}
              >
                {isLoadingFollow
                  ? "処理中..."
                  : isFollowingRecommended
                  ? "フォロー中"
                  : "フォロー"}
              </button>
            </div>
          );
        })}
      </section>
    );
  };

  const renderPostCard = (post: Post, isReply = false) => {
    const isOwner = !!userId && post.user_id === userId;
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
          borderBottom: isReply ? "none" : `1px solid ${currentTheme.border}`,
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
                background: currentTheme.accent,
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
                  color: currentTheme.text,
                  textDecoration: "none",
                  fontSize: isReply ? uiScale.replyText : uiScale.postText - 1,
                }}
              >
                {getDisplayName(post)}
              </Link>

              <span
                style={{
                  color: currentTheme.muted,
                  fontSize: uiScale.metaText,
                }}
              >
                @{getUsername(post)}
              </span>

              <span
                style={{
                  color: currentTheme.muted,
                  fontSize: uiScale.metaText,
                }}
              >
                ・ {formatDate(post.created_at)}
              </span>

              {isReply && (
                <span
                  style={{
                    color: currentTheme.accent,
                    fontSize: uiScale.metaText,
                    fontWeight: "bold",
                  }}
                >
                  返信
                </span>
              )}
            </div>

            {!isReply && (
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
                  <MoreIcon size={uiScale.menuIcon} color={currentTheme.muted} />
                </button>

                {isMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "38px",
                      minWidth: "140px",
                      background: currentTheme.background,
                      border: `1px solid ${currentTheme.border}`,
                      borderRadius: "14px",
                      overflow: "hidden",
                      boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
                      zIndex: 50,
                    }}
                  >
                    {isOwner ? (
                      <>
                        <button onClick={() => handleEdit(post)} style={menuItemStyle}>
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          style={{
                            ...menuItemStyle,
                            color: "#ff6b6b",
                          }}
                        >
                          削除
                        </button>
                      </>
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
            )}
          </div>

          <p
            style={{
              fontSize: isReply ? uiScale.replyText : uiScale.postText,
              lineHeight: 1.75,
              whiteSpace: "pre-wrap",
              margin: 0,
              marginBottom: post.image_url ? "12px" : "10px",
              color: currentTheme.text,
              wordBreak: "break-word",
            }}
          >
            {post.content}
          </p>

          {post.image_url && (
            <div
              style={{
                marginBottom: "12px",
                border: `1px solid ${currentTheme.border}`,
                borderRadius: "16px",
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
                color: currentTheme.muted,
              }}
            >
              <ReplyIcon size={uiScale.icon} color={currentTheme.muted} />
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
                color: isLiked ? "#ff5a79" : currentTheme.muted,
              }}
            >
              <HeartIcon
                size={uiScale.icon}
                color={isLiked ? "#ff5a79" : currentTheme.muted}
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
                color: isBookmarked ? "#ffd166" : currentTheme.muted,
              }}
            >
              <BookmarkIcon
                size={uiScale.icon}
                color={isBookmarked ? "#ffd166" : currentTheme.muted}
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

  const tabButtonStyle = (tab: HomeTab) => ({
    flex: 1,
    background: "transparent",
    color: activeTab === tab ? currentTheme.text : currentTheme.muted,
    border: "none",
    borderBottom:
      activeTab === tab
        ? `3px solid ${currentTheme.accent}`
        : "3px solid transparent",
    padding: "12px 14px 10px",
    cursor: "pointer",
    fontSize: uiScale.tabText,
    fontWeight: "bold" as const,
  });

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
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            background: `${currentTheme.background}ee`,
            backdropFilter: "blur(14px)",
            borderBottom: `1px solid ${currentTheme.border}`,
            zIndex: 20,
            transform: `translateY(${headerHidden ? "-100%" : "0"})`,
            transition: "transform 0.22s ease",
          }}
        >
          <div
            style={{
              padding: "14px 20px 10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: uiScale.headerTitle,
                fontWeight: 800,
                color: currentTheme.text,
                letterSpacing: "-0.02em",
              }}
            >
              Ulein
            </div>

            <div style={{ position: "relative" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenSettingsMenu((prev) => !prev);
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
                <SettingsIcon size={22} color={currentTheme.accent} />
              </button>

              {openSettingsMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "40px",
                    minWidth: "180px",
                    background: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    borderRadius: "14px",
                    overflow: "hidden",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
                    zIndex: 60,
                  }}
                >
                  <button onClick={handleRefresh} style={menuItemStyle}>
                    再読み込み
                  </button>

                  <Link
                    href="/bookmarks"
                    onClick={() => setOpenSettingsMenu(false)}
                    style={{
                      display: "block",
                      ...menuItemStyle,
                      textDecoration: "none",
                    }}
                  >
                    ブックマーク
                  </Link>

                  <Link
                    href="/contact"
                    onClick={() => setOpenSettingsMenu(false)}
                    style={{
                      display: "block",
                      ...menuItemStyle,
                      textDecoration: "none",
                    }}
                  >
                    お問い合わせ
                  </Link>

                  <button
                    onClick={handleLogout}
                    style={{
                      ...menuItemStyle,
                      color: "#ff6b6b",
                    }}
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              padding: "0 20px 10px",
            }}
          >
            {userEmail ? (
              <span
                style={{
                  fontSize: uiScale.metaText,
                  color: currentTheme.muted,
                  wordBreak: "break-all",
                }}
              >
                ログイン中: {userEmail}
              </span>
            ) : (
              <Link
                href="/login"
                style={{
                  color: currentTheme.accent,
                  textDecoration: "none",
                  fontSize: uiScale.headerLink,
                  fontWeight: "bold",
                }}
              >
                ログインはこちら
              </Link>
            )}
          </div>

          <div
            style={{
              display: "flex",
              borderTop: `1px solid ${currentTheme.border}`,
            }}
          >
            <button onClick={() => setActiveTab("all")} style={tabButtonStyle("all")}>
              すべて
            </button>
            <button
              onClick={() => setActiveTab("following")}
              style={tabButtonStyle("following")}
            >
              フォロー中
            </button>
            <button
              onClick={() => setActiveTab("popular")}
              style={tabButtonStyle("popular")}
            >
              人気
            </button>
          </div>
        </header>

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
          ) : displayedPosts.length === 0 ? (
            <p style={{ padding: "24px 20px", color: currentTheme.muted }}>
              {activeTab === "following" ? "フォロー中の投稿がまだない" : "まだ投稿がない"}
            </p>
          ) : (
            feedItems.map((item) => {
              if (item.type === "post") {
                return renderPostCard(item.post);
              }
              return renderRecommendedSection(item.users, item.key);
            })
          )}
        </section>
      </div>

      {userEmail && (
        <button
          onClick={handleOpenComposer}
          style={{
            position: "fixed",
            right: "12px",
            bottom: "88px",
            width: "58px",
            height: "58px",
            borderRadius: "9999px",
            border: "none",
            background: currentTheme.accent,
            color: "#ffffff",
            fontSize: "34px",
            lineHeight: 1,
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
            zIndex: 45,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.22s ease, opacity 0.22s ease",
            transform: `translateY(${headerHidden ? "10px" : "0"})`,
            opacity: headerHidden ? 0.92 : 1,
          }}
          aria-label="投稿を作成"
        >
          ＋
        </button>
      )}

      {isComposerOpen && (
        <div
          onClick={closeComposer}
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
              width: "min(720px, 100vw)",
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
                onClick={closeComposer}
                style={{
                  justifySelf: "start",
                  background: "transparent",
                  border: "none",
                  color: currentTheme.text,
                  fontSize: uiScale.actionText,
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
                  fontSize: uiScale.postText,
                }}
              >
                {editingId !== null ? "編集" : replyingToId !== null ? "返信" : "投稿"}
              </div>

              <button
                onClick={handlePost}
                disabled={
                  !userEmail ||
                  (!text.trim() && !selectedImage) ||
                  remaining < 0 ||
                  submitting
                }
                style={{
                  justifySelf: "end",
                  background:
                    !userEmail ||
                    (!text.trim() && !selectedImage) ||
                    remaining < 0 ||
                    submitting
                      ? "#375a7f"
                      : currentTheme.accent,
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "9999px",
                  fontSize: uiScale.actionText,
                  fontWeight: 800,
                  cursor:
                    !userEmail ||
                    (!text.trim() && !selectedImage) ||
                    remaining < 0 ||
                    submitting
                      ? "not-allowed"
                      : "pointer",
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

            <div
              style={{
                padding: "18px 20px 130px",
                flex: 1,
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
                    fontSize: uiScale.actionText,
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
                    padding: "12px 14px",
                    borderRadius: "14px",
                    border: `1px solid ${currentTheme.border}`,
                    background: "transparent",
                  }}
                >
                  <div
                    style={{
                      fontSize: uiScale.metaText,
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
                      fontSize: uiScale.replyText,
                    }}
                  >
                    {getDisplayName(replyTargetPost)}
                  </div>

                  <div
                    style={{
                      color: currentTheme.softText,
                      fontSize: uiScale.replyText,
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
                      width: uiScale.composerAvatar,
                      height: uiScale.composerAvatar,
                      borderRadius: "9999px",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Link
                    href="/profile"
                    style={{
                      width: uiScale.composerAvatar,
                      height: uiScale.composerAvatar,
                      borderRadius: "9999px",
                      background: currentTheme.accent,
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
                    K
                  </Link>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
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
                      minHeight: "160px",
                      background: "transparent",
                      color: currentTheme.text,
                      border: "none",
                      outline: "none",
                      resize: "none",
                      fontSize: uiScale.textarea,
                      lineHeight: 1.6,
                      opacity: userEmail ? 1 : 0.5,
                      padding: 0,
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
                          fontSize: uiScale.actionText,
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
                              padding: "8px 12px",
                              borderRadius: "9999px",
                              cursor: "pointer",
                              fontSize: uiScale.actionText,
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
                        fontSize: uiScale.metaText,
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
