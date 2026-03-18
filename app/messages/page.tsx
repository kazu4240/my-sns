"use client";

import Link from "next/link";

export default function MessagesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#15202b",
        color: "#ffffff",
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
            background: "rgba(21, 32, 43, 0.96)",
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
            ダイレクトメッセージ
          </h1>
        </header>

        <section
          style={{
            padding: "24px 20px",
          }}
        >
          <div
            style={{
              border: "1px solid #2f3336",
              borderRadius: "18px",
              padding: "20px",
              background: "#192734",
              color: "#8899a6",
              lineHeight: 1.7,
            }}
          >
            ここはDMページです。<br />
            まずは下ナビ用の入口として作成しました。<br />
            次に会話一覧やメッセージ送信を追加できます。
          </div>
        </section>
      </div>
    </main>
  );
}
