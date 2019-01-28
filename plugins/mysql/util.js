var config = require('../../core/util.js').getConfig();
module.exports = {

  // returns table name
  table: function (name) {
    return [config.watch.exchange, name, config.watch.currency, config.watch.asset].join('_');
  }
}
