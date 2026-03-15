# ファイブリーグ

ネプリーグの「ファイブリーグ」風 Web アプリ。5文字で答えられる問題を、5人が1文字ずつ手書きして正解を目指します。

## 機能

- **5人同時プレイ**: 部屋URLを共有して最大5人で参加
- **手書き入力**: PCはマウス、スマホはタッチで1文字ずつ記入
- **45秒タイマー**: 1問あたり45秒で回答
- **5問出題**: 1ゲームで5問
- **1文字ずつ公開**: 時間終了後、書いた文字（画像）を1文字目から順に公開
- **ゲームマスター判定**: 1文字目担当（1人目）が書いた文字と正解を照合し、正解/不正解を判定
- **問題作成**: URLを知っている人なら誰でも問題を追加可能（500問まで利用）

## 技術スタック

- **フロント**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **DB・Realtime**: Supabase（無料枠）

## 要件

- Node.js 18.17 以上（Vercel では自動）

### このプロジェクトだけで Node のバージョンを変えたい場合（nvm）

プロジェクト直下に `.nvmrc` があります。**nvm** を使っている場合、このフォルダでだけ Node 20 に切り替えられます。

```bash
cd ファイブリーグ
nvm use
npm run dev
```

初回だけ `nvm use` のときに「Version xx is not installed」と出たら、`nvm install` を実行してから再度 `nvm use` してください。

## セットアップ（ローカル）

### 1. Supabase

1. [Supabase](https://supabase.com) でアカウント作成 → 新規プロジェクト作成
2. **SQL Editor** で `supabase/schema.sql` の内容を実行
3. **Database → Publications** で `games` テーブルを Realtime に追加
4. **Settings → API** で `Project URL` と `anon public` キーをコピー

### 2. 環境変数

```bash
cp .env.example .env.local
# .env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定
```

### 3. 起動

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## デプロイ（無料で公開）

- **URL を知っている人だけアクセス** = アプリのURLを検索に出さず共有だけで使う想定です。

### フロント（Next.js）: Vercel

1. [Vercel](https://vercel.com) で GitHub 連携
2. リポジトリをインポート
3. **Environment Variables** に設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### DB

- Supabase は無料枠のまま利用（本番も同じプロジェクトで可）。RLS は `schema.sql` のとおり「anon で全操作許可」なので、**URL を秘密にして共有する前提**です。

## 使い方

1. トップで「部屋を作る」→ 遷移したURL（例: `/game/abc12345`）を参加者に共有
2. 最大5人が「参加する」で同じURLにアクセスし、1〜5文字目のスロットと名前を選んで参加
3. 1文字目を選んだ人がゲームマスター。「ゲーム開始」で5問スタート
4. 各問で45秒以内に自分の1文字を手書きし「確定」
5. 時間終了後、GMが「次の文字を公開」で書いた文字（画像）を1文字ずつ公開 → 5文字出そろったら、GMが正解と照合して「正解」「不正解」を選択
6. 「次の問題へ」で残り問題へ。5問終了でゲーム終了

問題は「問題を作成する」から追加。同じURLを知っている人なら誰でも追加でき、1ゲームで最大500問から5問がランダムで出題されます。

## ライセンス

MIT
