import Link from "next/link";

export default function ContactPage() {
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
          <h1 className="text-2xl font-bold tracking-tight">
            お問い合わせ
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Uleinに関するお問い合わせ、不具合報告、通報、削除依頼、アカウント削除依頼などは、
            以下の内容を確認してから運営者へ連絡してください。
          </p>

          <p className="mt-2 text-xs text-slate-500">
            最終更新日：2026年4月26日
          </p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
            <section>
              <h2 className="text-lg font-bold text-slate-900">
                お問い合わせ前に確認してください
              </h2>

              <p className="mt-2">
                できるだけ正確に対応するため、連絡する際は以下の内容を含めてください。
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>お問い合わせの種類</li>
                <li>発生している問題の内容</li>
                <li>問題が起きた日時</li>
                <li>使用している端末やブラウザ</li>
                <li>該当する投稿、ユーザー、画面が分かる情報</li>
                <li>スクリーンショットがある場合はその内容</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                通報・削除依頼について
              </h2>

              <p className="mt-2">
                誹謗中傷、なりすまし、個人情報の無断公開、不適切な投稿、
                迷惑行為などを見つけた場合は、該当する投稿やユーザーが分かる情報を添えて連絡してください。
              </p>

              <div className="mt-4 rounded-2xl bg-slate-100 p-4">
                <p className="font-bold text-slate-900">
                  連絡時に書いてほしい内容
                </p>

                <ul className="mt-2 list-disc space-y-2 pl-6">
                  <li>通報したい投稿やユーザー</li>
                  <li>問題だと思う理由</li>
                  <li>被害を受けている本人かどうか</li>
                  <li>緊急性があるかどうか</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                アカウント削除依頼について
              </h2>

              <p className="mt-2">
                アカウント削除を希望する場合は、登録しているメールアドレスやユーザー名など、
                本人確認に必要な情報を添えて連絡してください。
              </p>

              <p className="mt-2">
                ただし、法令上または運営上必要な情報については、一定期間保存される場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                不具合報告について
              </h2>

              <p className="mt-2">
                ログインできない、投稿できない、画像が表示されない、読み込みが終わらないなどの不具合を見つけた場合は、
                できるだけ詳しい状況を連絡してください。
              </p>

              <div className="mt-4 rounded-2xl bg-slate-100 p-4">
                <p className="font-bold text-slate-900">
                  不具合報告の例
                </p>

                <ul className="mt-2 list-disc space-y-2 pl-6">
                  <li>どのページで起きたか</li>
                  <li>何を押した時に起きたか</li>
                  <li>エラーメッセージが出ているか</li>
                  <li>スマホかPCか</li>
                  <li>iPhone、Android、Windows、Macなどの端末情報</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                連絡先
              </h2>

              <p className="mt-2">
                現在、正式なお問い合わせフォームは準備中です。
                公開初期の間は、運営者が指定する連絡手段にてお問い合わせください。
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">
                  お問い合わせ先
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  準備中
                </p>

                <p className="mt-3 text-xs leading-6 text-slate-500">
                  ※正式公開前に、メールアドレス、Googleフォーム、または専用のお問い合わせフォームを設置予定です。
                </p>
              </div>
            </section>
          </div>

          <div className="mt-10 rounded-2xl bg-slate-100 p-4 text-xs leading-6 text-slate-600">
            <p>
              ※このページは公開準備用のお問い合わせ案内です。
              正式公開前に、実際に連絡を受け取れる手段を設定してください。
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/terms"
              className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              利用規約を見る
            </Link>

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