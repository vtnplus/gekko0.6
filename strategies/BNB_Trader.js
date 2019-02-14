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

	    this.debug = true;

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

		

		this.checkNumber = 0;

		if(config.valPrices){
			this.settings.valPrices = config.valPrices;
			var filecache = __dirname + "/../markets/" + config.watch.asset+config.watch.currency+".json";
			if (fs.existsSync(filecache)) {
				var readJson = fs.readFileSync(filecache,"utf8");
				var readCache = JSON.parse(readJson);
			    
			    if(readCache.buyPrices > 0){
			    	this.buyPrices = readCache.buyPrices;
			    	if(this.debug) fs.appendFileSync(__dirname + "/../debug.log", "[CACHE]["+config.watch.asset+config.watch.currency+"] Read Cache Buy Price : "+this.buyPrices+ "\n", encoding='utf8');
			    	console.log("Validate Cache Buy Prices ",this.buyPrices);
			    }

			    if(readCache.sellPrice > 0){
			    	this.nextBuy = readCache.sellPrice - ((readCache.sellPrice*1.75)/100);
			    	if(this.debug) fs.appendFileSync(__dirname + "/../debug.log", "[CACHE]["+config.watch.asset+config.watch.currency+"] Read Cache Buy nextbuy : "+this.nextBuy+" Sell Price : "+readCache.sellPrice+ "\n", encoding='utf8');
			    	console.log("Validate Cache Next Buy ",this.nextBuy);
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
				fs.appendFileSync(__dirname + "/../debug.log", "[BUY]["+config.watch.asset+config.watch.currency+"] Detach buy Stop market24h"+ "\n", encoding='utf8');
				return true;
			}
			return false;
		}
		
		return true;

	},
	long : function(){

		var filecache = __dirname + "/../markets/" + config.watch.asset+config.watch.currency+".json";
		if (fs.existsSync(filecache)) {
		    var readCache = JSON.parse(fs.readFileSync(filecache,"utf8"));
		    if(readCache.stopbuy === true){
		    	fs.appendFileSync(__dirname + "/../debug.log", "[BUY]["+config.watch.asset+config.watch.currency+"] Detach buy Stop buy"+ "\n", encoding='utf8');
		    	return false;
		    }

		    if(readCache.sellPrice > 0 && config.detachbuy === true){
		    	this.nextBuy = readCache.sellPrice - ((readCache.sellPrice*1.75)/100);
		    }
		}

		var canBuy = true;
		if(config.detachbuy === true){
			if(this.candle.close < this.nextBuy){
				canBuy = true;
			}else if(this.candle.close >= this.nextBuy && this.nextBuy > 0){
				fs.appendFileSync(__dirname + "/../debug.log", "[BUY]["+config.watch.asset+config.watch.currency+"] Detach buy Stop because Prices :"+this.candle.close+", Validate Next buy : "+this.nextBuy+ "\n", encoding='utf8');
				canBuy = false;
			}
		}
		
		if(this.trend.direction !== "up" && canBuy){
			this.resetTrend();
			this.trend.direction = 'up';
			this.advice('long');
			this.buyPrices = this.candle.close;

			this.nextBuy = 0;
		}

	},

	short : function(){
		var filecache = __dirname + "/../markets/" + config.watch.asset+config.watch.currency+".json";
		if (fs.existsSync(filecache)) {
		    var readCache = JSON.parse(fs.readFileSync(filecache,"utf8"));
		    if(readCache.stopsell === true){
		    	if(this.debug) fs.appendFileSync(__dirname + "/../debug.log", "[SELL]["+config.watch.asset+config.watch.currency+"] Detach sell Stop"+ "\n", encoding='utf8');
		    	return false;
		    }
		    if(readCache.buyPrices > 0){
			    this.buyPrices = readCache.buyPrices;
			    if(this.debug) fs.appendFileSync(__dirname + "/../debug.log", "[SELL]["+config.watch.asset+config.watch.currency+"] Read buyPrices "+this.buyPrices+ "\n", encoding='utf8');
			}
		}

		var canSell = true;
		if(this.settings.valPrices > 0){
			
			var commiss = ((this.buyPrices * this.settings.valProfit)/100) + this.buyPrices;

			if(this.candle.close > commiss && this.buyPrices > 0){
				if(this.debug) fs.appendFileSync(__dirname + "/../debug.log", "[SELL]["+config.watch.asset+config.watch.currency+"] Price : "+this.candle.close+" buyPrices "+this.buyPrices+" commiss : "+commiss+ "\n", encoding='utf8');
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
			//this.senRemote()

			//console.log('========================================================================');
			//console.log('Trip in Buy : ' + this.buyPrices + " Sell : "+this.candle.close);
			//console.log('========================================================================');

			this.buyPrices = 0;
			this.nextBuy = this.candle.close - ((this.candle.close*1.75)/100);
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
/*
long : function(){
		if(this.settings.ticket24h != 0){
			etf = this;
			var options = {
			    uri: 'https://api.binance.com/api/v1/ticker/24hr',
			    
			    headers: {
			        'User-Agent': 'Request-Promise'
			    },
			    json: true // Automatically parses the JSON string in the response
			};

			rp(options).then(function (body) {
		        data = _.first(_.filter(body, {symbol: config.watch.asset+config.watch.currency}));
	        	openPrice = data.openPrice;
		        calPrice = (etf.candle.close * 100) / data.openPrice
		        
		        if(data.priceChangePercent < config.ticket24h){
		        	if(etf.trend.direction !== "up"){
						etf.resetTrend();
						etf.trend.direction = 'up';
						etf.advice('long');
						etf.buyPrices = etf.candle.close;
						
					}
		        }else{
		        	
		        	console.log("Ready Pump Stop Buy")
		        }
		        
		    })
		    .catch(function (err) {
		        console.log(err);
		    });
		    
		}else{
			if(this.trend.direction !== "up"){
				this.resetTrend();
				this.trend.direction = 'up';
				this.advice('long');
				this.buyPrices = this.candle.close;
				
			}
		}

	},
*/