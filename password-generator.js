// パスワードの長さは 12 文字
// 英小文字と英大文字、数字の 3 種類を含む
'use strict';
const length = 12;
const charset =
  'abcdefghijklmnopqrstuvwxyz' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + '0123456789';

//パスワードを生成する関数 passwordGenerator を定義
//この関数は、指定された長さのランダムなパスワードを生成する
//charset からランダムに文字を選び、指定された長さのパスワードを生成する
function passwordGenerator() {
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  const includeAllTypes =
    /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password);
  return includeAllTypes ? password : passwordGenerator();
}

console.log(passwordGenerator());