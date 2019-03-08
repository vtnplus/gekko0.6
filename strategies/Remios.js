const log = require('../core/log.js');
const config = require('../core/util.js').getConfig();
const rp = require('request-promise');
const _ = require('lodash');
const request = require('request');
const fs = require('fs');
var moment = require('moment');
const strat = {
	
	/* INIT */
	init: function()
	{
		this.trend = {
			duration: 0,
			direction: 'none',
			longPos: false,
			persisted: false,
			adviced: false,
			buy_price : 0,
			sell_price : 0,
			block_buy : 0,
			date : 0,
			fixPriceBuy : 0,
			fixPriceSell : 0,
			block_pump_price : 0,
			balance : 0,
			sell_amount : 0,
			unlock_buy : 0
		};
		this.makePriceCache = [];

		this.debug = false;

		if(config.profit === undefined) config.profit = 1.75;
		if(config.stoplost === undefined) config.stoplost = 5.55;
		
		config.valPrices = true;
		this.debugJson = {};

		this.logDebug = [];
		this.addTalibIndicator('rsi', 'rsi', {optInTimePeriod : 14});
		this.addTalibIndicator('macd', 'macd', {optInFastPeriod : 12, optInSlowPeriod: 26, optInSignalPeriod: 9});
		this.addTalibIndicator('cci', 'cci', {optInTimePeriod : 14});
		this.addTalibIndicator('srsi', 'stochrsi', {optInTimePeriod : 3, optInFastK_Period : 14, optInFastD_Period : 14, optInFastD_MAType : 0});
		this.addTalibIndicator('mfi', 'mfi', {optInTimePeriod : 3});
		this.addTalibIndicator('bbands', 'bbands', {optInTimePeriod : 21, optInNbDevUp : 2, optInNbDevDn : 2, optInMAType : 0});

		this.addTalibIndicator('ema55', 'ema', {optInTimePeriod : 55});
		this.addTalibIndicator('ema200', 'ema', {optInTimePeriod : 200});

		this.addTalibIndicator('ema500', 'ema', {optInTimePeriod : 500});
		
		this.addTalibIndicator('ma7', 'ma', {optInTimePeriod : 7, optInMAType : 0});
		this.addTalibIndicator('ma25', 'ma', {optInTimePeriod : 25, optInMAType : 0});

		this.addTalibIndicator('maSlow', 'sma', {optInTimePeriod : 1000} );
		this.addTalibIndicator('maFast', 'sma', {optInTimePeriod : 50} );
		//this.addTalibIndicator('emaPumb', 'ema', {optInTimePeriod : 200});
		
		this.aiBot = ["rsi","macd","mfi","cci","srsi","bbands_trend","ma_trend"];//"profit"
		this.logicAction = ["pump_dump","profit","buyatsell"];


		/*
		Read Cache
		*/

		this.cache = this.readConfig();
		if(this.cache.fixBuy > 0) this.trend.fixPriceBuy = this.cache.fixBuy;
		if(this.cache.fixSell > 0) this.trend.fixPriceBuy = this.cache.fixPriceSell;
		if(this.cache.buyPrice > 0) this.trend.buy_price = this.cache.buyPrice;
		if(this.cache.sellPrice > 0) this.trend.sell_price = this.cache.sellPrice;
		
		//console.log(this.cache)

		
	},
	update : function(){
		var price = this.candle.close;
		this.maSlow = this.talibIndicators.maSlow.result.outReal;
		this.maFast = this.talibIndicators.maFast.result.outReal;
		this.ema500 = this.talibIndicators.ema500.result.outReal;
		this.ema200 = this.talibIndicators.ema200.result.outReal;
		this.bbands = this.talibIndicators.bbands.result;
		//console.log(this.bbands)
	},
	check : function(){
		this.trend.date = this.candle.start;
		this.logDebug = [];
		var switchTrend = this.moveCheck();
		
		
		
		if(switchTrend == "buy"){
			
			this.long();
		}else if(switchTrend == "sell"){
			
			this.short();
		}
		
	},

	long : function(){
		/*
		Buy
		*/
		
		if(this.trend.direction !== "up"){
			this.trend.direction = 'up';
			this.advice('long');
		}
	},
	short : function(){
		/*
		Sell
		*/

		if(this.trend.direction !== "down"){
			this.trend.direction = 'down';

			
			this.advice('short');
		}
	},


	onTrade : function(trade){
		
		this.debugJson.action = trade.action;
		this.debugJson.amount = trade.amount;
		this.debugJson.price = trade.price;
		this.debugJson.date = trade.date.unix();
		this.debugJson.asset = config.watch.asset;
		this.debugJson.currency = config.watch.currency;

		this.debugJson.period = config.tradingAdvisor.candleSize;
		this.debugJson.strategies = config.tradingAdvisor.method;
		
		this.debugJson.fee = trade.feePercent;
		this.debugJson.api = config.apiReportKey;

		this.debugJson.trend = (this.debugJson.ma7 > this.debugJson.ma25 ? "up" : "down");

		if(trade.action === "sell"){
			this.trend.buy_price = 0;
			this.trend.sell_price = trade.price;
			this.trend.balance = (trade.amount * trade.price) - ((trade.price * (trade.feePercent * 100)) * trade.price);
			this.trend.sell_amount = trade.amount + (trade.price * (trade.feePercent * 100));

			this.debugJson.balance = trade.balance;

		}

		if(trade.action === "buy"){
			this.trend.buy_price = trade.price;
			this.debugJson.balance = trade.balance;
			this.trend.sell_price = 0;
		}
		
		var propertiesObject = this.debugJson;
	    var url = {url:'http://smartweb.live/trader/api/report', qs:propertiesObject}
	    
	    request(url, function(err, response, body) {
	      if(err) { console.log(err); return; }
	      console.log(body);
	    });
		//console.log(trade);
		this.debugJson = {};
	},
	readConfig : function(){
		this.filecache = __dirname + "/../markets/" + config.watch.asset+config.watch.currency+".json";
		if (fs.existsSync(this.filecache)) {
			var readJson = fs.readFileSync(this.filecache,"utf8");
			return  JSON.parse(readJson);
		}
		return {};
	},
	readMarkets : function(){
		cloudService = __dirname + "/../markets/cloud.json";

		if (fs.existsSync(cloudService) && config.market24h === true) {
			var markets = JSON.parse(fs.readFileSync(cloudService));
			data = _.first(_.filter(markets, {symbol : config.watch.asset+config.watch.currency}));

			btcusdt = _.first(_.filter(markets, {symbol : "BTCUSDT"}));

			

			if(btcusdt.priceChangePercent < -5 || btcusdt.priceChangePercent > 5){
				return "sellall";
			}

			if(data.priceChangePercent > 25){
				return "stopbuy";
			}
			if(data.priceChangePercent > 35){
				return "sellall";
			}
			if(data.priceChangePercent < -20){
				return "unlockbuy";
			}
		}

		return false;

	},
	pump_dump : function(){
		var price = this.candle.close;
		var markets = this.readMarkets();


	},
	exittime : function(){

	},

	LogicBot : function(action){
		var price = this.candle.close;
		var markets = this.readMarkets();// Pump and dump
		var getConfig = this.readConfig();

		//var emaUp200 = 100 - (( price/this.lastPrice24) * 100);
		var emaUp55 = 100 - (( price/this.ema500) * 100);
		var unixtime = 60 * (config.tradingAdvisor.historySize * config.tradingAdvisor.candleSize) * (config.tradingAdvisor.candleSize < 15 ? 2 : 1);

		if(markets === "stopbuy"){
			this.trend.block_buy = this.trend.date.unix() + unixtime;
		}else if(markets === "unlockbuy"){
			this.trend.block_buy = 0;
		}else if(markets === "sellall"){
			this.trend.block_buy = this.trend.date.unix() + (unixtime * 1.5);// x1.5 Unlock time
			return "sell";
		}


		
		var zone = 'none';
		var priceUpperBB = this.bbands.outRealLowerBand + (this.bbands.outRealUpperBand - this.bbands.outRealLowerBand) / 100 * this.settings.BBtrend.upperThreshold;
		var priceLowerBB = this.bbands.outRealLowerBand + (this.bbands.outRealUpperBand - this.bbands.outRealLowerBand) / 100 * this.settings.BBtrend.lowerThreshold;
		
		

		if (price >= priceUpperBB) zone = 'high';
		if ((price < priceUpperBB) && (price > priceLowerBB)) zone = 'middle';
		if (price <= priceLowerBB) zone = 'low';


		if(action === "sell" && this.trend.direction !== "down"){
			
			var profit = this.trend.buy_price + (this.trend.buy_price * (config.profit / 100));
			var stoplost = this.trend.buy_price - (this.trend.buy_price * (config.stoplost / 100));
			
			if(getConfig.stopsell === true){
				return 'N/A';
			}

			
			//console.log(emaUp55.toFixed(2), emaUp200.toFixed(2))
			

			

			if(price < stoplost && this.trend.buy_price > 0){
				console.log("Stoplost Buy " + this.trend.date)
				this.trend.block_buy = this.trend.date.unix() + unixtime;

				this.debugJson.stoplost = {price : price, lost : stoplost, blocktime : this.trend.block_buy};

				return action;
			}


			/*
			Run Sell With Fix Price
			*/
			if(this.cache.fixPriceSell > 0 && price >= this.cache.fixPriceSell){
				return action;
			}

			if(zone === "high"){


				if(price > profit && config.valPrices > 0){
					//this.trend.block_buy = this.trend.date.unix() + (config.tradingAdvisor.candleSize * 5 * 60);
					return action;
				}else if(config.valPrices === false){
					return action;
				}
			}

			return "N/A";
			
		}

		

		if(action === "buy" && this.trend.direction !== "up"){
			if(getConfig.stopbuy === true){
				return 'N/A';
			}
			if(this.trend.block_buy > this.trend.date.unix()){
					//console.log("Block Buy " + this.trend.date)
					return "N/A";
			}
			
			/*
			Unlock Next Buy
			
			if(this.trend.date.unix() > this.trend.unlock_buy && this.trend.unlock_buy > 0){
				this.trend.unlock_buy = 0;
				return action;
			}
			*/

			/*
			Run with Fix Price
			*/

			if(zone === "low"){
				if(this.trend.fixPriceBuy > 0 && price <= this.trend.fixPriceBuy){
					
					return action;

				}


				if((this.trend.balance / price) >= this.trend.sell_amount){
					return action;
				}else{
					this.trend.unlock_buy = this.trend.date.unix() + unixtime;
				}
			}
			
			
			return "N/A";
		}
	},
	moveCheck : function(){
		//'use strict';
		/*
		Xat xuat thong ke
		*/
		var obj = this;
		var target = [];
		this.aiBot.forEach(function(item){
			target.push(eval("obj."+item+"(false)"));
		});
		

		var numLength = target.length;
		//console.log(target);
		var sell = 0, buy= 0, na = 0;
		target.forEach(function(item){
			if(item === "sell"){
				sell = sell + 1
			}else if(item === "buy"){
				buy = buy + 1
			}else if(item === "N/A"){
				na = na + 1
			}
		})

		var max = _.max([sell, buy, na]);

		//console.log(sell, buy, na, max);
		var action = "N/A";
		if(max === sell){
			this.logDebug.push("[SELL] "+(100/sell).toFixed(2) + "% " + "[BUY] "+(100/buy).toFixed(2) + "% " + "[WAIT] "+(100/na).toFixed(2) + "% ");
			action = "sell"
		}else if(max === buy){
			this.logDebug.push("[SELL] "+(100/sell).toFixed(2) + "% " + "[BUY] "+(100/buy).toFixed(2) + "% " + "[WAIT] "+(100/na).toFixed(2) + "% ");
			action = "buy"
		}else{
			action = "N/A"
		}
		
		return this.LogicBot(action);
	},

	rsi : function(debug){
		var hight = 70;
		var low = 30;

		/*
		Switch Trend
		*/

		if(this.maSlow > this.maFast){
			hight = 55.2;
			low = 18.2
		}else if(this.maSlow < this.maFast){
			hight = 86.2;
			low = 42.2
		}



		var rsi = this.talibIndicators.rsi.result.outReal;
		this.debugJson.rsi = rsi;
		
		if(rsi > hight){
			
			if(debug === true){
				this.logDebug.push("[SELL] RSI : "+rsi)
			}

			return "sell"

		}else if(rsi < low){
			if(debug  === true){
				this.logDebug.push("[BUY] RSI : "+rsi)
			}
			return "buy"
		}

		return "N/A"

	},
	macd : function(debug){
		
		var macd = this.talibIndicators.macd.result;
		//console.log(macd);
		this.debugJson.macd = macd.outMACDHist;

		if(macd.outMACDSignal > macd.outMACD){
			if(debug === true){
				this.logDebug.push("[SELL] MACD : "+macd.outMACD)
			}
			return "sell"
		}else if(macd.outMACDSignal < macd.outMACD){
			if(debug === true){
				this.logDebug.push("[BUY] MACD : "+macd.outMACD)
			}
			return "buy"
		}
		return "N/A"
	},

	cci : function(debug){

		var hight = 100;
		var low = -100;
		var cci = this.talibIndicators.cci.result.outReal;
		
		this.debugJson.cci = cci;

		if(cci > hight){
			if(debug === true){
				this.logDebug.push("[SELL] CCI : "+cci)
			}
			return "sell"
		}else if(cci < low){
			if(debug === true){
				this.logDebug.push("[BUY] CCI : "+cci)
			}
			return "buy"
		}
		return "N/A"
		
	},
	srsi : function(debug){
		var srsi = this.talibIndicators.srsi.result;
		
		
		this.debugJson.srsi = srsi.outFastD > srsi.outFastK ? srsi.outFastD : srsi.outFastK;

		if(srsi.outFastD > srsi.outFastK){
			if(debug === true){
				this.logDebug.push("[SELL] SRSI : "+srsi.outFastD + " - "+srsi.outFastK)
			}
			return "sell"
		}else if(srsi.outFastD < srsi.outFastK){
			if(debug === true){
				
				this.logDebug.push("[BUY] SRSI : "+srsi.outFastD + " - "+srsi.outFastK)
			}
			return "buy"
		}
		return "N/A"
	},
	mfi : function(debug){
		var hight = 80;
		var low = 20;
		var mfi = this.talibIndicators.mfi.result.outReal;
		
		this.debugJson.mfi = mfi;

		if(mfi > hight){
			if(debug === true){
				this.logDebug.push("SELL MFI : "+mfi)
				
			}
			return "sell"
		}else if(mfi < low){
			if(debug === true){
				this.logDebug.push("BUY MFI : "+mfi)
				
			}
			return "buy"
		}
		return "N/A"
	},
	bbands_trend : function(debug){
		var bbands = this.bbands;
		var price = this.candle.close;
		
		if(price > bbands.outRealMiddle){
			this.debugJson.bbands = (((price - bbands.outRealUpperBand)/ bbands.outRealUpperBand) * 100) + 100;
		}else{
			this.debugJson.bbands = (((price - bbands.outRealLowerBand) / bbands.outRealLowerBand) * 100) - 100;
		}
		

		if(price > bbands.outRealUpperBand){
			if(debug === true){
				this.logDebug.push("[SELL] BB "+price +" - "+ bbands.outRealUpperBand)
			}
			return "sell";
		}else if(price < bbands.outRealLowerBand){
			if(debug === true){
				this.logDebug.push("[BUY] BB "+price +" - "+ bbands.outRealUpperBand)
			}
			return "buy";
		}else{
			return "N/A";
		}
		//console.log(bbands);
	},
	sma : function(){

	},
	ema : function(){

	},
	ma_trend : function(debug){
		var ma7 = this.talibIndicators.ma7.result.outReal;
		var ma25 = this.talibIndicators.ma25.result.outReal;
		
		this.debugJson.ma7 = ma7;
		this.debugJson.ma25 = ma25;

		if(ma25 > ma7){
			if(debug === true){
				this.logDebug.push("SELL MA : "+ma25+" - "+ma7)
				
			}
			return "sell";
		}else if(ma25 < ma7){
			if(debug === true){
				this.logDebug.push("BUY MA : "+ma25+" - "+ma7)
				
			}
			return "buy";
		}else{
			return "N/A";
		}
		
	},
	check_price : function(debug){
		var price = this.candle.close;
		if(price > this.trend.buy_price){
			if(debug === true){
				this.logDebug.push("[SELL] Price : "+price)
			}
			return "sell";
		}else if(this.trend.buy_price === 0){
			if(debug === true){
				this.logDebug.push("[BUY] Price : "+price)
			}
			return "buy";
		}
		return "N/A";
		
	},
	profit : function(debug){
		var price = this.candle.close;
		var profit = this.trend.buy_price + (this.trend.buy_price * (config.profit / 100));
		if(price > profit){
			if(debug === true){
				this.logDebug.push("[SELL] Profit : "+(price - profit))
			}
			return "sell";
		}
		return "N/A";
	},
	down_buy : function(){
		var price = this.candle.close;
		var profit = this.trend.sell_price - (this.trend.sell_price * (config.profit / 100));
		if(price < profit){
			return "buy";
		}
		return "N/A";
	}


}

module.exports = strat;
