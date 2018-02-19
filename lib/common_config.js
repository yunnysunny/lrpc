const os = require('os');
const path = require('path');
const tmpDir = os.tmpDir();
const WIN_PIPE_PERFIX = '\\\\.\\pipe\\';
const DEFAULT_SOCKET_FILENAME = 'midway.sock';

const getSocketPath = exports.getSocketPath = function(filename=DEFAULT_SOCKET_FILENAME) {
  let sockPath = path.join(tmpDir, filename);

  if (process.platform === 'win32') {
      sockPath = sockPath.replace(/^\//, '');
      sockPath = sockPath.replace(/\//g, '-');
      sockPath = WIN_PIPE_PERFIX + sockPath;
  }
  return sockPath;
};

exports.getRandomSocketPath = function() {

};

exports.defaultSockPath = getSocketPath();
exports.EVENT_NEW_MESSAGE = 'eventNewMessage';
