import Link from "next/link";

export default function ContactPage() {
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
            Uleinに関するお問い合わせ、不具合報告、通報、削除依頼、アカウント削除依頼などは、
            以下の内容を確認してから運営者へ連絡してください。
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
              <h2 style={headingStyle}>お問い合わせ前に確認してください</h2>

              <p style={paragraphStyle}>
                できるだけ正確に対応するため、連絡する際は以下の内容を含めてください。
              </p>

              <ul style={listStyle}>
                <li>お問い合わせの種類</li>
                <li>発生している問題の内容</li>
                <li>問題が起きた日時</li>
                <li>使用している端末やブラウザ</li>
                <li>該当する投稿、ユーザー、画面が分かる情報</li>
                <li>スクリーンショットがある場合はその内容</li>
              </ul>
            </section>

            <section>
              <h2 style={headingStyle}>通報・削除依頼について</h2>

              <p style={paragraphStyle}>
                誹謗中傷、なりすまし、個人情報の無断公開、不適切な投稿、
                迷惑行為などを見つけた場合は、該当する投稿やユーザーが分かる情報を添えて連絡してください。
              </p>

              <div style={boxStyle}>
                <p style={boxTitleStyle}>連絡時に書いてほしい内容</p>

                <ul style={listStyle}>
                  <li>通報したい投稿やユーザー</li>
                  <li>問題だと思う理由</li>
                  <li>被害を受けている本人かどうか</li>
                  <li>緊急性があるかどうか</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 style={headingStyle}>アカウント削除依頼について</h2>

              <p style={paragraphStyle}>
                アカウント削除を希望する場合は、登録しているメールアドレスやユーザー名など、
                本人確認に必要な情報を添えて連絡してください。
              </p>

              <p style={paragraphStyle}>
                ただし、法令上または運営上必要な情報については、一定期間保存される場合があります。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>不具合報告について</h2>

              <p style={paragraphStyle}>
                ログインできない、投稿できない、画像が表示されない、読み込みが終わらないなどの不具合を見つけた場合は、
                できるだけ詳しい状況を連絡してください。
              </p>

              <div style={boxStyle}>
                <p style={boxTitleStyle}>不具合報告の例</p>

                <ul style={listStyle}>
                  <li>どのページで起きたか</li>
                  <li>何を押した時に起きたか</li>
                  <li>エラーメッセージが出ているか</li>
                  <li>スマホかPCか</li>
                  <li>iPhone、Android、Windows、Macなどの端末情報</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 style={headingStyle}>連絡先</h2>

              <p style={paragraphStyle}>
                現在、正式なお問い合わせフォームは準備中です。
                公開初期の間は、運営者が指定する連絡手段にてお問い合わせください。
              </p>

              <div
                style={{
                  marginTop: "16px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  background: "#f8fafc",
                  padding: "16px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  お問い合わせ先
                </p>

                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#475569",
                    fontSize: "14px",
                  }}
                >
                  準備中
                </p>

                <p
                  style={{
                    margin: "12px 0 0",
                    color: "#64748b",
                    fontSize: "12px",
                    lineHeight: 1.8,
                  }}
                >
                  ※正式公開前に、メールアドレス、Googleフォーム、または専用のお問い合わせフォームを設置予定です。
                </p>
              </div>
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
            ※このページは公開準備用のお問い合わせ案内です。
            正式公開前に、実際に連絡を受け取れる手段を設定してください。
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