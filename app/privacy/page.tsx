import Link from "next/link";

export default function PrivacyPage() {
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
            プライバシーポリシー
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            このプライバシーポリシーは、Uleinにおけるユーザー情報の取扱いについて定めるものです。
            Uleinを利用する方は、本ポリシーの内容を確認したうえで本サービスを利用するものとします。
          </p>

          <p className="mt-2 text-xs text-slate-500">
            最終更新日：2026年4月26日
          </p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">
            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第1条（取得する情報）
              </h2>
              <p className="mt-2">
                Uleinでは、サービスの提供、運営、改善のため、以下の情報を取得する場合があります。
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>メールアドレスなど、ログイン・登録に必要な情報</li>
                <li>ユーザー名、表示名、自己紹介、アイコン画像などのプロフィール情報</li>
                <li>投稿内容、画像、返信、いいね、フォロー、通知などの利用情報</li>
                <li>お問い合わせ時に入力された情報</li>
                <li>不具合調査や安全管理のために必要なアクセス情報、端末情報、ログ情報</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第2条（利用目的）
              </h2>
              <p className="mt-2">
                取得した情報は、以下の目的で利用します。
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
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
              <h2 className="text-lg font-bold text-slate-900">
                第3条（公開される情報）
              </h2>
              <p className="mt-2">
                Uleinでは、投稿内容、投稿画像、表示名、ユーザー名、プロフィール情報、
                アイコン画像、返信、いいね、フォローなどの情報が、他のユーザーに表示される場合があります。
              </p>
              <p className="mt-2">
                ユーザーは、個人情報や第三者に知られたくない情報を投稿しないよう注意してください。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第4条（外部サービスの利用）
              </h2>
              <p className="mt-2">
                Uleinでは、サービス提供のために以下の外部サービスを利用する場合があります。
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Supabase：認証、データベース、画像保存など</li>
                <li>Vercel：Webサイトの公開、配信、ホスティングなど</li>
                <li>GitHub：ソースコード管理、デプロイ連携など</li>
              </ul>

              <p className="mt-2">
                これらの外部サービスでは、各サービスの規約やプライバシーポリシーに基づいて情報が取り扱われる場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第5条（第三者提供）
              </h2>
              <p className="mt-2">
                Uleinは、法令に基づく場合、ユーザーの同意がある場合、またはサービスの運営上必要な委託先に提供する場合を除き、
                取得した個人情報を第三者に提供しません。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第6条（情報の管理）
              </h2>
              <p className="mt-2">
                Uleinは、取得した情報について、不正アクセス、紛失、破壊、改ざん、漏えいなどを防ぐため、
                できる限り適切な安全管理に努めます。
              </p>
              <p className="mt-2">
                ただし、インターネット上のサービスである性質上、完全な安全性を保証するものではありません。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第7条（アカウント削除・情報削除）
              </h2>
              <p className="mt-2">
                ユーザーは、運営者が定める方法により、アカウント削除や登録情報の削除を申請できます。
                ただし、法令上または運営上必要な情報については、一定期間保存される場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第8条（お問い合わせ）
              </h2>
              <p className="mt-2">
                個人情報の取扱い、アカウント削除、投稿削除、その他のお問い合わせは、
                運営者が指定する方法により行うものとします。
              </p>
              <p className="mt-2">
                お問い合わせ先は、今後サービス内に設置するお問い合わせページまたは連絡手段にて案内します。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">
                第9条（プライバシーポリシーの変更）
              </h2>
              <p className="mt-2">
                Uleinは、必要に応じて本ポリシーを変更できるものとします。
                変更後の内容は、本サービス上に掲載した時点で効力を生じるものとします。
              </p>
            </section>
          </div>

          <div className="mt-10 rounded-2xl bg-slate-100 p-4 text-xs leading-6 text-slate-600">
            <p>
              ※このページは公開準備用のプライバシーポリシーです。
              正式に大規模公開する場合や、広告・アクセス解析・課金機能などを追加する場合は、
              内容を見直してください。
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