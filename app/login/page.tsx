"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async () => {
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage("登録失敗: " + error.message);
    } else {
      setMessage("登録メールを送ったよ。メールを確認してね。");
    }
  };

  const handleLogin = async () => {
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("ログイン失敗: " + error.message);
    } else {
      setMessage("ログイン成功！");
      router.push("/");
    }
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
          }}
        >
          ← ホームに戻る
        </Link>

        <div
          style={{
            border: "1px solid #2f3336",
            borderRadius: "20px",
            padding: "28px",
            background: "#192734",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              marginBottom: "24px",
              fontSize: "30px",
            }}
          >
            ログイン / 新規登録
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #2f3336",
                background: "#15202b",
                color: "white",
                fontSize: "16px",
              }}
            />

            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid #2f3336",
                background: "#15202b",
                color: "white",
                fontSize: "16px",
              }}
            />

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                onClick={handleLogin}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "9999px",
                  border: "none",
                  background: "#1d9bf0",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                ログイン
              </button>

              <button
                onClick={handleSignUp}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "9999px",
                  border: "1px solid #2f3336",
                  background: "transparent",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                新規登録
              </button>
            </div>

            {message && (
              <p
                style={{
                  marginTop: "12px",
                  color: "#9cc9ff",
                  lineHeight: 1.6,
                }}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}