const {EVENT_NEW_MESSAGE} = require('./common_util');
/**
 * @function ResponseFunction
 * 
 * 消息处理完成之后的回调函数
 * 
 * @param {Object} res
 */

/**
 * @function NewMessageEventCallback
 * 
 * 事件 EVENT_NEW_MESSAGE 的回调函数
 * 
 * {Object} message  消息内容，
 * {ResponseFunction} replay 消息回调
 * {Client} client 当前客户端
 */
/**
 * @function ReadyCallback
 * 
 * `eventObj` 初始化完成的回调函数
 * 
 * @param {Error=} err
 */

/**
 * 事件辅助处理类，在 `eventObj` 收到 `EVENT_NEW_MESSAGE` 事件后，会从收到的数据级联触发 {Client~SendPacket.data.action} 事件，具体参见 #_addEvent函数
 */
class EventUtil {
    /**
     * 
     * @param {EventEmitter} eventObj 
     */
    constructor(eventObj) {
        this.eventObj = eventObj;
        this._readyState = false;
        this._readyCallback = [];
        this._addEvent();
    }
    _addEvent() {
        const eventObj = this.eventObj;
        /**
         * @param {String} `EVENT_NEW_MESSAGE`
         * @param {NewMessageEventCallback} newMessageCallback
         */
        eventObj.on(EVENT_NEW_MESSAGE, function newMessageCallback(message, reply, client) {
          if (message && typeof message.action === 'string') {
            eventObj.emit(message.action, message.data, reply, client);
          }
        });
    }
    /**
     * 设置 eventObj 初始化状态
     * @param {Error|Boolean} result 如果 result 是Error类型，则代表当前 eventObj 初始化失败；如果为Boolean类型，则为false时代表初始化失败，函数内部会依次调用 _readyCallback 中的回调函数
     */
    setResult(result) {
        let err = false;

        if (typeof(result) === 'boolean') {
            err =   !result;
            this._readyState = result;
        } else {
            this._readyState = false;
        }

        const callbacks = this._readyCallback;
        setImmediate(function doReadyCallbacks() {
            for(var i=0,len=callbacks.length;i<len;i++) {
                callbacks[i](err);
            }
        });
        
    }
    /**
     * 添加一个初始化完成的回调函数
     * 
     * @param {ReadyCallback} callback 
     */
    ready(callback) {
        if (typeof(callback) === 'function') {
            this._readyCallback.push(callback);
        }
    }
    /**
     * 获取当前的初始化状态
     * @returns {Boolean}
     */
    getReadyState() {
        return this._readyState;
    }
    /**
     * 触发 `eventObj` 的 error 事件
     * @param {*} err 
     */
    emitError(err) {
        this.eventObj.emit('error',err);
    }
};

module.exports = EventUtil;