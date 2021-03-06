const messenger = require('../index');
const {getRandomSocketPath} = messenger.util;
const assert = require('assert');
const Client = messenger.Client;
const Server = messenger.Server;
const sockPath = getRandomSocketPath();
describe('test/server.test.js', () => {
  const name = 'midway-messenger';

  const msg = {
    name: name,
  };
  const action = 'midway-messenger-action';
  let server;

  before(function (done) {
    server = new Server({
      name,sockPath
    });
    server.ready(done);
  });

  after(() => {
    server.close();
  });

  it('should server broadcast message ok', function (done) {

    let count = 3;

    function getClient() {
      const client = new Client({
        name,sockPath
      });
      return new Promise((resolve) => {
        client.ready(() => {
          resolve(client);
        });
      });
    }

    function getClients() {
      const clients = [];
      for (let i = 0; i < count; i++) {
        clients.push(getClient());
      }
      return clients;
    }

    Promise.all(getClients())
      .then((clients) => {
        process.nextTick(() => {
          server.broadcast(action, msg);
        });

        return Promise.all(clients.map((client) => {

          return new Promise((resolve) => {
            client.on(action, (message) => {
              assert(message.name === msg.name);
              resolve();
            });
          });

        }));
      })
      .then(() => {
        done();
      })
      .catch(() => {
        assert(false);
      });
  });

  it('should server broadcast message ok before any clients connected', function (done) {
    const name = 'test_messenger';
    const sockPath = getRandomSocketPath();
    this.timeout(5 * 1000);
    const server = new Server({
      name,sockPath
    });
    const messageCount = 3;

    for (let i = 0; i < messageCount; i++) {
      server.broadcast(action, msg);
    }

    let count = 3;

    function getClient() {
      const client = new Client({
        name: name,sockPath
      });
      return new Promise((resolve) => {
        client.ready(() => {
          resolve(client);
        });
      });
    }

    function getClients() {
      const clients = [];
      for (let i = 0; i < count; i++) {
        clients.push(getClient());
      }
      return clients;
    }

    Promise.all(getClients())
      .then((clients) => {
        return Promise.all(clients.map((client) => {

          return new Promise((resolve) => {
            let count = messageCount;
            client.on(action, (message) => {
              assert(message.name === msg.name);
              count--;
              if (count === 0) {
                resolve();
              }
            });
          });

        }));
      })
      .then(() => {
        done();
        
      })
      .catch(() => {
        assert(false);
      });
  });


  it('should server handle client callback ok', function (done) {
    const action = 'callback_test';
    const action1 = 'callback_test1';
    // const sockPath = getRandomSocketPath();
    const data = {
      name: 'message_data',
    };
    const client = new Client({
      name: name,sockPath
    });

    server.once(action, (message, reply, cli) => {
      cli.send(action1, data, (err, res) => {
        assert(res.name === data.name);
        done();
      });
    });

    client.once(action1, (msg, reply) => {
      reply(msg);
    });

    client.ready(() => {
      client.send(action, data);
    });

  });

  it('should server handle client disconnect ok', function (done) {

    const client = new Client({
      name: name,sockPath
    });

    server.once('disconnected', () => {
      done();
    });

    client.ready(() => {
      setTimeout(function() {
        client.close();
      },0);
      
    });

  });

  it('should a client reconnect server when server restarted', function (done) {

    const client = new Client({
      name,sockPath
    });

    client.on(action, (message) => {
      assert(message.name === msg.name);
      done();
    });

    function restart() {
      server.broadcast(action, msg);
    }

    client.ready(() => {
      server.server.unref();
      process.nextTick(restart);
    });

  });

});