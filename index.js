'use strict';
const Client = require('./lib/client');
const Server = require('./lib/server');
const assert = require('assert');
const {EVENT_NEW_MESSAGE} =require('./lib/common_config');

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
  EVENT_NEW_MESSAGE,
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