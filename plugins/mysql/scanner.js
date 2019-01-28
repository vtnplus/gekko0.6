const _ = require('lodash');
const async = require('async');
var Handle = require('./handle');

var Scanner = function(config){
  this.config = config;
  const handle = new Handle(this.config);
  this.db = handle.getConnection();
}

Scanner.prototype.scan = function (done) {
  let markets = [];

  var sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = '" + this.config.mysql.database + "'";

  var query = this.db.query(sql, function(err, result) {
      if(err) {
        util.die("DB error while scanning tables: " + err);
      }

      async.each(result, (table, next) => {

        let parts = table.table_name.split('_');
        let exchangeName = parts.shift();
        let first = parts.shift();

        if(first === 'candles') {
          markets.push({
            exchange: exchangeName,
            currency: _.first(parts),
            asset: _.last(parts)
          });
        }
        next();
      },
      err => {
        done(err, markets);
      });
    });
}

module.exports = Scanner;
