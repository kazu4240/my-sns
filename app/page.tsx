"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Post = {
  id: number;
  content: string;
  created_at: string;
  likes: number;
  user_id: string | null;
  user_email: string | null;
};

type Profile = {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const maxLength = 140;
  const remaining = useMemo(() => maxLength - text.length, [text]);

  const fetchPostsAndProfiles = async (currentUserId?: string | null) => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data);

      const idSet = new Set<string>();

      for (const post of data) {
        if (post.user_id) {
          idSet.add(post.user_id);
        }
      }

      if (currentUserId) {
        idSet.add(currentUserId);
      }

      const userIds = Array.from(idSet);

      if (userIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);

        if (!profileError && profileData) {
          const profileMap: Record<string, Profile> = {};

          for (const profile of profileData) {
            profileMap[profile.user_id] = profile;
          }

          setProfiles(profileMap);
        } else {
          setProfiles({});
        }
      } else {
        setProfiles({});
      }
    }

    setLoading(false);
  };

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentEmail = session?.user?.email ?? null;
      const currentId = session?.user?.id ?? null;

      setUserEmail(currentEmail);
      setUserId(currentId);

      await fetchPostsAndProfiles(currentId);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handlePost = async () => {
    if (!userEmail || !userId) {
      alert("投稿するにはログインしてね");
      return;
    }

    if (!text.trim()) return;
    if (text.length > maxLength) return;

    if (editingId !== null) {
      const targetPost = posts.find((post) => post.id === editingId);

      if (!targetPost || targetPost.user_id !== userId) {
        alert("自分の投稿だけ編集できるよ");
        return;
      }

      const { error } = await supabase
        .from("posts")
        .update({ content: text })
        .eq("id", editingId);

      if (!error) {
        setText("");
        setEditingId(null);
        await fetchPostsAndProfiles(userId);
      }

      return;
    }

    const { error } = await supabase.from("posts").insert([
      {
        content: text,
        likes: 0,
        user_id: userId,
        user_email: userEmail,
      },
    ]);

    if (!error) {
      setText("");
      await fetchPostsAndProfiles(userId);
    }
  };

  const handleLike = async (id: number, currentLikes: number) => {
    const { error } = await supabase
      .from("posts")
      .update({ likes: currentLikes + 1 })
      .eq("id", id);

    if (!error) {
      await fetchPostsAndProfiles(userId);
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

    if (!error) {
      if (editingId === post.id) {
        setEditingId(null);
        setText("");
      }
      await fetchPostsAndProfiles(userId);
    }
  };

  const handleEdit = (post: Post) => {
    if (!userId || post.user_id !== userId) {
      alert("自分の投稿だけ編集できるよ");
      return;
    }

    setEditingId(post.id);
    setText(post.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setText("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    setUserId(null);
    setEditingId(null);
    setText("");
    setProfiles({});
    alert("ログアウトしたよ");
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
    return post.user_email ?? "Kazuki";
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              Kazuki SNS
            </span>

            <Link
              href="/profile"
              style={{
                color: "#1d9bf0",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              プロフィール
            </Link>
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
                    color: "#8899a6",
                    wordBreak: "break-all",
                  }}
                >
                  ログイン中: {userEmail}
                </span>

                <button
                  onClick={handleLogout}
                  style={{
                    background: "transparent",
                    color: "#ff6b6b",
                    border: "1px solid #2f3336",
                    padding: "8px 14px",
                    borderRadius: "9999px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                href="/login"
                style={{
                  color: "#1d9bf0",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                ログインはこちら
              </Link>
            )}
          </div>
        </header>

        <section
          style={{
            padding: "20px",
            borderBottom: "1px solid #2f3336",
          }}
        >
          {!userEmail && (
            <p
              style={{
                marginTop: 0,
                marginBottom: "16px",
                color: "#ffd166",
                fontSize: "14px",
              }}
            >
              投稿するにはログインしてね
            </p>
          )}

          <div style={{ display: "flex", gap: "14px" }}>
            {myAvatarUrl ? (
              <img
                src={myAvatarUrl}
                alt="my avatar"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "9999px",
                  objectFit: "cover",
                  flexShrink: 0,
                  border: "1px solid #2f3336",
                }}
              />
            ) : (
              <Link
                href="/profile"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "9999px",
                  background: "#1d9bf0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  flexShrink: 0,
                  color: "white",
                  textDecoration: "none",
                }}
              >
                K
              </Link>
            )}

            <div style={{ flex: 1 }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={userEmail ? "いま何してる？" : "ログインすると投稿できる"}
                disabled={!userEmail}
                style={{
                  width: "100%",
                  minHeight: "110px",
                  background: "transparent",
                  color: "white",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: "22px",
                  opacity: userEmail ? 1 : 0.5,
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid #2f3336",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: remaining < 0 ? "#ff4d4f" : "#8899a6",
                  }}
                >
                  {editingId !== null ? "編集中" : `あと ${remaining} 文字`}
                </span>

                <div style={{ display: "flex", gap: "10px" }}>
                  {editingId !== null && (
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        background: "transparent",
                        color: "#8899a6",
                        border: "1px solid #2f3336",
                        padding: "10px 18px",
                        borderRadius: "9999px",
                        fontSize: "15px",
                        cursor: "pointer",
                      }}
                    >
                      キャンセル
                    </button>
                  )}

                  <button
                    onClick={handlePost}
                    disabled={!userEmail || !text.trim() || remaining < 0}
                    style={{
                      background:
                        !userEmail || !text.trim() || remaining < 0
                          ? "#375a7f"
                          : "#1d9bf0",
                      color: "white",
                      border: "none",
                      padding: "10px 18px",
                      borderRadius: "9999px",
                      fontSize: "15px",
                      fontWeight: "bold",
                      cursor:
                        !userEmail || !text.trim() || remaining < 0
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {editingId !== null ? "更新" : "投稿"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          {loading ? (
            <p style={{ padding: "20px", color: "#8899a6" }}>読み込み中...</p>
          ) : (
            posts.map((post) => {
              const isOwner = !!userId && post.user_id === userId;

              return (
                <article
                  key={post.id}
                  style={{
                    display: "flex",
                    gap: "14px",
                    padding: "18px 20px",
                    borderBottom: "1px solid #2f3336",
                  }}
                >
                  {getAvatarUrl(post) ? (
                    <img
                      src={getAvatarUrl(post)!}
                      alt="avatar"
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "9999px",
                        objectFit: "cover",
                        flexShrink: 0,
                        border: "1px solid #2f3336",
                      }}
                    />
                  ) : (
                    <Link
                      href="/profile"
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "9999px",
                        background: "#1d9bf0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        flexShrink: 0,
                        color: "white",
                        textDecoration: "none",
                      }}
                    >
                      K
                    </Link>
                  )}

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <Link
                        href="/profile"
                        style={{
                          fontWeight: "bold",
                          color: "white",
                          textDecoration: "none",
                        }}
                      >
                        {getDisplayName(post)}
                      </Link>

                      <span style={{ color: "#8899a6" }}>
                        @{getUsername(post)}
                      </span>

                      <span style={{ color: "#8899a6", fontSize: "14px" }}>
                        ・ {formatDate(post.created_at)}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: "18px",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        margin: 0,
                        marginBottom: "14px",
                      }}
                    >
                      {post.content}
                    </p>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleLike(post.id, post.likes)}
                        style={{
                          background: "transparent",
                          color: "#8899a6",
                          border: "1px solid #2f3336",
                          padding: "8px 14px",
                          borderRadius: "9999px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        ❤️ いいね {post.likes}
                      </button>

                      {isOwner && (
                        <>
                          <button
                            onClick={() => handleEdit(post)}
                            style={{
                              background: "transparent",
                              color: "#ffd166",
                              border: "1px solid #2f3336",
                              padding: "8px 14px",
                              borderRadius: "9999px",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            ✏️ 編集
                          </button>

                          <button
                            onClick={() => handleDelete(post)}
                            style={{
                              background: "transparent",
                              color: "#ff6b6b",
                              border: "1px solid #2f3336",
                              padding: "8px 14px",
                              borderRadius: "9999px",
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                          >
                            🗑 削除
                          </button>
                        </>
                      )}
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