'use strict';
const net = require('net');
const slogger = require('node-slogger');
// const Parser = require('./parser');
const EventEmitter = require('events');
const EventUtil = require('./event_util');
const {defaultSockPath,EVENT_NEW_MESSAGE} = require('./common_config');
/**
 * 0字节 option
 * 1-4 字节 msg_id
 * 5-8字节 消息长度
 */
const HEAD_LEN = 9;
const MAX_PACKET_ID = Math.pow(2, 30);
const defaultOptions = {
  noDelay: true,
  responseTimeout: 20000,
  reConnectTimes: 0,
  reConnectInterval: 1000,
};



class Client extends EventEmitter{
    constructor(options) {
      super();
      options = Object.assign({}, defaultOptions, options);
        
        this._unref = !!options.unref;
        this.socketPath = options.socketPath || defaultSockPath;
        if (options.socket) {
            this._socket = options.socket;
            this._bind();
        } else {
            this._connect();
        }
        this.options = options;
        this._queue = [];
        this._header = null;
        this._bodyLength = null;
        this._packetId = 0;
        this._eventUtil = new EventUtil(this);
        this.on(EVENT_NEW_MESSAGE, (message, reply, client) => {
          if (message && typeof message.action === 'string') {
            this.emit(message.action, message.data, reply, client);
          }
        });
    }
    ready(callback) {
      this._eventUtil.ready(callback);
    }
    /**
   * 从socket缓冲区中读取n个buffer
   * @param {Number} n - buffer长度
   * @return {Buffer} - 读取到的buffer
   */
  read(n) {
    return this._socket.read(n);
  }
    /**
   * 读取 packet 的头部
   * @return {Buffer} header
   */
  getHeader() {
    return this.read(HEAD_LEN);
  }

  getBodyLength(header) {
    return header.readInt32BE(5);
  }

  createPacketId() {
    this._packetId += 1;
    if (this._packetId >= MAX_PACKET_ID) {
      this._packetId = 1;
    }
    return this._packetId;
  }

  /**
   * 反序列化
   * @param {Buffer} buf - 二进制数据
   * @return {{oneway,isResponse,id,data}} 对象
   */
  decode(buf, header) {
    const first = header.readUInt8(0);
    const id = header.readUInt32BE(1);
    let data;
    if (buf) {
      data = JSON.parse(buf);
    }

    return {
      oneway: !!(first & 0x80),//是否单向
      isResponse: !(first & 0x40),//是否是响应
      id,//消息id
      data,//消息数据
    };
  }

  /**
   * 序列化消息
   * @param {Buffer} buf - 二进制数据
   * @return {Object} 对象
   */
  encode(message) {
    /*
     *  header 8byte
     * 1byte 8bit用于布尔判断 是否双向通信|响应还是请求|后面6bit保留
     * 4byte packetId 包id最大4位
     * 4byte 消息长度 最大长度不要超过4个字节
     * body
     * nbyte 消息内容
     * */
    let first = 0;
    if (message.oneway) {
      first = first | 0x80;
    }
    if (message.isResponse === false) {
      first = first | 0x40;
    }
    const header = new Buffer(9);
    const data = JSON.stringify(message.data/*, replaceErrors*/);
    const body = new Buffer(data);
    header.fill(0);
    header.writeUInt8(first, 0);
    header.writeUInt32BE(message.id, 1);
    header.writeUInt32BE(Buffer.byteLength(data), 5);
    return Buffer.concat([header, body]);
  }
    // 读取服务器端数据，反序列化成对象
  _readPacket() {
    if (!(this._bodyLength)) {
      this._header = this.getHeader();
      if (!this._header) {
        return false;
      }
      // 通过头部信息获得body的长度
      this._bodyLength = this.getBodyLength(this._header);
    }

    let body;
    // body 可能为空
    if (this._bodyLength > 0) {
      body = this.read(this._bodyLength);
      if (!body) {
        return false;
      }
    }
    this._bodyLength = null;
    let entity = this.decode(body, this._header);
    setImmediate(() => {
      this.emit(EVENT_NEW_MESSAGE, entity.data, (res) => {
        const id = entity.id;
        this.send(`response_callback_${id}`, res);
      });
    });
    return true;
  }

