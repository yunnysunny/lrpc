const os = require('os');
const path = require('path');
const tmpDir = os.tmpDir();
const WIN_PIPE_PERFIX = '\\\\.\\pipe\\';
const DEFAULT_SOCKET_FILENAME = 'midway.sock';
var STR_RAND = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const getSocketPath = exports.getSocketPath = function(filename=DEFAULT_SOCKET_FILENAME) {
  let sockPath = path.join(tmpDir, filename);

  if (process.platform === 'win32') {
      sockPath = sockPath.replace(/^\//, '');
      sockPath = sockPath.replace(/\//g, '-');
      sockPath = WIN_PIPE_PERFIX + sockPath;
  }
  return sockPath;
};

function randomStr(len) {
  len = len || 4;
  var resultStr = '';
  var length = STR_RAND.length;
  var random = null;
  for (var i = 0; i < len; i++) {
      random = Math.floor(Math.random() * length);
      resultStr += STR_RAND.substring(random - 1, random);
  }
  return resultStr;
}

exports.getRandomSocketPath = function() {
  return getSocketPath(randomStr());
};

exports.defaultSockPath = getSocketPath();
exports.EVENT_NEW_MESSAGE = 'eventNewMessage';
