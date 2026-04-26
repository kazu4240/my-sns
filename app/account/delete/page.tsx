import Link from "next/link";

export default function AccountDeletePage() {
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
            アカウント削除について
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Uleinのアカウント削除を希望する場合は、本人確認のうえで対応します。
            削除を希望する前に、以下の内容を確認してください。
          </p>

          <p className="mt-2 text-xs text-slate-500">
            最終更新日：2026年4月26日
          </p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
            <section>
              <h2 className="text-lg font-bold text-slate-900">
                削除される可能性がある情報
              </h2>

              <p className="mt-2">
                アカウント削除を行う場合、以下の情報が削除対象になります。
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
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
              <h2 className="text-lg font-bold text-slate-900">
                すぐに削除できない場合があります
              </h2>

              <p className="mt-2">
                法令上または運営上必要な情報については、一定期間保存される場合があります。
                また、不正利用、迷惑行為、トラブル対応などの確認が必要な場合、削除対応に時間がかかることがあります。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                削除依頼の方法
              </h2>

              <p className="mt-2">
                アカウント削除を希望する場合は、お問い合わせページから連絡してください。
                本人確認のため、登録しているメールアドレスやユーザー名などを確認する場合があります。
              </p>

              <div className="mt-4 rounded-2xl bg-slate-100 p-4">
                <p className="font-bold text-slate-900">
                  連絡時に書いてほしい内容
                </p>

                <ul className="mt-2 list-disc space-y-2 pl-6">
                  <li>「アカウント削除希望」と書く</li>
                  <li>登録しているメールアドレス</li>
                  <li>ユーザー名</li>
                  <li>削除したい理由</li>
                  <li>本人であることを確認できる情報</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                削除前の注意
              </h2>

              <p className="mt-2">
                アカウント削除後は、投稿、プロフィール、画像などを元に戻せない場合があります。
                必要な情報がある場合は、削除依頼の前に自分で保存してください。
              </p>
            </section>
          </div>

          <div className="mt-10 rounded-2xl bg-red-50 p-4 text-xs leading-6 text-red-700">
            <p>
              ※現在、自動削除機能は準備中です。公開初期の間は、お問い合わせを受けて運営者が確認・対応します。
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="rounded-full bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-slate-700"
            >
              お問い合わせへ
            </Link>

            <Link
              href="/privacy"
              className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              プライバシーポリシーを見る
            </Link>

            <Link
              href="/"
              className="rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ホームに戻る
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}