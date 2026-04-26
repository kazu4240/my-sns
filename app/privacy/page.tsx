import Link from "next/link";

export default function PrivacyPage() {
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
            プライバシーポリシー
          </h1>

          <p
            style={{
              marginTop: "14px",
              color: "#475569",
              fontSize: "14px",
              lineHeight: 1.9,
            }}
          >
            このプライバシーポリシーは、Uleinにおけるユーザー情報の取扱いについて定めるものです。
            Uleinを利用する方は、本ポリシーの内容を確認したうえで本サービスを利用するものとします。
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
              <h2 style={headingStyle}>第1条（取得する情報）</h2>
              <p style={paragraphStyle}>
                Uleinでは、サービスの提供、運営、改善のため、以下の情報を取得する場合があります。
              </p>

              <ul style={listStyle}>
                <li>メールアドレスなど、ログイン・登録に必要な情報</li>
                <li>ユーザー名、表示名、自己紹介、アイコン画像などのプロフィール情報</li>
                <li>投稿内容、画像、返信、いいね、フォロー、通知などの利用情報</li>
                <li>お問い合わせ時に入力された情報</li>
                <li>
                  不具合調査や安全管理のために必要なアクセス情報、端末情報、ログ情報
                </li>
              </ul>
            </section>

            <section>
              <h2 style={headingStyle}>第2条（利用目的）</h2>
              <p style={paragraphStyle}>
                取得した情報は、以下の目的で利用します。
              </p>

              <ul style={listStyle}>
                <li>Uleinのアカウント登録、ログイン、本人確認のため</li>
                <li>投稿、返信、いいね、フォロー、通知などの機能を提供するため</li>
                <li>プロフィール表示やユーザー同士の交流機能を提供するため</li>
                <li>不具合の調査、改善、メンテナンスを行うため</li>
                <li>利用規約違反、不正利用、迷惑行為などを確認・対応するため</li>
                <li>お問い合わせへの対応のため</li>
                <li>サービスの品質向上、新機能の検討、利用状況の分析のため</li>
              </ul>
            </section>

            <section>
              <h2 style={headingStyle}>第3条（公開される情報）</h2>
              <p style={paragraphStyle}>
                Uleinでは、投稿内容、投稿画像、表示名、ユーザー名、プロフィール情報、
                アイコン画像、返信、いいね、フォローなどの情報が、他のユーザーに表示される場合があります。
              </p>
              <p style={paragraphStyle}>
                ユーザーは、個人情報や第三者に知られたくない情報を投稿しないよう注意してください。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第4条（外部サービスの利用）</h2>
              <p style={paragraphStyle}>
                Uleinでは、サービスの提供、運営、保守、データ保存、認証、画像保存、
                サイト配信などのために、外部サービスを利用する場合があります。
              </p>

              <p style={paragraphStyle}>
                これらの外部サービスでは、サービス提供に必要な範囲でユーザー情報が取り扱われる場合があります。
              </p>

              <p style={paragraphStyle}>
                Uleinは、利用する外部サービスについて、できる限り適切な管理と安全性の確認に努めます。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第5条（第三者提供）</h2>
              <p style={paragraphStyle}>
                Uleinは、法令に基づく場合、ユーザーの同意がある場合、
                またはサービスの運営上必要な委託先に提供する場合を除き、
                取得した個人情報を第三者に提供しません。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第6条（情報の管理）</h2>
              <p style={paragraphStyle}>
                Uleinは、取得した情報について、不正アクセス、紛失、破壊、改ざん、
                漏えいなどを防ぐため、できる限り適切な安全管理に努めます。
              </p>
              <p style={paragraphStyle}>
                ただし、インターネット上のサービスである性質上、完全な安全性を保証するものではありません。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第7条（アカウント削除・情報削除）</h2>
              <p style={paragraphStyle}>
                ユーザーは、運営者が定める方法により、アカウント削除や登録情報の削除を申請できます。
                ただし、法令上または運営上必要な情報については、一定期間保存される場合があります。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第8条（お問い合わせ）</h2>
              <p style={paragraphStyle}>
                個人情報の取扱い、アカウント削除、投稿削除、その他のお問い合わせは、
                運営者が指定する方法により行うものとします。
              </p>
              <p style={paragraphStyle}>
                お問い合わせ先は、サービス内に設置するお問い合わせページまたは連絡手段にて案内します。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第9条（プライバシーポリシーの変更）</h2>
              <p style={paragraphStyle}>
                Uleinは、必要に応じて本ポリシーを変更できるものとします。
                変更後の内容は、本サービス上に掲載した時点で効力を生じるものとします。
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
            ※このページは公開準備用のプライバシーポリシーです。
            正式に大規模公開する場合や、広告・アクセス解析・課金機能などを追加する場合は、
            内容を見直してください。
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

            <Link href="/contact" style={subButtonStyle}>
              お問い合わせ
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