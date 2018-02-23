# lrpc
项目源码摘自淘宝开源项目 [pandora](https://github.com/midwayjs/pandora) ，pandora 是一个淘宝开源的进程管理工具，里面进程间通信的模块很具有参考意义，所以将其单独分离出来做成一个项目。

## 安装

npm install lrpc --save

## 使用示例

### 服务器端广播数据
```javascript
const assert = require('assert');
const {Server,Client,util} = require('lrpc');
const msg = {
    name: 'midway-messenger',
};
const action = 'midway-messenger-action';
const sockPath = util.getRandomSocketPath();
const server = new Server({sockPath});//直接使用在外部指定的socket地址
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

### 客户端远程请求服务器端

```javascript
const name = 'req-res-demo';
const {Server,Client} = require('../index');
const ACTION_CALC = 'actionCalc';
//服务器端代码
const server = new Server({//在内部使用 `name` 字段拼接 socket 地址
    name,
});

server.ready((err) => {
    if (err) {
        return console.error(err);
    }
    console.log('服务端创建成功');
});
server.on(ACTION_CALC,function(message,reply) {
    reply(message.a + message.b);
});
//客户端代码
const client = new Client({
    name,
});
client.ready(function(err) {
    if (err) {
        return console.error(err);
    }
    console.log('客户端创建成功');
});
client.send(ACTION_CALC,{a:1,b:2},function(err,res) {
    console.log('服务端返回数据',res);
});
```

## 在线文档

参见 [这里](https://doclets.io/yunnysunny/lrpc/master)

## 协议

[MIT](LICENSE)