import Link from "next/link";

export default function AccountDeletePage() {
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
            アカウント削除について
          </h1>

          <p
            style={{
              marginTop: "14px",
              color: "#475569",
              fontSize: "14px",
              lineHeight: 1.9,
            }}
          >
            Uleinのアカウント削除を希望する場合は、本人確認のうえで対応します。
            削除を希望する前に、以下の内容を確認してください。
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

          <div
            style={{
              marginTop: "34px",
              display: "flex",
              flexDirection: "column",
              gap: "30px",
              color: "#334155",
              fontSize: "14px",
              lineHeight: 1.9,
            }}
          >
            <section>
              <h2 style={headingStyle}>削除される可能性がある情報</h2>

              <p style={paragraphStyle}>
                アカウント削除を行う場合、以下の情報が削除対象になります。
              </p>

              <ul style={listStyle}>
                <li>アカウント情報</li>
                <li>プロフィール情報</li>
                <li>表示名、ユーザー名、自己紹介</li>
                <li>アイコン画像</li>
                <li>投稿内容</li>
                <li>投稿画像</li>
                <li>返信、いいね、フォロー、通知などの利用情報</li>
              </ul>
            </section>

            <section>
              <h2 style={headingStyle}>すぐに削除できない場合があります</h2>

              <p style={paragraphStyle}>
                法令上または運営上必要な情報については、一定期間保存される場合があります。
                また、不正利用、迷惑行為、トラブル対応などの確認が必要な場合、
                削除対応に時間がかかることがあります。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>削除依頼の方法</h2>

              <p style={paragraphStyle}>
                アカウント削除を希望する場合は、お問い合わせページから連絡してください。
                本人確認のため、登録しているメールアドレスやユーザー名などを確認する場合があります。
              </p>

              <div style={boxStyle}>
                <p style={boxTitleStyle}>連絡時に書いてほしい内容</p>

                <ul style={listStyle}>
                  <li>「アカウント削除希望」と書く</li>
                  <li>登録しているメールアドレス</li>
                  <li>ユーザー名</li>
                  <li>削除したい理由</li>
                  <li>本人であることを確認できる情報</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 style={headingStyle}>削除前の注意</h2>

              <p style={paragraphStyle}>
                アカウント削除後は、投稿、プロフィール、画像などを元に戻せない場合があります。
                必要な情報がある場合は、削除依頼の前に自分で保存してください。
              </p>
            </section>
          </div>

          <div
            style={{
              marginTop: "36px",
              borderRadius: "18px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "16px",
              color: "#991b1b",
              fontSize: "12px",
              lineHeight: 1.8,
              fontWeight: "bold",
            }}
          >
            ※現在、自動削除機能は準備中です。公開初期の間は、お問い合わせを受けて運営者が確認・対応します。
          </div>

          <div
            style={{
              marginTop: "28px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/contact" style={mainButtonStyle}>
              お問い合わせへ
            </Link>

            <Link href="/privacy" style={subButtonStyle}>
              プライバシーポリシーを見る
            </Link>

            <Link href="/terms" style={subButtonStyle}>
              利用規約を見る
            </Link>

            <Link href="/" style={subButtonStyle}>
              ホームに戻る
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

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

const listStyle = {
  margin: "12px 0 0",
  paddingLeft: "22px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
} as const;

const boxStyle = {
  marginTop: "16px",
  borderRadius: "18px",
  background: "#f1f5f9",
  padding: "16px",
} as const;

const boxTitleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "bold",
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