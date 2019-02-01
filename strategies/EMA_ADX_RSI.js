var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();
module.exports = strat = {
	
	/* INIT */
	init: function()
	{
		// SMA
		this.addIndicator('ema_yellow', 'EMA', this.settings.EMA.yellow );
		this.addIndicator('ema_orange', 'EMA', this.settings.EMA.orange );
		this.addIndicator('ema_green', 'EMA', this.settings.EMA.green );

		// RSI
		this.addIndicator('BULL_RSI', 'RSI', { interval: this.settings.BULL.rsi });
		this.addIndicator('BEAR_RSI', 'RSI', { interval: this.settings.BEAR.rsi });

		// ADX
		this.addIndicator('ADX', 'ADX', this.settings.ADX.adx );

		this.addIndicator('BB', 'BBANDS', this.settings.BBands);

		this.trend = {
			emaTrend : "none",
			direction : "none",
			buyPrices : 0
		}
	},
	update :  function(){
		this.ema_yellow = this.indicators.ema_yellow.result;
		this.ema_orange = this.indicators.ema_orange.result;
		this.ema_green = this.indicators.ema_green.result;

		this.bull_rsi = this.indicators.BULL_RSI.result;
		this.bear_rsi = this.indicators.BEAR_RSI.result;

		this.adx = this.indicators.ADX.result;
		this.bb = this.indicators.BB;
	},
	check : function(){
		var rsi, rsi_hi, rsi_low;
		price = this.candle.close;
		var priceUpperBB = this.bb.lower + (this.bb.upper - this.bb.lower) / 100 * this.settings.BBtrend.upperThreshold;
		var priceLowerBB = this.bb.lower + (this.bb.upper - this.bb.lower) / 100 * this.settings.BBtrend.lowerThreshold;

		var zone = 'none';
		if (price >= priceUpperBB) zone = 'high';
		if ((price < priceUpperBB) && (price > priceLowerBB)) zone = 'middle';
		if (price <= priceLowerBB) zone = 'low';

		if(this.ema_yellow > this.ema_orange && this.ema_yellow > this.ema_green){
			this.trend.emaTrend = "uptrend";
		}else{
			this.trend.emaTrend = "downtrend";
		}

		if(this.trend.emaTrend == "downtrend"){
			rsi = this.bear_rsi;
			rsi_hi = this.settings.BEAR.high;
			rsi_low = this.settings.BEAR.low;

			// ADX trend strength?
			if( this.adx > this.settings.ADX.high ) rsi_hi = rsi_hi + this.settings.BEAR.mod_high;
			else if( this.adx < this.settings.ADX.low ) rsi_low = rsi_low + this.settings.BEAR.mod_low;

		}else{
			rsi = this.bull_rsi;
			rsi_hi = this.settings.BULL.high;
			rsi_low = this.settings.BULL.low;
			// ADX trend strength?
			if( this.adx > this.settings.ADX.high ) rsi_hi = rsi_hi + this.settings.BULL.mod_high;		
			else if( this.adx < this.settings.ADX.low ) rsi_low = rsi_low + this.settings.BULL.mod_low;
		}


		if( rsi < rsi_low && this.trend.direction !== "up" && zone == "low") {
			this.advice('long');
			this.trend.buyPrices = this.candle.close;
			this.trend.direction = "up";
			console.log(this.trend.emaTrend,rsi)
		}else if( rsi > rsi_hi && this.validatePrice() && this.trend.direction !== "down") {
			this.advice('short');
			this.trend.buyPrices = 0;
			this.trend.direction = "down";
		}
		
		
	},
	validatePrice : function(){
		if(this.trend.buyPrices == 0) return true;
		var calBuy = ((this.trend.buyPrices * 0.75)/100) + this.trend.buyPrices;
		if(this.candle.close >= calBuy){
			return true;
		}
		return false;
	}
	
}

