// lib/posts-handler.js
// posts のリクエストを処理する

'use strict';
const fs = require('node:fs');
const Cookies = require('cookies');
const { currentThemeKey } = require('../config');

//ステータスコード 401 - Unauthorized を返して、テキストをレスポンスに書き込む
function handleLogout(req, res) {
  res.writeHead(401, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.end(
    `<!DOCTYPE html><html lang="ja">
        <body>
            <h1>ログアウトしました</h1>
            <a href="/posts">ログイン</a>
        </body>
    </html>`
  );
}
//テーマを切り替える handleChangeTheme 関数を定義
function handleChangeTheme(req, res) {
  const cookies = new Cookies(req, res);
  //クッキーの current_theme の値が light であれば dark に、そうでなければ light に変更する
  const currentTheme = (cookies.get(currentThemeKey) !== 'light' ? 'light' : 'dark');
  cookies.set(currentThemeKey, currentTheme);
  //クッキーの current_theme の値を変更した後、/posts にリダイレクトする
  res.writeHead(303, {
    'Location': '/posts'
  });
  res.end();
}

//ファイルを 604800 秒 = 7 日間ブラウザ側で保存しておき、その期間に再びアクセスされた場合はブラウザ側のキャッシュファイルを参照する
//Web サイトを次に開いた際サーバ側へ問い合わせる必要がなくなるため、Web サイトをより高速に読み込むことができる
//基本的に中身を変更しないファイル（静的ファイル） に限定するのがよい
function handleFavicon(req, res) {
  res.writeHead(200, {
    'Content-Type': 'image/vnd.microsoft.icon',
    'Cache-Control': 'public, max-age=604800'
  });
  const favicon = fs.readFileSync('./favicon.ico');
  res.end(favicon);
}

function handleStyleCssFile(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/css',
  });
  const file = fs.readFileSync('./stylesheets/style.css');
  res.end(file);
}

function handleNnChatJsFile(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/javascript',
  });
  const file = fs.readFileSync('./public/nn-chat.js');
  res.end(file);
}


//ステータスコード 404 - Not Found を返して、テキストをレスポンスに書き込む
function handleNotFound(req, res) {
  // 指定した URL のページが存在しないときに、チャットへのリンクが表示されるようになっている
  res.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8'
  });
  res.write('<p>ページがみつかりません</p>');
  res.write('<p><a href="/posts">NNチャット</a></p>');
  res.end();
}

function handleBadRequest(req, res) {
  res.writeHead(400, {
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('未対応のリクエストです');
}


module.exports = {
  handleLogout,
  handleChangeTheme,
  handleFavicon,
  handleStyleCssFile,
  handleNnChatJsFile,
  handleNotFound,
  handleBadRequest
};

