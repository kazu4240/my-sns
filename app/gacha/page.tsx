"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type AvatarFrame = {
  frame_key: string;
  name: string;
  rarity: string;
  border_css: string;
  glow_css: string | null;
  sort_order: number;
};

type UserAvatarFrame = {
  frame_key: string;
};

type Profile = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  selected_avatar_frame_key: string | null;
};

type GachaPrize = {
  frame_key: string;
  weight: number;
};

const DEFAULT_BACKGROUND = "#15202b";
const DEFAULT_CARD = "#192734";
const DEFAULT_TEXT = "#ffffff";
const DEFAULT_MUTED = "#8899a6";
const DEFAULT_ACCENT = "#1d9bf0";
const DEFAULT_BORDER = "#2f3336";

const GACHA_TABLE: GachaPrize[] = [
  { frame_key: "blue_ring", weight: 55 },
  { frame_key: "pink_ring", weight: 25 },
  { frame_key: "gold_ring", weight: 13 },
  { frame_key: "fire_ring", weight: 5 },
  { frame_key: "rainbow_ring", weight: 2 },
];

const rarityColor: Record<string, string> = {
  N: "#8899a6",
  R: "#ff5a9e",
  SR: "#ffd166",
  SSR: "#ff6b35",
  UR: "#c084fc",
};

