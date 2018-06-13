# exCall

簡単にいうと，EventEmitterを各クライアント間で共有するシステムです．

たとえば
- クライアントAで key: `message` でdata: `hello`をemitすると，
- もしクライアントBでkey: `message` をonしてたらdataを受け取れます．

IoTシステム，分散システムのプロトタイプに便利です．

ルーティングサーバが１つ必要です．webSocket通信やHTTP通信をルーティングします．

ルーティングサーバを外部に立てておけば，各クライアントはどこからでも共有イベントに参加できます．


### ルーティングサーバ

`node routing-server/index.js`

- デフォルトポート: 8080
- 外部URLにする場合は common/config/config.jsonに { "SERVER_URL": "〇〇" }というデータを作ってください．



## シンプルなコード例
- client-Aを実行した後に，clinet-Bを実行する．
- clinet-Bがmessageイベントを発火し，client-Aで受信します．
- イベントはHTTPリクエストによっても発火できます．
  - イベント名を`/`区切りで設計すると，HTTPリクエストとの相性が良いです．

#### client-A
~~~
let team = 'my' // teamごとにイベント共有が独立します．
const Ex = require('./client')(team)
Ex.local() // ローカルLANにサーバが立っている場合

// ルーティングサーバとWebSocketで接続します．
Ex.connect((ex) => {
    ex.on('message', (body) => {
        console.log(body) // { text: 'hello' }
    })
})

Ex.disconnect(() => { })

~~~


#### client-B
~~~
let team = 'my' // teamごとにイベント共有が独立します．
const Ex = require('./client')(team)
Ex.local() // ローカルLANにサーバが立っている場合

// ルーティングサーバとWebSocketで接続します．
Ex.connect((ex) => {
    ex.emit('message', {
          text: 'hello'
    })
})

Ex.disconnect(() => { })

~~~

#### HTTPリクエスト

`サーバのURL/[team名]/[key]`
- サーバのIP:8080/[team名]/message?text=hello



## コールバックありのコード例
- resolve, rejectの2パターンのコールバックが備わっています．
- コールバックをすると発火（emit）した相手が受け取れます．
- HTTPリクエストの場合，res.send()に対応します．


#### client-A
~~~
let team = 'my' // teamごとにイベント共有が独立します．
const Ex = require('./client')(team)
Ex.local() // ローカルLANにサーバが立っている場合

// ルーティングサーバとWebSocketで接続します．
Ex.connect((ex) => {
    ex.on('message', (body, resolve, reject) => {
        console.log(body) // { text: 'hello' }
        resolve('ok')
    })
})

Ex.disconnect(() => { })

~~~


#### client-B
~~~
let team = 'my' // teamごとにイベント共有が独立します．
const Ex = require('./client')(team)
Ex.local() // ローカルLANにサーバが立っている場合

// ルーティングサーバとWebSocketで接続します．
Ex.connect((ex) => {
    ex.emit('message', {
          text: 'hello'
    }, (res) => {
        console.log(res) // ok
    }, (err) => {
        console.log(err)
    })
})

Ex.disconnect(() => { })

~~~

#### HTTPリクエスト

`サーバのURL/[team名]/[key]`
- サーバのIP:8080/[team名]/message?text=hello
- client-Aから「ok」が返ってきます
