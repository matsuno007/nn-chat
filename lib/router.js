'use strict';
//posts-handler モジュールを呼び出すオブジュクトの準備(相対パス)
const postsHandler = require('./posts-handler');
//./handler-util モジュールを読み込む
const util = require('./handler-util');

//公開する route メソッドを定義
function route(req, res) {
  //リクエストのメソッドが POST の場合、Content-Type ヘッダを確認
  if (process.env.RENDER && req.headers['x-forwarded-proto'] === 'http') {
    util.handleNotFound(req, res);
  }
  //req.urlに応じたメソッドの呼び出し処理
  switch (req.url) {
    case '/posts':
      postsHandler.handle(req, res);
      break;
    case '/posts/delete':
      postsHandler.handleDelete(req, res);
      break;
    case '/logout':
      util.handleLogout(req, res);
      break;
    case '/changeTheme':
      util.handleChangeTheme(req, res);
      break;
    //favicon.ico にリクエストがされた際は、この後に実装する handleFavicon 関数を呼び出す
    case '/favicon.ico':
      util.handleFavicon(req, res);
      break;
    //style.css にリクエストがされた際は、この後に実装する handleStyleCssFile 関数を呼び出す
    case '/style.css':
      util.handleStyleCssFile(req, res);
      break;
    case '/nn-chat.js':
      util.handleNnChatJsFile(req, res);
      break;
    default:
      util.handleNotFound(req, res);
      break;
  }
}

//メソッドを外部公開
module.exports = {
  route
};