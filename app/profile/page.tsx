"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Post = {
  id: number;
  content: string;
  created_at: string;
  likes: number;
  user_id: string | null;
  user_email: string | null;
};

type Profile = {
  id?: number;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const loadPage = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserEmail(user?.email ?? null);
    setUserId(user?.id ?? null);

    if (!user?.id) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileData) {
      const profile = profileData as Profile;
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    } else {
      setDisplayName(user.email?.split("@")[0] ?? "");
      setBio("");
      setAvatarUrl("");
    }

    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!postsError && postsData) {
      setPosts(postsData);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadPage();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!userId) {
      alert("ログインしてね");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop() || "png";
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        alert("画像アップロード失敗: " + uploadError.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      await loadPage();
      router.refresh();
      alert("画像アップロードできた！");
    } catch (error) {
      console.error(error);
      alert("画像アップロード失敗");
    }

    setUploading(false);
  };

  const handleSaveProfile = async () => {
    if (!userId) {
      alert("ログインしてね");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("profiles").upsert([
      {
        user_id: userId,
        display_name: displayName,
        bio: bio,
        avatar_url: avatarUrl,
      },
    ]);

    setSaving(false);

    if (error) {
      alert("保存失敗: " + error.message);
    } else {
      await loadPage();
      router.refresh();
      alert("プロフィール保存できた！");
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

  const shownName = displayName || userEmail?.split("@")[0] || "未ログイン";
  const shownId = userEmail?.split("@")[0] || "guest";

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

          <h1
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            Profile
          </h1>
        </header>

        <section
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid #2f3336",
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "9999px",
                objectFit: "cover",
                marginBottom: "16px",
                border: "2px solid #2f3336",
              }}
            />
          ) : (
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "9999px",
                background: "#1d9bf0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: "bold",
                marginBottom: "16px",
              }}
            >
              {shownName.charAt(0).toUpperCase()}
            </div>
          )}

          <h2
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: "bold",
              wordBreak: "break-all",
            }}
          >
            {shownName}
          </h2>

          <p
            style={{
              marginTop: "6px",
              marginBottom: "14px",
              color: "#8899a6",
              fontSize: "16px",
            }}
          >
            @{shownId}
          </p>

          <p
            style={{
              margin: 0,
              fontSize: "16px",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {bio || "自己紹介をまだ設定していません。"}
          </p>
        </section>

        <section
          style={{
            padding: "20px",
            borderBottom: "1px solid #2f3336",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "20px",
            }}
          >
            プロフィール編集
          </h3>

          {!userId ? (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "16px",
                padding: "18px",
                color: "#8899a6",
              }}
            >
              ログインするとプロフィール編集ができる
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="表示名"
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #2f3336",
                  background: "#192734",
                  color: "white",
                  fontSize: "16px",
                }}
              />

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="自己紹介"
                style={{
                  minHeight: "110px",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #2f3336",
                  background: "#192734",
                  color: "white",
                  fontSize: "16px",
                  resize: "vertical",
                }}
              />

              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="アイコン画像URL"
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #2f3336",
                  background: "#192734",
                  color: "white",
                  fontSize: "16px",
                }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #2f3336",
                  background: "#192734",
                }}
              >
                <label style={{ fontSize: "14px", color: "#8899a6" }}>
                  画像ファイルからアップロード
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  style={{
                    color: "white",
                    fontSize: "14px",
                  }}
                />

                <span
                  style={{
                    fontSize: "13px",
                    color: "#8899a6",
                  }}
                >
                  {uploading ? "アップロード中..." : "画像を選ぶとアップロードされる"}
                </span>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving || uploading}
                style={{
                  alignSelf: "flex-start",
                  background: saving || uploading ? "#375a7f" : "#1d9bf0",
                  color: "white",
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "9999px",
                  fontWeight: "bold",
                  cursor: saving || uploading ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "保存中..." : uploading ? "アップロード中..." : "保存"}
              </button>
            </div>
          )}
        </section>

        <section
          style={{
            padding: "20px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "20px",
            }}
          >
            自分の投稿
          </h3>

          {loading ? (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "16px",
                padding: "18px",
                color: "#8899a6",
              }}
            >
              読み込み中...
            </div>
          ) : !userId ? (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "16px",
                padding: "18px",
                color: "#8899a6",
              }}
            >
              ログインすると自分の投稿が表示される
            </div>
          ) : posts.length === 0 ? (
            <div
              style={{
                border: "1px solid #2f3336",
                borderRadius: "16px",
                padding: "18px",
                color: "#8899a6",
              }}
            >
              まだ自分の投稿がない
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {posts.map((post) => (
                <article
                  key={post.id}
                  style={{
                    border: "1px solid #2f3336",
                    borderRadius: "16px",
                    padding: "18px",
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
                    <span style={{ fontWeight: "bold" }}>
                      {displayName || post.user_email || "Kazuki"}
                    </span>
                    <span style={{ color: "#8899a6" }}>@{shownId}</span>
                    <span style={{ color: "#8899a6", fontSize: "14px" }}>
                      ・ {formatDate(post.created_at)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      marginBottom: "12px",
                      fontSize: "17px",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {post.content}
                  </p>

                  <div
                    style={{
                      color: "#8899a6",
                      fontSize: "14px",
                    }}
                  >
                    ❤️ いいね {post.likes}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}