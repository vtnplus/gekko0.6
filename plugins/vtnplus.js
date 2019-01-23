/**
 * Created by billymcintosh on 24/12/17.
 */

var _ = require('lodash');
var request = require('request');
var log = require('../core/log.js');
var util = require('../core/util.js');
var config = util.getConfig();
var vtnplusConfig = config.vtnplus;
var Vtnplus = function(done) {
    _.bindAll(this);

    this.exchange = config.watch.exchange.charAt().toUpperCase() + config.watch.exchange.slice(1)

    this.price = 'N/A';
    this.done = done;
    this.setup();
};
Vtnplus.prototype.setup = function(done) {
	log.debug(`Vtnplus Plugins`)
    var setupKodi = function (err, result) {
        if(vtnplusConfig.sendMessageOnStart) {
            var currency = config.watch.currency;
            var asset = config.watch.asset;
            var title = "Gekko Started";
            var message = `Watching ${this.exchange} - ${currency}/${asset}`;
            this.mail(title, message);
        } else {
            log.debug('Skipping Send message on startup')
        }
    }
    setupKodi.call(this)
};
Vtnplus.prototype.processCandle = function(candle, done) {
    this.price = candle.close;

    done();
};


Vtnplus.prototype.processAdvice = function(advice) {
    var title = `Gekko: Going ${advice.recommendation} @ ${this.price}`
    var message = `${this.exchange} ${config.watch.currency}/${config.watch.asset}`;
    this.mail(title, message);
};

Vtnplus.prototype.mail = function(title, message, done) {
    var options = {
      body: `{"jsonrpc":"2.0","method":"GUI.ShowNotification","params":{"title":"${title}","message":"${message}"},"id":1}`,
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      url: vtnplusConfig.host
    }

    request(options, (error, response, body) => {
        if (!error) {
            log.info('Vtnplus message sent')
        } else {
            log.debug(`Vtnplus ${error}`)
        }
    })
}

module.exports = Vtnplus;