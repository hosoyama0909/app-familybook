# main — マイアプリ母艦リポジトリ

家族向け・個人向けの小さなWebアプリをためていく母艦リポジトリです。

## 構成

```
index.html          アプリ一覧ランチャー（全アプリの入口）
CLAUDE.md           開発ルール・フォルダ構成・プロフィール（Claude Code用の取扱説明書）
apps/               アプリ本体（1アプリ = 1フォルダ）
  odekake/          家族おでかけアプリ
  _template/        新規アプリの雛形（コピー元）
.github/workflows/  GitHub Pages 公開の自動化
```

## 新しいアプリを作る

`apps/_template/` をコピーして `apps/<アプリ名>/` を作り、実装後にランチャー
（`index.html`）へカードを追加します。詳しくは [CLAUDE.md](./CLAUDE.md) を参照。

## 公開（GitHub Pages）

`main` ブランチへのプッシュで自動公開されます（要 Settings > Pages の設定）。
Private リポジトリでの公開には有料プランが必要な場合があります。
