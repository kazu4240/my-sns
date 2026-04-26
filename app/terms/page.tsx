import Link from "next/link";

export default function TermsPage() {
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
            利用規約
          </h1>

          <p
            style={{
              marginTop: "14px",
              color: "#475569",
              fontSize: "14px",
              lineHeight: 1.9,
            }}
          >
            この利用規約は、Uleinの利用条件を定めるものです。
            Uleinを利用する方は、本規約に同意したうえで本サービスを利用するものとします。
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
              <h2 style={headingStyle}>第1条（適用）</h2>
              <p style={paragraphStyle}>
                本規約は、Uleinの利用に関する運営者とユーザーとの間の一切の関係に適用されます。
                ユーザーは、本サービスを利用した時点で、本規約に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第2条（利用登録）</h2>
              <p style={paragraphStyle}>
                本サービスの利用を希望する方は、運営者が定める方法により登録を行うものとします。
                登録情報に虚偽、誤り、または不備がある場合、運営者は利用登録を拒否または停止できるものとします。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第3条（アカウント管理）</h2>
              <p style={paragraphStyle}>
                ユーザーは、自身の責任でアカウント情報を管理するものとします。
                アカウントの管理不十分、第三者の使用、不正アクセス等によって生じた損害について、
                運営者は故意または重大な過失がある場合を除き、責任を負いません。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第4条（投稿内容）</h2>
              <p style={paragraphStyle}>
                ユーザーは、自身が投稿した文章、画像、プロフィール情報、その他のコンテンツについて、
                自ら責任を負うものとします。
              </p>
              <p style={paragraphStyle}>
                ユーザーは、第三者の権利を侵害する内容、法令に違反する内容、
                または他者に迷惑をかける内容を投稿してはなりません。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第5条（禁止事項）</h2>
              <p style={paragraphStyle}>
                ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
              </p>

              <ul style={listStyle}>
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為または犯罪行為を助長する行為</li>
                <li>他者への誹謗中傷、脅迫、嫌がらせ、差別的表現</li>
                <li>他者の個人情報を無断で公開する行為</li>
                <li>
                  他者の著作権、肖像権、プライバシー権、その他の権利を侵害する行為
                </li>
                <li>なりすまし行為</li>
                <li>スパム、宣伝、勧誘、荒らし行為</li>
                <li>過度に暴力的、性的、または不快感を与える内容の投稿</li>
                <li>本サービスの運営を妨害する行為</li>
                <li>不正アクセス、システムへの攻撃、過度な負荷をかける行為</li>
                <li>その他、運営者が不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 style={headingStyle}>第6条（投稿の削除・利用制限）</h2>
              <p style={paragraphStyle}>
                運営者は、ユーザーの投稿または行為が本規約に違反すると判断した場合、
                事前の通知なく、投稿の削除、アカウントの利用制限、またはアカウントの停止を行うことができます。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第7条（サービス内容の変更・停止）</h2>
              <p style={paragraphStyle}>
                運営者は、必要に応じて、本サービスの内容を変更、追加、中断、または終了することができます。
                これによりユーザーに生じた損害について、運営者は故意または重大な過失がある場合を除き、
                責任を負いません。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第8条（免責事項）</h2>
              <p style={paragraphStyle}>
                運営者は、本サービスが常に安全、正確、完全、または継続的に提供されることを保証しません。
                ユーザー間またはユーザーと第三者との間で生じたトラブルについては、
                当事者間で解決するものとします。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第9条（知的財産権）</h2>
              <p style={paragraphStyle}>
                ユーザーが投稿したコンテンツの権利は、原則として投稿したユーザーに帰属します。
                ただし、ユーザーは、運営者が本サービスの運営、表示、改善、宣伝に必要な範囲で、
                投稿内容を利用できることを許可するものとします。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第10条（退会・アカウント削除）</h2>
              <p style={paragraphStyle}>
                ユーザーは、運営者が定める方法により、アカウントの削除を申請できるものとします。
                ただし、法令上または運営上必要な情報については、一定期間保存される場合があります。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第11条（規約の変更）</h2>
              <p style={paragraphStyle}>
                運営者は、必要に応じて本規約を変更できるものとします。
                変更後の規約は、本サービス上に掲載した時点で効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 style={headingStyle}>第12条（お問い合わせ）</h2>
              <p style={paragraphStyle}>
                本規約に関するお問い合わせは、運営者が指定する方法により行うものとします。
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
            ※このページは公開準備用の利用規約です。
            正式に大規模公開する場合は、サービス内容に合わせて内容を見直してください。
          </div>

          <div
            style={{
              marginTop: "28px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/privacy" style={subButtonStyle}>
              プライバシーポリシーを見る
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