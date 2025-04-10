'use strict';
const http = require('node:http');
const auth = require('http-auth');
//router モジュールを呼び出すオブジュクトを準備（相対パス）
const router = require('./lib/router');

const basic = auth.basic({
  realm: 'Enter username and password.',
  //ファイルの情報を利用して Basic 認証する場合の書き方
  file: './users.htpasswd'
});

const server = http.createServer(basic.check((req, res) => {
  //サーバにアクセスされた際、router モジュールの route メソッドを呼び出す
  router.route(req, res);
  }))
  .on('error', e => {
    console.error('Server Error', e);
  })
  .on('clientError', e => {
    console.error('Client Error', e);
  });

//サーバのポート番号を指定
  const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.info(`Listening on ${port}`);
});