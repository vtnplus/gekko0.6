var _ = require('lodash');
var mysql = require('mysql2');

var util = require('../../core/util.js');
var log = require('../../core/log');
var config = require('../../core/util.js').getConfig();
let pool = undefined;
var Handle = function() {

  this.config = config;

  // verify the correct dependencies are installed
  var pluginHelper = require('../../core/pluginUtil');
  var pluginMock = {
    slug: 'mysql adapter',
    dependencies: config.mysql.dependencies
  };

  var cannotLoad = pluginHelper.cannotLoad(pluginMock);
  if(cannotLoad){
    util.die(cannotLoad);
  }
}

Handle.prototype.getConnection = function () {
  const config = this.config;

  if (pool){
    return pool;
  }else{
    pool = mysql.createPool({
      connectionLimit : 10,
      host: config.mysql.host,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
    });
  }

  // Check if we could connect to the db
  pool.promise().getConnection().then((connection) =>{
    log.debug("Verified MySQL setup: connection possible");
    connection.release();
  }).catch(util.die);

  pool.on('error', function(err) {
    log.error(err);
  });

  return pool;
}

module.exports = Handle;
