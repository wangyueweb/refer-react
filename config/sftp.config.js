var Client = require('ssh2').Client;
var fs = require('fs');
var env = require('../sftp.env.config');
var conn = new Client();
var files = [];
var doCount = 0;

function getFilesSync(dir, sftp) {
  dir = dir + '/';
  let res = fs.readdirSync(dir);
  let remoteDir = env.path + dir;
  sftp.mkdir(remoteDir);
  res.forEach(item => {
    let file = dir + item;
    if (fs.statSync(file).isFile()) {
      files.push({ local: file, remote: remoteDir + item });
    } else {
      getFilesSync(file, sftp);
    }
  });
}

let dir = 'dist';

conn
  .on('ready', function() {
    conn.sftp(function(err, sftp) {
      getFilesSync(dir, sftp);
      let len = files.length;
      files.forEach(item => {
        sftp.fastPut(item.local, item.remote, '', () => {
          doCount += 1;
          if (len === doCount) {
            conn.end();
          }
        });
      });
    });
  })
  .connect(env.config);
