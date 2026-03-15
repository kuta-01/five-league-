# Supabase セットアップ手順（1から）

プロジェクトは作成済みの前提で、ファイブリーグ用の設定を進めます。

---

## ステップ1: ダッシュボードを開く

1. [https://supabase.com](https://supabase.com) にログイン
2. 左の **「Project」** 一覧から、作成したプロジェクトをクリック
3. 左サイドバーに **Table Editor / SQL Editor / Database** などが並んでいる画面がダッシュボードです

---

## ステップ2: APIキー（URL と anon key）をコピーする

アプリが Supabase に接続するために必要な2つを取得します。

1. 左サイドバーで **「Project Settings」**（歯車アイコン）をクリック
2. 左メニューから **「API」** をクリック
3. 次の2つをメモ（あとで `.env.local` に貼ります）
   - **Project URL**  
     例: `https://abcdefghijk.supabase.co`
   - **Project API keys** のうち **「anon」「public」** と書いてあるキー  
     長い文字列（`eyJhbGciOi...` で始まる）

![場所のイメージ]
- Project URL → 「Configuration」の一番上
- anon key → 「Project API keys」の表の「anon public」の行の「Copy」でコピー

---

## ステップ3: テーブルを作る（SQL を実行）

データベースに「問題」「ゲーム」「参加者」「回答」のテーブルを作ります。

1. 左サイドバーで **「SQL Editor」** をクリック
2. **「New query」** をクリックして新しいクエリを開く
3. プロジェクトの **`supabase/schema.sql`** を開き、**中身をすべてコピー**
4. SQL Editor の入力欄に **貼り付け**
5. 右下の **「Run」**（または Ctrl+Enter / Cmd+Enter）をクリック
6. 成功すると「Success. No rows returned」のような表示になります

**注意:**  
「relation "games" does not exist」などと出た場合は、schema.sql の内容を**最初の行から最後まで**漏れなく貼れているか確認して、もう一度 Run してください。

---

## ステップ4: Realtime を有効にする（5人で状態を共有するため）

ゲームの状態（誰が参加したか・今何問目かなど）をリアルタイムで共有するために、`games` テーブルを Realtime の対象にします。

**※ ステップ3で `schema.sql` を最初から最後まで実行していれば、その中に `ALTER PUBLICATION supabase_realtime ADD TABLE games;` が含まれているので、すでに `games` は Realtime 対象になっています。その場合はこのステップは飛ばしてOKです。**

手動で確認・追加する場合：

1. 左サイドバーで **「Database」** をクリック
2. 左メニュー（Database の下）から **「Publications」** をクリック  
   ※「Replication」ではなく **Publications** です（Replication は別機能の読み取りレプリカ用の画面です）
3. 一覧に **「supabase_realtime」** という publication があるので、それをクリック
4. 対象テーブルに **「games」** が含まれていれば OK。含まれていなければ「Add table」などで `games` を追加して保存
5. `games` が Realtime の対象になっていれば完了です

---

## ステップ5: プロジェクトに環境変数を設定する

ファイブリーグの Next.js プロジェクトで、Supabase に繋ぐための設定をします。

1. プロジェクトのルート（`package.json` がある場所）に **`.env.local`** を作成
2. 次のように書きます（値はステップ2でコピーしたものに置き換え）

```env
NEXT_PUBLIC_SUPABASE_URL=https://あなたのプロジェクトID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...（anon public の長いキー）
```

- **NEXT_PUBLIC_SUPABASE_URL** = ステップ2の **Project URL**
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** = ステップ2の **anon public** キー

3. ファイルを保存

**重要:**  
- キーの前後に余計なスペースや改行を入れない  
- 値はダブルクォートで囲まなくてOK（`KEY=値` の形でよい）

---

## ステップ6: 動作確認

1. ターミナルで以下を実行してアプリを起動

```bash
cd "/Users/hiraharatakumi/Desktop/ファイブリーグ"
npm run dev
```

2. ブラウザで **http://localhost:3000** を開く  
3. **「部屋を作る」** をクリック  
4. ゲーム用のURL（例: `/game/abc12345`）に遷移し、参加画面（スロット・名前入力）が表示されれば、Supabase への接続は成功です。

---

## よくあること

- **「Invalid API key」**  
  `.env.local` の `NEXT_PUBLIC_SUPABASE_ANON_KEY` が間違っているか、コピーし損じていることが多いです。Supabase の Project Settings → API で anon key を再度コピーして貼り直してください。

- **「relation "xxx" does not exist」**  
  テーブルがまだできていません。ステップ3の SQL（`schema.sql` 全文）を再度 Run してください。

- **環境変数を変えたのに反映されない**  
  Next.js は起動時に環境変数を読むので、`.env.local` を変更したら **`npm run dev` を一度止めてから再度実行**してください。

---

ここまでできていれば、Supabase のセットアップは完了です。問題の追加やゲームの開始はアプリの画面から行えます。
