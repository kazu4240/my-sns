import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            ← ホームに戻る
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">利用規約</h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            この利用規約は、Uleinの利用条件を定めるものです。
            Uleinを利用する方は、本規約に同意したうえで本サービスを利用するものとします。
          </p>

          <p className="mt-2 text-xs text-slate-500">
            最終更新日：2026年4月26日
          </p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第1条（適用）
              </h2>
              <p className="mt-2">
                本規約は、Uleinの利用に関する運営者とユーザーとの間の一切の関係に適用されます。
                ユーザーは、本サービスを利用した時点で、本規約に同意したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第2条（利用登録）
              </h2>
              <p className="mt-2">
                本サービスの利用を希望する方は、運営者が定める方法により登録を行うものとします。
                登録情報に虚偽、誤り、または不備がある場合、運営者は利用登録を拒否または停止できるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第3条（アカウント管理）
              </h2>
              <p className="mt-2">
                ユーザーは、自身の責任でアカウント情報を管理するものとします。
                アカウントの管理不十分、第三者の使用、不正アクセス等によって生じた損害について、
                運営者は故意または重大な過失がある場合を除き、責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第4条（投稿内容）
              </h2>
              <p className="mt-2">
                ユーザーは、自身が投稿した文章、画像、プロフィール情報、その他のコンテンツについて、
                自ら責任を負うものとします。
              </p>
              <p className="mt-2">
                ユーザーは、第三者の権利を侵害する内容、法令に違反する内容、
                または他者に迷惑をかける内容を投稿してはなりません。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第5条（禁止事項）
              </h2>
              <p className="mt-2">
                ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為または犯罪行為を助長する行為</li>
                <li>他者への誹謗中傷、脅迫、嫌がらせ、差別的表現</li>
                <li>他者の個人情報を無断で公開する行為</li>
                <li>他者の著作権、肖像権、プライバシー権、その他の権利を侵害する行為</li>
                <li>なりすまし行為</li>
                <li>スパム、宣伝、勧誘、荒らし行為</li>
                <li>過度に暴力的、性的、または不快感を与える内容の投稿</li>
                <li>本サービスの運営を妨害する行為</li>
                <li>不正アクセス、システムへの攻撃、過度な負荷をかける行為</li>
                <li>その他、運営者が不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第6条（投稿の削除・利用制限）
              </h2>
              <p className="mt-2">
                運営者は、ユーザーの投稿または行為が本規約に違反すると判断した場合、
                事前の通知なく、投稿の削除、アカウントの利用制限、またはアカウントの停止を行うことができます。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第7条（サービス内容の変更・停止）
              </h2>
              <p className="mt-2">
                運営者は、必要に応じて、本サービスの内容を変更、追加、中断、または終了することができます。
                これによりユーザーに生じた損害について、運営者は故意または重大な過失がある場合を除き、
                責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第8条（免責事項）
              </h2>
              <p className="mt-2">
                運営者は、本サービスが常に安全、正確、完全、または継続的に提供されることを保証しません。
                ユーザー間またはユーザーと第三者との間で生じたトラブルについては、
                当事者間で解決するものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第9条（知的財産権）
              </h2>
              <p className="mt-2">
                ユーザーが投稿したコンテンツの権利は、原則として投稿したユーザーに帰属します。
                ただし、ユーザーは、運営者が本サービスの運営、表示、改善、宣伝に必要な範囲で、
                投稿内容を利用できることを許可するものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第10条（退会・アカウント削除）
              </h2>
              <p className="mt-2">
                ユーザーは、運営者が定める方法により、アカウントの削除を申請できるものとします。
                ただし、法令上または運営上必要な情報については、一定期間保存される場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第11条（規約の変更）
              </h2>
              <p className="mt-2">
                運営者は、必要に応じて本規約を変更できるものとします。
                変更後の規約は、本サービス上に掲載した時点で効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第12条（お問い合わせ）
              </h2>
              <p className="mt-2">
                本規約に関するお問い合わせは、運営者が指定する方法により行うものとします。
              </p>
            </section>
          </div>

          <div className="mt-10 rounded-2xl bg-slate-100 p-4 text-xs leading-6 text-slate-600">
            <p>
              ※このページは公開準備用の利用規約です。
              正式に大規模公開する場合は、サービス内容に合わせて内容を見直してください。
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/privacy"
              className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              プライバシーポリシーを見る
            </Link>

            <Link
              href="/"
              className="rounded-full bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-700"
            >
              ホームに戻る
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}