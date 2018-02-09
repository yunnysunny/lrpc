const os = require('os');
const path = require('path');
const tmpDir = os.tmpDir();
const DEFAULT_SOCKET_FILENAME = 'midway.sock';
let sockPath = path.join(tmpDir, DEFAULT_SOCKET_FILENAME);

if (process.platform === 'win32') {
    sockPath = sockPath.replace(/^\//, '');
    sockPath = sockPath.replace(/\//g, '-');
    sockPath = '\\\\.\\pipe\\' + sockPath;
}
exports.defaultSockPath = sockPath;
exports.EVENT_NEW_MESSAGE = 'eventNewMessage';
