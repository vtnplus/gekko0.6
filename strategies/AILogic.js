var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();
const fs = require('fs');
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
		this.nextBuy = 0;
		this._downPricesBuy = 1.75;
		this.filecache = __dirname + "/../markets/" + config.watch.asset+config.watch.currency+".json";


		if(config.valPrices){
			this.settings.valPrices = config.valPrices;
			
			if (fs.existsSync(this.filecache)) {
				var readJson = fs.readFileSync(this.filecache,"utf8");
				var readCache = JSON.parse(readJson);
			    
			    if(readCache.buyPrice > 0){
			    	this.buyPrices = readCache.buyPrice;
			    	
			    }

			    if(readCache.sellPrice > 0){
			    	this.nextBuy = readCache.sellPrice - ((readCache.sellPrice*this._downPricesBuy)/100);
			    	
			    }
			   

			}

		}

		if(config.valProfit){
			this.settings.valProfit = config.valProfit;
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
			if(this.nextBuy == 0 || price < this.nextBuy){
				this.advice('long');
				this.trend.direction = "up";
				console.log(this.trend.emaTrend,rsi)
			}else{
				console.log("Detach Buy not execute")
			}
			
		}else if( rsi > rsi_hi && this.validatePrice() && this.trend.direction !== "down") {
			this.advice('short');
			this.trend.direction = "down";
		}
		
		
	},
	onTrade : function(trade){

		if(trade.action == "sell"){
			console.log("Ontrade Sell");
			this.trend.buyPrices = 0;
			this.nextBuy = trade.price - ((trade.price*this._downPricesBuy)/100);
		}

		if(trade.action == "buy"){
			console.log("Ontrade Buy");
			this.trend.buyPrices = trade.price;
			this.nextBuy = 0;
		}
	},
	validatePrice : function(){
		
		if (fs.existsSync(this.filecache)) {
		    var readCache = JSON.parse(fs.readFileSync(filecache,"utf8"));
		    if(readCache.buyPrice > 0){
			    this.trend.buyPrices = readCache.buyPrice;
			    
			}
		}


		if(this.trend.buyPrices == 0) return true;
		var calBuy = ((this.trend.buyPrices * this.settings.valProfit)/100) + this.trend.buyPrices;
		if(this.candle.close >= calBuy){
			return true;
		}
		return false;
	}
	
}

