"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");

    if (modeParam === "signup") {
      setMode("signup");
    } else {
      setMode("login");
    }
  }, []);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage("");

    if (nextMode === "signup") {
      router.replace("/login?mode=signup");
    } else {
      router.replace("/login");
    }
  };

  const validateInput = () => {
    if (!email.trim()) {
      setMessage("メールアドレスを入力してね。");
      return false;
    }

    if (!password) {
      setMessage("パスワードを入力してね。");
      return false;
    }

    if (password.length < 6) {
      setMessage("パスワードは6文字以上にしてね。");
      return false;
    }

    if (mode === "signup" && !agreed) {
      setMessage("新規登録には利用規約とプライバシーポリシーへの同意が必要です。");
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    setMessage("");

    if (!validateInput()) return;

    setSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage("登録失敗: " + error.message);
    } else {
      setMessage("登録メールを送ったよ。メールを確認してね。");
    }

    setSubmitting(false);
  };

  const handleLogin = async () => {
    setMessage("");

    if (!validateInput()) return;

    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage("ログイン失敗: " + error.message);
      setSubmitting(false);
      return;
    }

    setMessage("ログイン成功！");
    router.push("/");
  };

  const primaryButtonText =
    mode === "login"
      ? submitting
        ? "ログイン中..."
        : "ログイン"
      : submitting
      ? "登録中..."
      : "同意して新規登録";

  const isPrimaryDisabled =
    submitting ||
    !email.trim() ||
    !password ||
    password.length < 6 ||
    (mode === "signup" && !agreed);

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
          maxWidth: "520px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#1d9bf0",
            textDecoration: "none",
            fontSize: "14px",
            display: "inline-block",
            marginBottom: "20px",
            fontWeight: "bold",
          }}
        >
          ← ホームに戻る
        </Link>

        <div
          style={{
            border: "1px solid #2f3336",
            borderRadius: "24px",
            padding: "28px",
            background: "#192734",
            boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              marginBottom: "8px",
              fontSize: "30px",
              letterSpacing: "-0.03em",
            }}
          >
            {mode === "login" ? "ログイン" : "新規登録"}
          </h1>

          <p
            style={{
              marginTop: 0,
              marginBottom: "22px",
              color: "#8899a6",
              fontSize: "14px",
              lineHeight: 1.7,
            }}
          >
            {mode === "login"
              ? "Uleinにログインして、投稿・返信・いいね・フォローを使おう。"
              : "Uleinのアカウントを作成して、投稿を始めよう。"}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "22px",
              padding: "5px",
              borderRadius: "9999px",
              background: "#15202b",
              border: "1px solid #2f3336",
            }}
          >
            <button
              type="button"
              onClick={() => switchMode("login")}
              style={{
                padding: "10px",
                borderRadius: "9999px",
                border: "none",
                background: mode === "login" ? "#1d9bf0" : "transparent",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ログイン
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              style={{
                padding: "10px",
                borderRadius: "9999px",
                border: "none",
                background: mode === "signup" ? "#1d9bf0" : "transparent",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              新規登録
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <span
                style={{
                  fontSize: "13px",
                  color: "#cfd9de",
                  fontWeight: "bold",
                }}
              >
                メールアドレス
              </span>

              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  border: "1px solid #2f3336",
                  background: "#15202b",
                  color: "white",
                  fontSize: "16px",
                  outline: "none",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <span
                style={{
                  fontSize: "13px",
                  color: "#cfd9de",
                  fontWeight: "bold",
                }}
              >
                パスワード
              </span>

              <input
                type="password"
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  border: "1px solid #2f3336",
                  background: "#15202b",
                  color: "white",
                  fontSize: "16px",
                  outline: "none",
                }}
              />
            </label>

            {mode === "signup" && (
              <label
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  padding: "14px",
                  border: "1px solid #2f3336",
                  background: "#15202b",
                  borderRadius: "16px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{
                    marginTop: "4px",
                    width: "16px",
                    height: "16px",
                    flexShrink: 0,
                  }}
                />

                <span
                  style={{
                    fontSize: "13px",
                    color: "#cfd9de",
                    lineHeight: 1.7,
                  }}
                >
                  <Link
                    href="/terms"
                    target="_blank"
                    style={{
                      color: "#1d9bf0",
                      fontWeight: "bold",
                      textDecoration: "none",
                    }}
                  >
                    利用規約
                  </Link>
                  と
                  <Link
                    href="/privacy"
                    target="_blank"
                    style={{
                      color: "#1d9bf0",
                      fontWeight: "bold",
                      textDecoration: "none",
                    }}
                  >
                    プライバシーポリシー
                  </Link>
                  に同意します。
                </span>
              </label>
            )}

            <button
              onClick={mode === "login" ? handleLogin : handleSignUp}
              disabled={isPrimaryDisabled}
              style={{
                marginTop: "4px",
                padding: "13px",
                borderRadius: "9999px",
                border: "none",
                background: isPrimaryDisabled ? "#375a7f" : "#1d9bf0",
                color: "white",
                fontWeight: "bold",
                cursor: isPrimaryDisabled ? "not-allowed" : "pointer",
                fontSize: "15px",
              }}
            >
              {primaryButtonText}
            </button>

            {mode === "login" ? (
              <p
                style={{
                  margin: "4px 0 0",
                  color: "#8899a6",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  textAlign: "center",
                }}
              >
                アカウントがない場合は{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#1d9bf0",
                    fontWeight: "bold",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "13px",
                  }}
                >
                  新規登録
                </button>
              </p>
            ) : (
              <p
                style={{
                  margin: "4px 0 0",
                  color: "#8899a6",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  textAlign: "center",
                }}
              >
                すでにアカウントがある場合は{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#1d9bf0",
                    fontWeight: "bold",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "13px",
                  }}
                >
                  ログイン
                </button>
              </p>
            )}

            {message && (
              <p
                style={{
                  marginTop: "12px",
                  color: message.includes("失敗") ? "#ffb4b4" : "#9cc9ff",
                  lineHeight: 1.7,
                  fontSize: "14px",
                  background: message.includes("失敗")
                    ? "rgba(255,107,107,0.08)"
                    : "rgba(29,155,240,0.08)",
                  border: message.includes("失敗")
                    ? "1px solid rgba(255,107,107,0.25)"
                    : "1px solid rgba(29,155,240,0.25)",
                  borderRadius: "14px",
                  padding: "12px 14px",
                }}
              >
                {message}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: "18px",
            textAlign: "center",
            color: "#8899a6",
            fontSize: "12px",
            lineHeight: 1.8,
          }}
        >
          <Link
            href="/terms"
            style={{
              color: "#8899a6",
              textDecoration: "none",
              fontWeight: "bold",
              marginRight: "14px",
            }}
          >
            利用規約
          </Link>

          <Link
            href="/privacy"
            style={{
              color: "#8899a6",
              textDecoration: "none",
              fontWeight: "bold",
              marginRight: "14px",
            }}
          >
            プライバシーポリシー
          </Link>

          <Link
            href="/contact"
            style={{
              color: "#8899a6",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            お問い合わせ
          </Link>

          <p style={{ margin: "10px 0 0" }}>© 2026 Ulein</p>
        </div>
      </div>
    </main>
  );
}