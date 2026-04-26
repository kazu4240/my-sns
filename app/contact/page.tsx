"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ContactPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [category, setCategory] = useState("不具合報告");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        setUserEmail(user.email ?? null);
        setEmail(user.email ?? "");
      }
    };

    checkUser();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResultMessage("");

    if (!category.trim()) {
      setResultMessage("お問い合わせの種類を選んでください。");
      return;
    }

    if (!email.trim()) {
      setResultMessage("メールアドレスを入力してください。");
      return;
    }

    if (!subject.trim()) {
      setResultMessage("件名を入力してください。");
      return;
    }

    if (!message.trim()) {
      setResultMessage("お問い合わせ内容を入力してください。");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("contact_messages").insert({
      user_id: userId,
      email: email.trim(),
      category,
      subject: subject.trim(),
      message: message.trim(),
      status: "unread",
    });

    if (error) {
      console.error(error);
      setResultMessage("送信に失敗しました。少し時間をおいて再度お試しください。");
      setSubmitting(false);
      return;
    }

    setResultMessage("お問い合わせを送信しました。確認後、必要に応じて対応します。");
    setCategory("不具合報告");
    setSubject("");
    setMessage("");

    if (!userEmail) {
      setEmail("");
    }

    setSubmitting(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "820px",
          margin: "0 auto",
          padding: "32px 16px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "bold",
            display: "inline-block",
            marginBottom: "20px",
          }}
        >
          ← ホームに戻る
        </Link>

        <section
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "24px",
            background: "#ffffff",
            padding: "26px",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              letterSpacing: "-0.03em",
              color: "#0f172a",
            }}
          >
            お問い合わせ
          </h1>

          <p
            style={{
              marginTop: "14px",
              color: "#475569",
              fontSize: "14px",
              lineHeight: 1.9,
            }}
          >
            Uleinに関するお問い合わせ、不具合報告、通報、削除依頼、アカウント削除依頼などを送信できます。
            内容を確認後、必要に応じて対応します。
          </p>

          <p
            style={{
              marginTop: "8px",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            最終更新日：2026年4月26日
          </p>

          {userEmail && (
            <div
              style={{
                marginTop: "18px",
                borderRadius: "18px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                padding: "14px 16px",
                color: "#1e40af",
                fontSize: "13px",
                lineHeight: 1.7,
                fontWeight: "bold",
              }}
            >
              ログイン中: {userEmail}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              marginTop: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <label style={labelStyle}>
              <span style={labelTextStyle}>お問い合わせの種類</span>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle}
                disabled={submitting}
              >
                <option value="不具合報告">不具合報告</option>
                <option value="通報・削除依頼">通報・削除依頼</option>
                <option value="アカウント削除依頼">アカウント削除依頼</option>
                <option value="ログイン・登録について">ログイン・登録について</option>
                <option value="その他">その他</option>
              </select>
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>メールアドレス</span>

              <input
                type="email"
                placeholder="返信や本人確認に使えるメールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                disabled={submitting}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>件名</span>

              <input
                type="text"
                placeholder="例：画像投稿ができない"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={inputStyle}
                disabled={submitting}
                maxLength={80}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>お問い合わせ内容</span>

              <textarea
                placeholder="できるだけ詳しく書いてください。どのページで起きたか、何を押した時に起きたか、エラー表示があるかなどを書くと確認しやすいです。"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  ...inputStyle,
                  minHeight: "180px",
                  resize: "vertical",
                  lineHeight: 1.7,
                }}
                disabled={submitting}
                maxLength={2000}
              />
            </label>

            <div
              style={{
                borderRadius: "18px",
                background: "#f1f5f9",
                padding: "16px",
                color: "#475569",
                fontSize: "12px",
                lineHeight: 1.8,
              }}
            >
              <p style={{ margin: 0, fontWeight: "bold", color: "#0f172a" }}>
                送信前に確認してください
              </p>

              <ul
                style={{
                  margin: "10px 0 0",
                  paddingLeft: "20px",
                }}
              >
                <li>個人情報を書きすぎないよう注意してください。</li>
                <li>緊急性がある内容は、内容欄に「緊急」と書いてください。</li>
                <li>通報の場合は、投稿やユーザーが分かる情報を書いてください。</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                border: "none",
                borderRadius: "9999px",
                background: submitting ? "#64748b" : "#0f172a",
                color: "#ffffff",
                padding: "14px 18px",
                fontSize: "15px",
                fontWeight: "bold",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "送信中..." : "お問い合わせを送信"}
            </button>

            {resultMessage && (
              <div
                style={{
                  borderRadius: "18px",
                  padding: "14px 16px",
                  color: resultMessage.includes("失敗") ? "#991b1b" : "#166534",
                  background: resultMessage.includes("失敗")
                    ? "#fef2f2"
                    : "#f0fdf4",
                  border: resultMessage.includes("失敗")
                    ? "1px solid #fecaca"
                    : "1px solid #bbf7d0",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  fontWeight: "bold",
                }}
              >
                {resultMessage}
              </div>
            )}
          </form>

          <div
            style={{
              marginTop: "34px",
              display: "flex",
              flexDirection: "column",
              gap: "26px",
              color: "#334155",
              fontSize: "14px",
              lineHeight: 1.9,
            }}
          >
            <section>
              <h2 style={headingStyle}>通報・削除依頼について</h2>
              <p style={paragraphStyle}>
                誹謗中傷、なりすまし、個人情報の無断公開、不適切な投稿、
                迷惑行為などを見つけた場合は、該当する投稿やユーザーが分かる情報を添えて送信してください。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>アカウント削除依頼について</h2>
              <p style={paragraphStyle}>
                アカウント削除を希望する場合は、登録しているメールアドレスやユーザー名など、
                本人確認に必要な情報を添えて送信してください。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>不具合報告について</h2>
              <p style={paragraphStyle}>
                ログインできない、投稿できない、画像が表示されない、読み込みが終わらないなどの不具合を見つけた場合は、
                どの画面で何をした時に起きたかを書いてください。
              </p>
            </section>
          </div>

          <div
            style={{
              marginTop: "36px",
              borderRadius: "18px",
              background: "#f1f5f9",
              padding: "16px",
              color: "#475569",
              fontSize: "12px",
              lineHeight: 1.8,
            }}
          >
            ※送信された内容は、Uleinの運営確認のために利用します。
            内容によっては返信できない場合があります。
          </div>

          <div
            style={{
              marginTop: "28px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/terms" style={subButtonStyle}>
              利用規約を見る
            </Link>

            <Link href="/privacy" style={subButtonStyle}>
              プライバシーポリシーを見る
            </Link>

            <Link href="/account/delete" style={subButtonStyle}>
              アカウント削除について
            </Link>

            <Link href="/" style={mainButtonStyle}>
              ホームに戻る
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
} as const;

const labelTextStyle = {
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "bold",
} as const;

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: "14px",
  background: "#ffffff",
  color: "#0f172a",
  padding: "13px 14px",
  fontSize: "15px",
  outline: "none",
} as const;

const headingStyle = {
  margin: 0,
  marginBottom: "8px",
  fontSize: "18px",
  color: "#0f172a",
  fontWeight: "bold",
} as const;

const paragraphStyle = {
  margin: "8px 0 0",
} as const;

const mainButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "9999px",
  background: "#0f172a",
  color: "#ffffff",
  padding: "12px 18px",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
} as const;

const subButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "9999px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#334155",
  padding: "12px 18px",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
} as const;