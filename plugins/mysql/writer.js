/*jshint esversion: 6 */

var _ = require('lodash');
var Handle = require('./handle');
var log = require('../../core/log');
var moment = require('moment');
var mysqlUtil = require('./util');
var resilient = require('./resilient');
var config = require('../../core/util.js').getConfig();

var Store = function(done, pluginMeta) {
  _.bindAll(this);
  this.done = done;
 
  this.watch = config.watch;
  this.config = config;


  const handle = new Handle(this.config);
  this.db = handle.getConnection();
  this.dbpromise = this.db.promise();
  this.upsertTables();

  this.cache = [];

  let TICKRATE = 20;
  if (this.config.watch.tickrate)
    TICKRATE = this.config.watch.tickrate;
  else if(this.config.watch.exchange === 'okcoin')
    TICKRATE = 2;

  this.tickrate = TICKRATE;
  


};

Store.prototype.upsertTables = function() {
  
  
  var createQueries = [
    `CREATE TABLE IF NOT EXISTS
    ${mysqlUtil.table('candles')} (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      start INT UNSIGNED UNIQUE,
      open DOUBLE NOT NULL,
      high DOUBLE NOT NULL,
      low DOUBLE NOT NULL,
      close DOUBLE NOT NULL,
      vwp DOUBLE NOT NULL,
      volume DOUBLE NOT NULL,
      trades INT UNSIGNED NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS
    ${mysqlUtil.table('iresults')} (
      id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      gekko_id VARCHAR(30) NOT NULL,
      name CHAR(20) NOT NULL,
      date INT UNSIGNED NOT NULL,
      result TEXT NOT NULL,
      UNIQUE (gekko_id,name, date)
    );`
  ];

  var next = _.after(_.size(createQueries), this.done);


  _.each(createQueries, function(q) {
    this.db.query(q,next);
  }, this);
}

let synchronize = false; // for synchronizing if setTimeout also wants to write
Store.prototype.writeCandles = async function() {
  if (synchronize)
    return;

  if(_.isEmpty(this.cache)){
    return;
  }

  synchronize = true;

  var queryStr = `INSERT INTO ${mysqlUtil.table('candles')} (start, open, high,low, close, vwp, volume, trades) VALUES ? ON DUPLICATE KEY UPDATE start = start`;
  let candleArrays = this.cache.map((c) => [c.start.unix(), c.open, c.high, c.low, c.close, c.vwp, c.volume, c.trades]);

  log.debug('start writing: ' + this.cache.length);
  try {
    const [rows, fields] = await resilient.callFunctionWithIntervall(60, ()=> this.dbpromise.query(queryStr, [candleArrays]).catch((err) => {}), 5000);
    this.cache = [];

    synchronize = false; //TODO remove
    log.debug('end writing: ' + this.cache.length);
  }catch(err){
    log.error("Error while inserting candle: " + err);
  }
};

Store.prototype.processCandle = function(candle, done) {
  if(!this.config.candleWriter.enabled){
    done();    return;
  }

  if(_.isEmpty(this.cache)){
    setTimeout(()=> { log.debug('start timer');
                      this.writeCandles();    }, this.tickrate*1000);
  }

  this.cache.push(candle);
  if (this.cache.length > 1000){
    this.writeCandles();
  }

  done();
};

Store.prototype.finalize = function(done) {
  if(!this.config.candleWriter.enabled){
    done();
    return;
  }

  this.writeCandles();
  this.db = null;this
  done();
}


Store.prototype.writeIndicatorResult = async function(gekko_id, indicatorResult) {
  if (!gekko_id)
    return;

  const date = moment.utc(indicatorResult.date).unix();
  // console.log(date.format('YYYY-MM-DD HH:mm'))
  var queryStr = `INSERT INTO ${mysqlUtil.table('iresults')} (gekko_id, name, date, result) VALUES ( '${gekko_id}', '${indicatorResult.name}', ${date}, '${JSON.stringify(indicatorResult.result)}')
     ON DUPLICATE KEY UPDATE result = '${JSON.stringify(indicatorResult.result)}'
  `; //TODO duplicate key?

  try {
    const [rows, fields] = await resilient.callFunctionWithIntervall(60, ()=> this.dbpromise.query(queryStr).catch((err) => {}), 5000);
  }catch(err){
    log.error("Error while inserting indicator Result: " + err);
  }
}

module.exports = Store;
