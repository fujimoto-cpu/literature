# Literature Notes - Source Files

Quartz (v4) ベースの LiteratureNote リーダーのカスタムファイル。
`/private/tmp/quartz-literature/` で消失しても、ここから復元できる。

## 復元手順

```bash
# 1. Quartzをクローン
cd /private/tmp
git clone https://github.com/jackyzha0/quartz.git quartz-literature
cd quartz-literature && npm install

# 2. カスタムファイルを上書きコピー
# このリポのmainブランチからファイルを取得して配置:
#   build-index.mjs        → /private/tmp/quartz-literature/
#   index-template.html    → /private/tmp/quartz-literature/
#   filter-recent.mjs      → /private/tmp/quartz-literature/
#   quartz.config.ts       → /private/tmp/quartz-literature/
#   quartz/static/literature-ui.js   → quartz/static/
#   quartz/styles/custom.scss        → quartz/styles/
#   quartz/components/Head.tsx       → quartz/components/

# 3. LiteratureNote をコピー
mkdir -p content/thumbs
cp "/Users/yuriko/Documents/corin/20_📂 zettelkasten/LiteratureNote/"*.md content/

# 4. ビルド & デプロイ
npx quartz build
node build-index.mjs
cp quartz/static/literature-ui.js public/static/literature-ui.js
cd public && rm -rf .git && git init && git checkout -b gh-pages
git remote add origin https://github.com/fujimoto-cpu/literature.git
gh auth setup-git && git add -A && git commit -m "update"
git push -u origin gh-pages --force
```

## ファイル説明

| ファイル | 役割 |
|---------|------|
| `build-index.mjs` | MDからarticles.json生成 → index.html + literature-ui.jsに埋め込み |
| `index-template.html` | Instagram風グリッドTOPページのテンプレート |
| `filter-recent.mjs` | 日付フィルタ（直近N日のみ残す） |
| `quartz.config.ts` | Quartz設定（日本語・ピンク系カラー・SPA有効） |
| `quartz/static/literature-ui.js` | 記事ページの動的UI（戻るボタン・サムネ・マーク） |
| `quartz/styles/custom.scss` | 記事ページ用カスタムCSS |
| `quartz/components/Head.tsx` | noindex + literature-ui.js読み込み |
