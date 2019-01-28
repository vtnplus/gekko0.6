var _ = require('lodash');
var util = require('../../core/util.js');
var log = require('../../core/log');
var mysqlUtil = require('./util');
var resilient = require('./resilient');

var Handle = require('./handle');
var config = require('../../core/util.js').getConfig();

var Reader = function() {
  _.bindAll(this);

  const handle = new Handle(config);
  this.db = handle.getConnection();
  this.dbpromise = this.db.promise();

  this.watch = config.watch;
  this.config = config;
}

// returns the furtherst point (up to `from`) in time we have valid data from
Reader.prototype.mostRecentWindow = async function(from, to, next) {
  to = to.unix();
  from = from.unix();

  var maxAmount = to - from + 1;

  var queryStr = `
  SELECT start from ${mysqlUtil.table('candles')}
  WHERE start <= ${to} AND start >= ${from}
  ORDER BY start DESC
  `;

  try {
    const [rows, fields] = await resilient.callFunctionWithIntervall(60, ()=> this.dbpromise.query(queryStr).catch((err) => {}), 5000);
    // After all data is returned, close connection and return results
    // no candles are available
    if(rows.length === 0) {
      return next(false);
    }

    if(rows.length === maxAmount) {

      // full history is available!

      return next({
        from: from,
        to: to
      });
    }

    // we have at least one gap, figure out where
    var mostRecent = _.first(rows).start;

    var gapIndex = _.findIndex(rows, function(r, i) {
      return r.start !== mostRecent - i * 60;
    });

    // if there was no gap in the records, but
    // there were not enough records.
    if(gapIndex === -1) {
      var leastRecent = _.last(rows).start;
      return next({
        from: leastRecent,
        to: mostRecent
      });
    }

    // else return mostRecent and the
    // the minute before the gap
    return next({
      from: rows[ gapIndex - 1 ].start,
      to: mostRecent
    });

  }catch(err){
    // bail out if the table does not exist
    if (err.message.indexOf(' does not exist') !== -1)
      return next(false);

    log.error(err);
    return util.die('DB error while reading mostRecentWindow');
  }
}

Reader.prototype.tableExists = async function (name, next) {

  const queryStr =  `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='${this.config.mysql.database}'
      AND table_name='${mysqlUtil.table(name)}';
  `;
  try {
    const [rows, fields] = await resilient.callFunctionWithIntervall(60, ()=> this.dbpromise.query(queryStr).catch((err) => {}), 5000);
    next(null, rows.length === 1);
  }catch(err){
    log.error(err);
    return util.die('DB error at `tableExists`');
  }
}

Reader.prototype.get = async function(from, to, what, next) {
  if(what === 'full'){
    what = '*';
  }

  const queryStr = `
  SELECT ${what} from ${mysqlUtil.table('candles')}
  WHERE start <= ${to} AND start >= ${from}
  ORDER BY start ASC
  `;

  try{
    const [rows, fields] = await resilient.callFunctionWithIntervall(60, () => this.dbpromise.query(queryStr).catch((err) => {}), 5000);
    next(null, rows);
  }catch(err){
    // we have permanent error
    log.error(err);
    next(err);
  }
}

Reader.prototype.count = async function(from, to, next) {
  var queryStr = `
  SELECT COUNT(*) as count from ${mysqlUtil.table('candles')}
  WHERE start <= ${to} AND start >= ${from}
  `;

  try{
    const [rows, fields] = await resilient.callFunctionWithIntervall(60, () => this.dbpromise.query(queryStr).catch((err) => {}), 5000);
    next(null, _.first(rows).count);
  }catch(err){
    // we have permanent error
    log.error(err);
    next(err);
  }
}

Reader.prototype.countTotal = async function(next) {
  var queryStr = `
  SELECT COUNT(*) as count from ${mysqlUtil.table('candles')}
  `;

  try{
    const [rows, fields] = await resilient.callFunctionWithIntervall(60, () => this.dbpromise.query(queryStr).catch((err) => {}), 5000);
    next(null, _.first(rows).count);
  }catch(err){
    // we have permanent error
    log.error(err);
    next(err);
  }
}

Reader.prototype.getBoundry = async function(next) {
  var queryStr = `
  SELECT (
    SELECT start
    FROM ${mysqlUtil.table('candles')}
    ORDER BY start LIMIT 1
  ) as first,
  (
    SELECT start
    FROM ${mysqlUtil.table('candles')}
    ORDER BY start DESC
    LIMIT 1
  ) as last
  `;

  try{
    const [rows, fields] = await resilient.callFunctionWithIntervall(60, () => this.dbpromise.query(queryStr).catch((err) => {}), 5000);
    next(null, _.first(rows));
  }catch(err){
    // we have permanent error
    log.error(err);
    next(err);
  }
}

Reader.prototype.getIndicatorResults = async function(gekko_id, from, to, next) {
  if (!gekko_id){
    return next("gekko_id is required", null);
  }
  const queryStr = `
    SELECT * from ${mysqlUtil.table('iresults')}
    WHERE date <= ${to} AND date >= ${from} AND gekko_id = '${gekko_id}'
    ORDER BY date ASC
    `;

  try{
    const [rows, fields] = await resilient.callFunctionWithIntervall(60, () => this.dbpromise.query(queryStr).catch((err) => {}), 5000);
    const rowsResturn = [];
    rows.forEach((row) => {
      row.result = JSON.parse(row.result);
      rowsResturn.push(row);
    })

    next(null, rowsResturn);
  }catch(err){
      // we have permanent error
    log.error(err);
    next(err);
  }
}

Reader.prototype.close = function() {
   // this.db.end();
}

module.exports = Reader;
