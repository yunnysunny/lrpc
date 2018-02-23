const name = 'req-res-demo';
const {Server,Client} = require('../index');
const ACTION_CALC = 'actionCalc';
//服务器端代码
const server = new Server({
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