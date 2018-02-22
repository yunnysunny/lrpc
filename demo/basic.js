const assert = require('assert');
const {Server,Client,util} = require('../index');
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