  /**
   * 连接是否正常
   * @property {Boolean} TCPBase#isOK
   */
  get isOK() {
    return this._socket && this._socket.writable;
  }

  send(action, data, callback=function(){}, timeout=0) {
    return this._send({
      timeout,
      data: {
        action,
        data,
      },
    }, callback);
  }

  /**
   * 发送数据
   * @param {Object} packet
   *   - {Number} id - packet id
   *   - {Buffer} data - 发送的二进制数据
   *   - {Boolean} [oneway] - 是否单向
   *   - {Number} [timeout] - 请求超时时长
   * @param {Function} [callback] - 回调函数，可选
   * @return {void}
   */
  _send(packet, callback) {
    // 如果有设置并发，不应该再写入，等待正在处理的请求已完成；或者当前没有可用的socket，等待重新连接后再继续send
    if (!this.isOK) {
      this._queue.push([packet, callback]);
      // 如果设置重连的话还有可能挽回这些请求
      if (!this._socket && !this._reConnectTimes) {
        this._cleanQueue();
      }
      return;
    }

    packet.id = this.createPacketId();
    if (callback) {
      const timeout = packet.timeout || this.options.responseTimeout;
      const callbackEvent = `response_callback_${packet.id}`;
      const timer = setTimeout(() => {
        this.removeAllListeners(callbackEvent);
        const err = new Error(`target no response in ${timeout}ms`);
        err.name = 'MessengerRequestTimeoutError';
        callback(err);
      }, timeout);
      this.once(callbackEvent, (message) => {
        clearTimeout(timer);
        callback(null, message);
      });
    }

    this._socket.write(this.encode(packet));
    this._resume();
  }

  // 清理未发出的请求
  _cleanQueue() {
    this._queue = [];
  }

  // 缓冲区空闲，重新尝试写入
  _resume() {
    let args = this._queue.shift();
    if (args) {
      this._send(args[0], args[1]);
    }
  }

  /**
   * 主动关闭连接
   * @return {void}
   */
  close() {
    this._reConnectTimes = 0;
    this._close();
  }

  /**
   * 关闭连接
   * @param {Error} err - 导致关闭连接的异常
   * @return {void}
   */
  _close(err) {
    if (!this._socket) {
      return;
    }
    this._socket.destroy();
    this._handleClose(err);
  }

  _handleClose(err) {
    if (!this._socket) {
      return;
    }

    this._socket.removeAllListeners();
    this._socket = null;

    if (err) {
      this._eventUtil.emitError(err);
    }

    // 自动重连接
    if (this._reConnectTimes && (this._eventUtil.getReadyState()/*之前成功过*/ || this.options.reConnectAtFirstTime)) {
      const timer = setTimeout(() => {
        this._reConnectTimes--;
        this._connect(() => {
          // 连接成功后重新设置可重连次数
          this._reConnectTimes = this.options.reConnectTimes;
          // 继续处理由于socket断开遗留的请求
          slogger.debug('[client] reconnected to the server, process pid is %s', process.pid);
        });
      }, this.options.reConnectInterval);
      if(this.shouldUnref) {
        (timer).unref();
      }
      return;
    }
    this._cleanQueue();
    // 触发 close 事件，告诉使用者连接被关闭了，需要重新处理
    this.emit('close');
    this.removeAllListeners();
  }

  // 连接
  _connect(done) {
    this._socket = net.connect(this.socketPath);
    this._socket.once('connect', () => {
      this._eventUtil.setResult(true);
      done && done();
      if(this.shouldUnref) {
        this._socket.unref();
      }
      this._resume();
      this.emit('connect');
    });
    this._bind();
  }

    _bind() {
        // const parser = new Parser();
        const socket = this._socket;

        socket.on('readable', () => {
            try {
                // 在这里循环读，避免在 _readPacket 里嵌套调用，导致调用栈过长
                let remaining = false;
                do {
                    remaining = this._readPacket();
                }
                while (remaining);
            } catch (err) {
                slogger.error('',err);
                err.name = 'PacketParsedError';
                this._close(err);
            }
        });
    
        socket.once('close', () => this._handleClose());
        socket.once('error', err => {
            this._close(err);
        });
    }


}

module.exports = Client;