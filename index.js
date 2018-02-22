'use strict';
const Client = require('./lib/Client');
const Server = require('./lib/Server');
const assert = require('assert');
const util =require('./lib/common_util');

const Clients = new Map();
const Servers = new Map();

function factory(options, type) {
  assert(options.name, 'options.name is required');
  const isClient = type === 'client';
  const MessengerClass = isClient ? Client : Server;
  const key = options.name;
  const pool =  isClient ? Clients : Servers;
  if (!pool[key]) {
    pool[key] = new MessengerClass(options);
  }
  return pool[key];
}


// export {default as MessengerClient} from './client';
// export {default as MessengerServer} from './server';

module.exports =  {
  util,
  // EVENT_NEW_MESSAGE,
  Client,
  Server,
  getClient(options) {
    options = Object.assign({reConnectTimes: 10}, options);
    return factory(options, 'client');
  },

  getServer(options) {
    return factory(options, 'server');
  }
};