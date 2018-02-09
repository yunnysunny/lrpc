class EventUtil {
    constructor(eventObj) {
        this.eventObj = eventObj;
        this._readyState = false;
        this._readyCallback = [];
    }
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
    ready(callback) {
        if (typeof(callback) === 'function') {
            this._readyCallback.push(callback);
        }
    }
    getReadyState() {
        return this._readyState;
    }
    emitError(err) {
        this.eventObj.emit('error',err);
    }
};

module.exports = EventUtil;