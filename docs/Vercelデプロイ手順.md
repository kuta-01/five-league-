# Vercel で公開する手順（1から）

ファイブリーグを Vercel にデプロイして、URL で誰でもアクセスできるようにします。**無料**で公開できます。

---

## 前提

- ローカルで `npm run dev` が動いていること
- Supabase の設定（`.env.local` の URL と anon key）ができていること
- **GitHub アカウント**があること（まだの場合は [github.com](https://github.com) で作成）

---

## ステップ1: プロジェクトを GitHub に上げる

Vercel は「GitHub のリポジトリ」からデプロイするのがいちばん簡単です。

### 1-1. Git が入っているか確認

ターミナルで:

```bash
git --version
```

バージョンが出れば OK。入っていない場合は [git-scm.com](https://git-scm.com/) からインストール。

### 1-2. GitHub で新しいリポジトリを作る

1. [github.com](https://github.com) にログイン
2. 右上の **「+」** → **「New repository」**
3. **Repository name**: 例 `five-league` や `ファイブリーグ`（英語推奨: `five-league`）
4. **Public** を選択
5. **「Create repository」** をクリック
6. 次の画面の **「…or push an existing repository from the command line」** のところに表示されるコマンドをあとで使います（まだ実行しない）

### 1-3. プロジェクトで Git を初期化してプッシュ

ターミナルで、**プロジェクトのフォルダ**に移動してから:

```bash
cd "/Users/hiraharatakumi/Desktop/ファイブリーグ"
git init
git add .
git commit -m "Initial commit: ファイブリーグ"
```

次に、GitHub のリポジトリを「リモート」として追加します。  
**「YOUR_USERNAME」と「YOUR_REPO」は、あなたが作ったリポジトリの名前に置き換えてください。**

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

GitHub のユーザー名・パスワード（または Personal Access Token）を聞かれたら入力します。  
これで、コードが GitHub にアップロードされています。

---

## ステップ2: Vercel アカウントを作る

1. [vercel.com](https://vercel.com) を開く
2. **「Sign Up」** をクリック
3. **「Continue with GitHub」** を選ぶ
4. GitHub の認証画面で **「Authorize Vercel」** を許可する  
   → Vercel のダッシュボード（トップ）が開けば OK

---

## ステップ3: プロジェクトを Vercel に追加する

1. Vercel のダッシュボードで **「Add New…」** → **「Project」** をクリック
2. **「Import Git Repository」** の一覧に、さきほどプッシュしたリポジトリが出るので、その横の **「Import」** をクリック
3. リポジトリ名が表示されたら、そのまま **「Import」** を押して進む

---

## ステップ4: 環境変数を設定する

「Configure Project」の画面になったら、**Environment Variables** のところで次を追加します。

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase の Project URL（`.env.local` と同じ値） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon public キー（`.env.local` と同じ値） |

1. **Key** に `NEXT_PUBLIC_SUPABASE_URL` と入力
2. **Value** に Supabase の URL を貼り付け（例: `https://xxxxx.supabase.co`）
3. **「Add」** または **「Add Another」** で追加
4. 同様に **Key** に `NEXT_PUBLIC_SUPABASE_ANON_KEY`、**Value** に anon キーを貼り付けて追加

**.env.local を開いてコピーしても大丈夫です。** 本番用に別の Supabase プロジェクトを使う場合は、その URL とキーを入れます。

---

## ステップ5: デプロイする

1. 環境変数を追加したら、下の **「Deploy」** をクリック
2. ビルドが始まります（1〜3 分ほどかかることがあります）
3. 完了すると **「Congratulations!」** のような画面になり、**あなたのサイトの URL**（例: `https://five-league-xxx.vercel.app`）が表示されます
4. その URL をクリックして、ファイブリーグのトップが表示されれば成功です

---

## ステップ6: 動作確認

1. 表示された URL で **「部屋を作る」** を押す
2. ゲームURLに遷移し、参加画面（スロット・名前入力）が出るか確認
3. 別タブで `?rejoin=1` を付けたURLを開き、別のスロットで参加できるか確認

Supabase の **Project URL** が `localhost` ではなく **本番の Supabase の URL** になっていれば、同じ Supabase のデータ（問題・ゲーム）がそのまま使われます。

---

## よくあること

- **「Build Failed」**  
  - ログを開いてエラー内容を確認。  
  - Node のバージョンは Vercel が自動で合わせるので、多くの場合は **環境変数の typo** や **Supabase の URL/キー未設定** が原因です。Environment Variables をもう一度確認してください。

- **「Invalid API key」**  
  - 本番で使っている **NEXT_PUBLIC_SUPABASE_ANON_KEY** が、Supabase の **anon public** キーと一致しているか確認。  
  - 前後にスペースが入っていないか、コピーもれがないかも確認してください。

- **URL を変えたい**  
  - 無料プランでは `プロジェクト名.vercel.app` になります。  
  - プロジェクト名は **Settings → General → Project Name** で変更できます。  
  - 自分用のドメイン（例: `fiveleague.example.com`）を付けたい場合は、**Settings → Domains** で追加できます（ドメインの設定は別途必要です）。

- **コードを更新したら**  
  - GitHub に `git add .` → `git commit -m "メッセージ"` → `git push` すると、Vercel が自動で再デプロイします。

---

## まとめ

1. プロジェクトを GitHub にプッシュ  
2. Vercel で GitHub と連携して「Import」  
3. `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定  
4. **Deploy** で公開完了  

ここまでできれば、共有した URL だけでファイブリーグを遊べる状態になっています。
