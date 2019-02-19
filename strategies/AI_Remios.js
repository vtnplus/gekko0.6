const log = require('../core/log.js');
const config = require('../core/util.js').getConfig();
const rp = require('request-promise');
const _ = require('lodash');
const request = require('request');
const fs = require('fs');
//const Table = require('cli-table');
//const table = new Table({ head: ["Date", "Price", "SMA","FMA"] });


const strat = {
	
	/* INIT */
	init: function()
	{
		this.name = 'Binance Method';
		config.debug = false;
		// performance
		config.backtest.batchSize = 1000; // increase performance
		config.silent = true; // NOTE: You may want to set this to 'false' @ live
		config.detachbuy = true;
		config.stoplost = (config.stoplost > 0 && config.stoplost < 3 ? 10 : config.stoplost);
		this.resetTrend();
		
		// SMA
		this.addIndicator('maSlow', 'SMA', this.settings.SMA.long );
		this.addIndicator('maFast', 'SMA', this.settings.SMA.short );
		
		this.addIndicator('BB', 'BBANDS', this.settings.BBands);
		this.BBtrend = {
	      zone: 'none',  // none, middle, high, low
	      duration: 0,
	      persisted: false
	    }

	    this.debug = false;

	    // RSI
		this.addIndicator('BULL_RSI', 'RSI', { interval: this.settings.BULL.rsi });
		this.addIndicator('BEAR_RSI', 'RSI', { interval: this.settings.BEAR.rsi });
		// MOD (RSI modifiers)
		this.BULL_MOD_high = this.settings.BULL.mod_high;
		this.BULL_MOD_low = this.settings.BULL.mod_low;
		this.BEAR_MOD_high = this.settings.BEAR.mod_high;
		this.BEAR_MOD_low = this.settings.BEAR.mod_low;

		

		this.addIndicator('ADX', 'ADX', this.settings.ADX.adx );
		//console.log(table.toString());
		this.startTime = new Date();
		this.buyPrices = 0;
		this.nextBuy = 0;
		this._downPricesBuy = 1.75;//% down
		
		this.stoptrend = 0;

		this.checkNumber = 0;

		this.filecache = __dirname + "/../markets/" + config.watch.asset+config.watch.currency+".json";


		if(config.valPrices){
			this.settings.valPrices = config.valPrices;
			
			if (fs.existsSync(this.filecache)) {
				var readJson = fs.readFileSync(this.filecache,"utf8");
				var readCache = JSON.parse(readJson);
			    
			    if(readCache.buyPrices > 0){
			    	this.buyPrices = readCache.buyPrices;
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
	/* RESET TREND */
	resetTrend: function()
	{
		var trend = {
			duration: 0,
			direction: 'none',
			longPos: false,
			persisted: false,
			adviced: false
		};
	
		this.trend = trend;
	},
	update : function(){
		
	},
	
	
	
	
	check : function(){
		let ind = this.indicators,
			maSlow = ind.maSlow.result.toFixed(8),
			maFast = ind.maFast.result.toFixed(8),
			rsi,
			adx = ind.ADX.result,
			BB = ind.BB;


		var price = this.candle.close;

		var zone = 'none';
		var priceUpperBB = BB.lower + (BB.upper - BB.lower) / 100 * this.settings.BBtrend.upperThreshold;
		var priceLowerBB = BB.lower + (BB.upper - BB.lower) / 100 * this.settings.BBtrend.lowerThreshold;
		
		var buy24h = this.getMarkets()

		if (price >= priceUpperBB) zone = 'high';
		if ((price < priceUpperBB) && (price > priceLowerBB)) zone = 'middle';
		if (price <= priceLowerBB) zone = 'low';

		if (this.BBtrend.zone == zone) {
		  this.BBtrend = {
		    zone: zone,  // none, high, middle, low
		    duration: this.BBtrend.duration+1,
		    persisted: true
		  }
		}
		else {
		  this.BBtrend = {
		    zone: zone, 
		    duration: 0,
		    persisted: false
		  }
		}  		


		if( maFast < maSlow )
		{
			rsi = ind.BEAR_RSI.result;
			rsi_hi = this.settings.BEAR.high,
			rsi_low = this.settings.BEAR.low;
			target = "BEAR_RSI";
			if( adx > this.settings.ADX.high ){
				rsi_hi = rsi_hi + this.BEAR_MOD_high;
			}else if( adx < this.settings.ADX.low ){
				rsi_low = rsi_low + this.BEAR_MOD_low;
			} 
			
		}else{
			rsi = ind.BULL_RSI.result;
			rsi_hi = this.settings.BULL.high,
			rsi_low = this.settings.BULL.low;
			

			if( adx > this.settings.ADX.high ){
				
				rsi_hi = rsi_hi + this.BULL_MOD_high;
			}else if( adx < this.settings.ADX.low ){
			 	rsi_low = rsi_low + this.BULL_MOD_low;
			 	
			}
			

		}
		

		var stoplost = (price < this.getProfit("stoplost") && config.stoplost > 0 ? true : false);
		
		if(stoplost){
			if( rsi > rsi_hi && price >= priceUpperBB) {
				if(this.trend.direction !== "down"){
					this.resetTrend();
					this.trend.direction = 'down';
					this.advice('short');
					this.stoptrend = 1;
					console.log("Stop Loss");
				}
			}
		}


		//console.log('Check : ' + rsi + " Prices : "+this.candle.close);
		
		if( rsi < rsi_low && this.BBtrend.zone == 'low' && this.BBtrend.duration >= this.settings.BBtrend.persistence && buy24h) {
			
			this.long();// Buy
		}else if( rsi > rsi_hi && price >= priceUpperBB) {
			this.short();// Sell
		}
		
	},
	getMarkets : function(){
		if(config.market24h === true){
			
			var markets = JSON.parse(fs.readFileSync(__dirname + "/../markets/cloud.json","utf8"));
			data = _.first(_.filter(markets, {symbol : config.watch.asset+config.watch.currency}));
			if(data.status !== "Stopbuy"){
				return true;
			}
			if(data.priceChangePercent > 5){
				this._downPricesBuy = data.priceChangePercent/2;
			}

			return false;
		}
		
		return true;

	},
	long : function(){

		//if(this.stoptrend > 0) return;

		if (fs.existsSync(this.filecache)) {
		    var readCache = JSON.parse(fs.readFileSync(this.filecache,"utf8"));
		    if(readCache.stopbuy === true){
		    	return false;
		    }
		}

		var canBuy = true;
		if(config.detachbuy === true){
			if(this.candle.close < this.nextBuy){
				canBuy = true;
			}else if(this.candle.close >= this.nextBuy && this.nextBuy > 0){
				canBuy = false;
			}
		}
		
		if(this.trend.direction !== "up" && canBuy){
			this.resetTrend();
			this.trend.direction = 'up';
			if(this.stoptrend > 0){
				console.log("Stop Trend ",this.stoptrend);
				this.stoptrend = this.stoptrend - 1;
			}else{
				this.advice('long');
			}
			
			
		}

	},

	short : function(){
	
		if (fs.existsSync(this.filecache)) {
		    var readCache = JSON.parse(fs.readFileSync(this.filecache,"utf8"));
		    if(readCache.stopsell === true){
		    	return false;
		    }
		    if(readCache.buyPrices > 0){
			    this.buyPrices = readCache.buyPrices;
			}
		}

		var canSell = true;

		if(this.settings.valPrices > 0){
			
			var commiss = this.getProfit("commiss");

			if(this.candle.close > commiss && this.buyPrices > 0){
				canSell = true;
			}else if(this.buyPrices == 0){
				canSell = true;
			}else{
				canSell = false;
			}
		}



		if(this.trend.direction !== "down" && canSell){
			this.resetTrend();
			this.trend.direction = 'down';
			this.advice('short');
			
		}
	},
	onTrade : function(trade){

		if(trade.action == "sell"){
			console.log("Ontrade Sell");
			this.buyPrices = 0;
			this.nextBuy = trade.price - ((trade.price*this._downPricesBuy)/100);
		}

		if(trade.action == "buy"){
			console.log("Ontrade Buy");
			this.buyPrices = trade.price;
			this.nextBuy = 0;
		}
	},

	getProfit : function(type){

		if(type === "stoplost"){
			return this.buyPrices - ((config.stoplost * this.buyPrices)/100);
		}

		if(type === "commiss"){
			return ((this.buyPrices * this.settings.valProfit)/100) + this.buyPrices;
		}

		if(type === "nextbuy"){
			return this.sellPrice - ((this.sellPrice * this._downPricesBuy)/100);
		}
	},
	end: function()
	{
		let seconds = ((new Date()- this.startTime)/1000),
			minutes = seconds/60,
			str;
			
		minutes < 1 ? str = seconds.toFixed(2) + ' seconds' : str = minutes.toFixed(2) + ' minutes';
		
		console.log('====================================');
		console.log('Finished in ' + str);
		console.log('====================================');
	},
	log : function(){
		
		
	}
}
module.exports = strat;