export default function GachaPage() {
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [frames, setFrames] = useState<AvatarFrame[]>([]);
  const [ownedFrameKeys, setOwnedFrameKeys] = useState<string[]>([]);
  const [resultFrame, setResultFrame] = useState<AvatarFrame | null>(null);
  const [equippingFrameKey, setEquippingFrameKey] = useState<string | null>(null);

  const ownedFrames = useMemo(() => {
    return frames.filter((frame) => ownedFrameKeys.includes(frame.frame_key));
  }, [frames, ownedFrameKeys]);

  const selectedFrame = useMemo(() => {
    if (!profile?.selected_avatar_frame_key) return null;

    return (
      frames.find(
        (frame) => frame.frame_key === profile.selected_avatar_frame_key
      ) ?? null
    );
  }, [frames, profile]);

  const pickFrameKey = () => {
    const totalWeight = GACHA_TABLE.reduce((sum, prize) => sum + prize.weight, 0);
    const random = Math.random() * totalWeight;

    let current = 0;

    for (const prize of GACHA_TABLE) {
      current += prize.weight;

      if (random <= current) {
        return prize.frame_key;
      }
    }

    return GACHA_TABLE[0].frame_key;
  };

  const loadGachaPage = async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        setUserId(null);
        setProfile(null);
        setFrames([]);
        setOwnedFrameKeys([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(
          "user_id, display_name, username, avatar_url, selected_avatar_frame_key"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      setProfile((profileData ?? null) as Profile | null);

      const { data: frameData, error: frameError } = await supabase
        .from("avatar_frames")
        .select("*")
        .order("sort_order", { ascending: true });

      if (frameError) {
        throw new Error(frameError.message);
      }

      setFrames((frameData ?? []) as AvatarFrame[]);

      const { data: ownedData, error: ownedError } = await supabase
        .from("user_avatar_frames")
        .select("frame_key")
        .eq("user_id", user.id);

      if (ownedError) {
        throw new Error(ownedError.message);
      }

      const ownedKeys = ((ownedData ?? []) as UserAvatarFrame[]).map(
        (item) => item.frame_key
      );

      setOwnedFrameKeys(ownedKeys);
    } catch (error) {
      console.error(error);
      setMessage("ガチャページの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGachaPage();
  }, []);

  const handleDrawGacha = async () => {
    if (!userId) {
      alert("ガチャを引くにはログインしてね");
      return;
    }

    if (frames.length === 0) {
      alert("ガチャ景品がまだありません");
      return;
    }

    setSpinning(true);
    setMessage("");
    setResultFrame(null);

    try {
      const pickedKey = pickFrameKey();
      const pickedFrame = frames.find((frame) => frame.frame_key === pickedKey);

      if (!pickedFrame) {
        setMessage("景品の取得に失敗しました。");
        setSpinning(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 700));

      const alreadyOwned = ownedFrameKeys.includes(pickedKey);

      if (!alreadyOwned) {
        const { error: ownedInsertError } = await supabase
          .from("user_avatar_frames")
          .insert({
            user_id: userId,
            frame_key: pickedKey,
          });

        if (ownedInsertError && !ownedInsertError.message.includes("duplicate")) {
          setMessage("フレーム保存に失敗しました: " + ownedInsertError.message);
          setSpinning(false);
          return;
        }

        setOwnedFrameKeys((prev) => [...prev, pickedKey]);
      }

      const { error: logError } = await supabase.from("gacha_logs").insert({
        user_id: userId,
        frame_key: pickedKey,
      });

      if (logError) {
        console.error(logError);
      }

      setResultFrame(pickedFrame);

      if (alreadyOwned) {
        setMessage(`${pickedFrame.name} が当たったよ。すでに持っているフレームです。`);
      } else {
        setMessage(`${pickedFrame.name} を獲得しました！`);
      }
    } catch (error) {
      console.error(error);
      setMessage("ガチャに失敗しました。");
    } finally {
      setSpinning(false);
    }
  };

  const handleEquipFrame = async (frameKey: string | null) => {
    if (!userId) {
      alert("ログインしてね");
      return;
    }

    setEquippingFrameKey(frameKey ?? "none");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          selected_avatar_frame_key: frameKey,
        })
        .eq("user_id", userId);

      if (error) {
        alert("装備変更に失敗しました: " + error.message);
        setEquippingFrameKey(null);
        return;
      }

      setProfile((prev) =>
        prev ? { ...prev, selected_avatar_frame_key: frameKey } : prev
      );
    } catch (error) {
      console.error(error);
      alert("装備変更に失敗しました");
    } finally {
      setEquippingFrameKey(null);
    }
  };

  const displayName =
    profile?.display_name || profile?.username || "Uleinユーザー";

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
          maxWidth: "760px",
          margin: "0 auto",
          minHeight: "100vh",
          borderLeft: `1px solid ${DEFAULT_BORDER}`,
          borderRight: `1px solid ${DEFAULT_BORDER}`,
          background: DEFAULT_BACKGROUND,
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "rgba(21,32,43,0.95)",
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${DEFAULT_BORDER}`,
            padding: "18px 20px",
          }}
        >
          <Link
            href="/"
            style={{
              color: DEFAULT_ACCENT,
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "bold",
              display: "inline-block",
              marginBottom: "10px",
            }}
          >
            ← ホームに戻る
          </Link>

          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            ガチャ
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: DEFAULT_MUTED,
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            無料でアイコンフレームを入手できます。
          </p>
        </header>

        {loading ? (
          <p style={{ padding: "22px 20px", color: DEFAULT_MUTED }}>
            読み込み中...
          </p>
        ) : !userId ? (
          <section
            style={{
              margin: "22px 20px",
              border: `1px solid ${DEFAULT_BORDER}`,
              borderRadius: "24px",
              background: DEFAULT_CARD,
              padding: "22px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "22px" }}>
              ログインするとガチャを引けます
            </h2>

            <p
              style={{
                color: DEFAULT_MUTED,
                lineHeight: 1.8,
                marginTop: "12px",
              }}
            >
              アイコンフレームを入手して、プロフィールを少しだけ目立たせよう。
            </p>

            <Link
              href="/login"
              style={{
                display: "inline-flex",
                marginTop: "14px",
                background: DEFAULT_ACCENT,
                color: "#ffffff",
                textDecoration: "none",
                padding: "12px 18px",
                borderRadius: "9999px",
                fontWeight: "bold",
              }}
            >
              ログインする
            </Link>
          </section>
        ) : (
          <>
            <section
              style={{
                margin: "22px 20px",
                border: `1px solid ${DEFAULT_BORDER}`,
                borderRadius: "28px",
                background: DEFAULT_CARD,
                padding: "24px",
                boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "76px",
                    height: "76px",
                    borderRadius: "9999px",
                    padding: "4px",
                    border: selectedFrame?.border_css ?? `2px solid ${DEFAULT_BORDER}`,
                    boxShadow: selectedFrame?.glow_css ?? "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
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
                        background: DEFAULT_ACCENT,
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        fontWeight: "bold",
                      }}
                    >
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      marginBottom: "4px",
                    }}
                  >
                    {displayName}
                  </div>

                  <div
                    style={{
                      color: DEFAULT_MUTED,
                      fontSize: "13px",
                      lineHeight: 1.7,
                    }}
                  >
                    装備中：
                    {selectedFrame
                      ? `${selectedFrame.name}（${selectedFrame.rarity}）`
                      : "なし"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  border: `1px solid ${DEFAULT_BORDER}`,
                  borderRadius: "22px",
                  padding: "18px",
                  background: DEFAULT_BACKGROUND,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: DEFAULT_MUTED,
                    fontSize: "13px",
                    marginBottom: "10px",
                    fontWeight: "bold",
                  }}
                >
                  アイコンフレームガチャ
                </div>

                <button
                  onClick={handleDrawGacha}
                  disabled={spinning}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: "9999px",
                    background: spinning ? "#375a7f" : DEFAULT_ACCENT,
                    color: "#ffffff",
                    padding: "15px 18px",
                    fontSize: "16px",
                    fontWeight: 900,
                    cursor: spinning ? "not-allowed" : "pointer",
                  }}
                >
                  {spinning ? "抽選中..." : "ガチャを引く"}
                </button>

                <p
                  style={{
                    margin: "12px 0 0",
                    color: DEFAULT_MUTED,
                    fontSize: "12px",
                    lineHeight: 1.7,
                  }}
                >
                  現在は無料・回数制限なしです。あとからチケット制に変更できます。
                </p>
              </div>

              {resultFrame && (
                <div
                  style={{
                    marginTop: "18px",
                    borderRadius: "24px",
                    border: `1px solid ${
                      rarityColor[resultFrame.rarity] ?? DEFAULT_BORDER
                    }`,
                    background: "rgba(255,255,255,0.04)",
                    padding: "20px",
                    textAlign: "center",
                    boxShadow: resultFrame.glow_css ?? "none",
                  }}
                >
                  <div
                    style={{
                      color: rarityColor[resultFrame.rarity] ?? DEFAULT_ACCENT,
                      fontSize: "14px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    {resultFrame.rarity}
                  </div>

                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 900,
                      marginBottom: "10px",
                    }}
                  >
                    {resultFrame.name}
                  </div>

                  <div
                    style={{
                      margin: "0 auto 16px",
                      width: "76px",
                      height: "76px",
                      borderRadius: "9999px",
                      border: resultFrame.border_css,
                      boxShadow: resultFrame.glow_css ?? "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: DEFAULT_MUTED,
                      fontWeight: "bold",
                    }}
                  >
                    Frame
                  </div>

                  <button
                    onClick={() => handleEquipFrame(resultFrame.frame_key)}
                    disabled={equippingFrameKey === resultFrame.frame_key}
                    style={{
                      border: "none",
                      borderRadius: "9999px",
                      background: DEFAULT_TEXT,
                      color: "#0f172a",
                      padding: "11px 16px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      cursor:
                        equippingFrameKey === resultFrame.frame_key
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {equippingFrameKey === resultFrame.frame_key
                      ? "装備中..."
                      : "このフレームを装備"}
                  </button>
                </div>
              )}

              {message && (
                <div
                  style={{
                    marginTop: "16px",
                    borderRadius: "18px",
                    background: "rgba(29,155,240,0.08)",
                    border: "1px solid rgba(29,155,240,0.25)",
                    color: "#9cc9ff",
                    padding: "13px 15px",
                    fontSize: "14px",
                    lineHeight: 1.7,
                    fontWeight: "bold",
                  }}
                >
                  {message}
                </div>
              )}
            </section>

            <section
              style={{
                margin: "22px 20px 120px",
                border: `1px solid ${DEFAULT_BORDER}`,
                borderRadius: "24px",
                background: DEFAULT_CARD,
                padding: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  marginBottom: "14px",
                }}
              >
                所持フレーム
              </h2>

              {ownedFrames.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    color: DEFAULT_MUTED,
                    lineHeight: 1.7,
                  }}
                >
                  まだフレームを持っていません。ガチャを引いてみよう。
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {ownedFrames.map((frame) => {
                    const isSelected =
                      profile?.selected_avatar_frame_key === frame.frame_key;

                    return (
                      <div
                        key={frame.frame_key}
                        style={{
                          border: `1px solid ${
                            isSelected ? DEFAULT_ACCENT : DEFAULT_BORDER
                          }`,
                          borderRadius: "18px",
                          padding: "14px",
                          background: DEFAULT_BACKGROUND,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "9999px",
                              border: frame.border_css,
                              boxShadow: frame.glow_css ?? "none",
                              flexShrink: 0,
                            }}
                          />

                          <div>
                            <div
                              style={{
                                fontWeight: "bold",
                                marginBottom: "2px",
                              }}
                            >
                              {frame.name}
                            </div>

                            <div
                              style={{
                                color: rarityColor[frame.rarity] ?? DEFAULT_MUTED,
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              {frame.rarity}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleEquipFrame(frame.frame_key)}
                          disabled={
                            isSelected || equippingFrameKey === frame.frame_key
                          }
                          style={{
                            width: "100%",
                            border: `1px solid ${DEFAULT_BORDER}`,
                            borderRadius: "9999px",
                            background: isSelected ? DEFAULT_ACCENT : "transparent",
                            color: isSelected ? "#ffffff" : DEFAULT_TEXT,
                            padding: "9px 12px",
                            fontSize: "13px",
                            fontWeight: "bold",
                            cursor:
                              isSelected || equippingFrameKey === frame.frame_key
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {isSelected
                            ? "装備中"
                            : equippingFrameKey === frame.frame_key
                            ? "装備中..."
                            : "装備する"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {ownedFrames.length > 0 && (
                <button
                  onClick={() => handleEquipFrame(null)}
                  disabled={!profile?.selected_avatar_frame_key}
                  style={{
                    marginTop: "16px",
                    border: `1px solid ${DEFAULT_BORDER}`,
                    borderRadius: "9999px",
                    background: "transparent",
                    color: DEFAULT_MUTED,
                    padding: "10px 14px",
                    fontSize: "13px",
                    fontWeight: "bold",
                    cursor: !profile?.selected_avatar_frame_key
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  フレームを外す
                </button>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}