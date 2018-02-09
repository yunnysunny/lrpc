'use strict';
const StringDecoder = require('string_decoder').StringDecoder;
const EventEmitter = require('events');

class Parser extends EventEmitter {
    constructor() {
        super();
        // this.decoder = new StringDecoder('utf8');
        // this.jsonBuffer = '';
        this._leftChars = 0;
        this._buffer = '';
        this._complete = false;
    }

    encode(message) {
        return JSON.stringify(message) + '\n';
    }
    _parse() {
        this._consume();
        const _this = this;
        setImmediate(function immediateCb() {
            _this._parse();
        });
    }
    _consume() {
        if (!this._buffer || this._buffer.length === 0) {
            return;//this is no data now
        }
        if (this._leftChars === 0) {

            const countPos = this._buffer.indexOf('\n');
            if (countPos  !== -1) {
                this._leftChars = this._buffer.slice(0,countPos-1);
                this._buffer = this._buffer.slice(countPos+1);
            } else {
                //maybe invalid format
            }
           
        } else {
            const bufLen = this._buffer.length;
            
        }
    }

    feed(buf) {
        // let jsonBuffer = this.jsonBuffer;
        // jsonBuffer += this.decoder.write(buf);
        // let i, start = 0;
        // while ((i = jsonBuffer.indexOf('\n', start)) >= 0) {
        //     const json = jsonBuffer.slice(start, i);
        //     const message = JSON.parse(json);
        //     this.emit('message', message);
        //     start = i + 1;
        // }
        // this.jsonBuffer = jsonBuffer.slice(start);
        this._buffer+=buf;
    }
}

module.exports = Parser;