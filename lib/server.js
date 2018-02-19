'use strict';
const fs = require('fs');
const net = require('net');
const slogger = require('node-slogger');
const EventEmitter = require('events');
const EventUtil = require('./event_util');
const Client = require('./client');

const {defaultSockPath,EVENT_NEW_MESSAGE} = require('./common_config');

class Server extends EventEmitter{
    constructor(options) {
        super();
        this.options = options;
        this.sockPath = options.sockPath ||  defaultSockPath;
        this.clients = new Map();
        this.server = net.createServer(this._handleConnection.bind(this));
        const _this = this;
        this.server.on('error', function(error) {
          _this.emit('error', error);
        });
        this.on(EVENT_NEW_MESSAGE, (message, reply, client) => {
          if (message && typeof message.action === 'string') {
            this.emit(message.action, message.data, reply, client);
          }
        });
        this._eventUtil = new EventUtil(this);
        this.listen();
      }
      ready(callback) {
        this._eventUtil.ready(callback);
      }
    
      listen(callback=function() {}) {
        const sockPath = this.sockPath;
        if (fs.existsSync(sockPath)) {
          try {
            fs.unlinkSync(sockPath);
          } catch (e) {
            slogger.error(e)
          }
          
        }
        this.server.listen(sockPath, () => {
          slogger.debug(`[server] pandora messenger server is listening, socket path is ${this.sockPath}!`);
          setImmediate(() => {
            this._eventUtil.setResult(true);
            
            callback();
            
          });
        });
        return this;
      }
    
      broadcast(action, data) {
        return this._broadcast({
          action: action,
          data: data,
        });
      }
    
      _broadcast(info) {
        if (this.clients.size === 0) {//尚未有客户端连接
          if (!this.pending) {
            this.pending = [];//初始化待发送数据
            this.on('connected', (client) => {
              this.pending.forEach((msg) => {
                client.send(msg.action, msg.data);
              });
            });
          }
          this.pending.push(info);//添加待发送数据
          return this;
        }
        for (const sock of this.clients.keys()) {
          this.clients.get(sock).send(info.action, info.data);
        }
        return this;
      }
    
      close(callback) {
        for (const sock of this.clients.keys()) {
          const client = this.clients.get(sock);
          client.close();
          this.clients.delete(sock);
        }
        this.server.removeAllListeners();
        this.server.close(callback);
        return this;
      }
    
      _handleMessage(message, reply, client) {
        this.emit(EVENT_NEW_MESSAGE, message, reply, client);
      }
    
      _handleDisconnect(socket) {
        slogger.debug(`[server] server lost a connection!`);
        const client = this.clients.get(socket);
        this.clients.delete(socket);
        this.emit('disconnected', client);
      }
    
      _handleConnection(socket) {
        slogger.debug(`[server] server got a connection!`);
        const client = new Client({
          socket: socket,
          name: this.options.name,
        });
        this.clients.set(socket, client);
        client.on(EVENT_NEW_MESSAGE, (message, reply) => {
          this._handleMessage(message, reply, client);
        });
        const _this = this;
        client.on('error', function(err) {
          _this._eventUtil.emitError(err);
        });
        socket.on('close', this._handleDisconnect.bind(this, socket));
        this.emit('connected', client);
      }
}

module.exports = Server;