# lrpc
项目源码摘自淘宝开源项目 [pandora](https://github.com/midwayjs/pandora) ，pandora 是一个淘宝开源的进程管理工具，里面进程间通信的模块很具有参考意义，所以将其单独分离出来做成一个项目。

## 安装

npm install lrpc --save

## 使用示例

```javascript
const assert = require('assert');
const {Server,Client,util} = require('lrpc');
const msg = {
    name: 'midway-messenger',
};
const action = 'midway-messenger-action';
const sockPath = util.getRandomSocketPath();
const server = new Server({sockPath});
const client = new Client({sockPath});
new Promise(function(resolve) {
    client.ready(function() {
        resolve(client);
    });
}).then(function() {
    server.broadcast(action, msg);
    return new Promise(function(resolve) {
        client.on(action, (message) => {
            assert(message.name === msg.name);
            resolve();
        });
    });
}).then(function() {
    console.info('成功');
    assert(true);
}).catch(function() {
    assert(false);
});
```

## 在线文档

参见 [这里](https://doclets.io/yunnysunny/lrpc)

## 协议

[MIT](LICENSE)