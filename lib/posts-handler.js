'use strict';
const pug = require('pug');
const Cookies = require('cookies');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: [ 'query' ] });
const util = require('./handler-util');
const { currentThemeKey } = require('../config');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const relativeTime = require('dayjs/plugin/relativeTime');
require('dayjs/locale/ja');
dayjs.locale('ja');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.tz.setDefault('Asia/Tokyo');
const crypto = require('node:crypto');

//トークンをサーバーに保存するための連想配列を作成
const oneTimeTokenMap = new Map(); // キーをユーザ名、値をトークンとする連想配列

//公開するhandleメソッドを定義
async function handle(req, res) {
  //クッキーを取得するためのインスタンスを作成
  const cookies = new Cookies(req, res);
  //左側の式（cookies.get(currentThemeKey)）がnullまたはundefinedの場合、右側の値（'light'）が代入される
  const currentTheme = cookies.get(currentThemeKey) || 'light';
  //クッキーに 現在のテーマを保存
  //クッキーの有効期限を 30 日に設定
  const options = { maxAge: 30 * 86400 * 1000 };
  cookies.set(currentThemeKey, currentTheme, options);
  //req.methodに応じたメソッドの呼び出し処理
  switch (req.method) {
    case 'GET':
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      //データベースから post モデルのすべてのレコードが取得され、id フィールドを基準に降順で並べ替えられたリストが posts 変数に格納される
      const posts = await prisma.post.findMany({
        orderBy: {
          id: 'asc'
        }
      });
      posts.forEach((post) => {
        // post.content = post.content.replace(/\n/g, '<br>');
        post.relativeCreatedAt = dayjs(post.createdAt).tz().fromNow();
        post.absoluteCreatedAt = dayjs(post.createdAt).tz().format('YYYY年MM月DD日 HH時mm分ss秒');
      });
    
      // ワンタイムトークンをテンプレートに渡す処理]
      // crypto モジュールの randomBytes 関数は、推測されにくいランダムなバイト列を作成する関数で
      // それを toString('hex') で、16 進数にした文字列を取得
      // そのトークンを oneTimeTokenMap に保存
      const oneTimeToken = crypto.randomBytes(8).toString('hex');
      oneTimeTokenMap.set(req.user, oneTimeToken);
      res.end(pug.renderFile('./views/posts.pug', {
        currentTheme,
        posts,
        user: req.user,
        oneTimeToken
      }));
      console.info(
        `閲覧されました: user: ${req.user}, ` +
        `remoteAddress: ${req.socket.remoteAddress}, ` +
        `userAgent: ${req.headers['user-agent']} `
      );
      break;
    case 'POST':
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      }).on('end', async () => {
        const params = new URLSearchParams(body);
        const content = params.get('content');

        // 投稿されたときにワンタイムトークンを確認する処理
        const requestedOneTimeToken = params.get('oneTimeToken');
        if (!content) {
          handleRedirectPosts(req, res);
          return;
        }
        if (!requestedOneTimeToken) {
          util.handleBadRequest(req, res);
          return;
        }
        if (oneTimeTokenMap.get(req.user) !== requestedOneTimeToken) {
          util.handleBadRequest(req, res);
          return;
        }

        console.info(`送信されました: ${content}`);
        

        //Prismaを使用してデータベースに新しい投稿を作成
        //post モデルに新しいレコードを作成するメソッド
        //await この操作が非同期であることを示し、操作が完了するまで待機
        //postedBy：投稿を行ったユーザー。req.user：リクエストオブジェクトから取得したユーザー情報
        //content と postedBy の情報を持つ新しい投稿がデータベースに作成される

        await prisma.post.create({
          data: {
            content,
            postedBy: req.user
          }
        });
        oneTimeTokenMap.delete(req.user);
        handleRedirectPosts(req, res);
      });
      break;
    default:
        util.handleBadRequest(req, res);
      break;
  }
}

function handleRedirectPosts(req, res) {
  res.writeHead(303, {
    'Location': '/posts'
  });
  res.end();
}

function handleDelete(req, res) {
  switch (req.method) {
    case 'POST':
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      }).on('end', async () => {
        const params = new URLSearchParams(body);
        const id = parseInt(params.get('id'));
        // 投稿削除のときにワンタイムトークンを確認する処理
        const requestedOneTimeToken = params.get('oneTimeToken');
        if (!id) {
          util.handleBadRequest(req, res);
          return;
        }
        if (!requestedOneTimeToken) {
          util.handleBadRequest(req, res);
          return;
        }
        if (oneTimeTokenMap.get(req.user) !== requestedOneTimeToken) {
          util.handleBadRequest(req, res);
          return;
        }
        const post = await prisma.post.findUnique({
          where: { id }
        });
        if (req.user === post.postedBy || req.user === 'admin') {
          await prisma.post.delete({
            where: { id }
          });
          console.info(
            `削除されました: user: ${req.user}, ` +
              `remoteAddress: ${req.socket.remoteAddress}, ` +
              `userAgent: ${req.headers['user-agent']} `
          );
          oneTimeTokenMap.delete(req.user);
          handleRedirectPosts(req, res);
        }
      });
      break;
    default:
      util.handleBadRequest(req, res);
      break;
  }
}

//メソッドを外部公開
module.exports = {
  handle,
  handleDelete
};