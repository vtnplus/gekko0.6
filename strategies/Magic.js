const log = require('../core/log.js');
const config = require('../core/util.js').getConfig();
const _ = require('lodash');
const request = require('request');
const fs = require('fs');

// strategy
const report_server = 'http://smartweb.live/trader/api/report';
// strategy
var strat = {
	init : function(){
		this.trend = {
			
			direction: 'none',
			
		}
		this.order = {
			"start_amount" : 0,
			"finish_amount" : 0,
			"buy_price" : 0,
			"sell_price" : 0,
			"amount" : 0,
			"balance" : 0,
			"date" : 0,
			"block_time" : 0,
			"block_stoplost_number" : 1,
			"fixbuy" : 0,
			"fixsell" : 0
		}
		this.debugJson = {};


		this.addTalibIndicator('maSlow', 'sma', {optInTimePeriod :this.settings.SMA.long });
		this.addTalibIndicator('maFast', 'sma', {optInTimePeriod :this.settings.SMA.short });

		this.addTalibIndicator('BULL_RSI', 'rsi', {optInTimePeriod : this.settings.BULL.rsi});
		this.addTalibIndicator('BEAR_RSI', 'rsi', {optInTimePeriod : this.settings.BEAR.rsi});

		this.addTalibIndicator('rsi', 'rsi', {optInTimePeriod : 14});

		this.addTalibIndicator('bbands', 'bbands', this.settings.BBands);
		this.addTalibIndicator('adx', 'adx', {optInTimePeriod : this.settings.ADX.optInTimePeriod});


		this.addTalibIndicator('macd', 'macd', {optInFastPeriod : 12, optInSlowPeriod: 26, optInSignalPeriod: 9});
		this.addTalibIndicator('cci', 'cci', {optInTimePeriod : 14});
		this.addTalibIndicator('srsi', 'stochrsi', {optInTimePeriod : 3, optInFastK_Period : 14, optInFastD_Period : 14, optInFastD_MAType : 0});
		this.addTalibIndicator('mfi', 'mfi', {optInTimePeriod : 3});


		this.addTalibIndicator('ma7', 'ma', {optInTimePeriod : 7 , optInMAType : 0});
		this.addTalibIndicator('ma25', 'ma', {optInTimePeriod : 25 , optInMAType : 0});
		this.addTalibIndicator('ma99', 'ma', {optInTimePeriod : 99 , optInMAType : 0});

		this.BULL_MOD_high = this.settings.BULL.mod_high;
		this.BULL_MOD_low = this.settings.BULL.mod_low;
		this.BEAR_MOD_high = this.settings.BEAR.mod_high;
		this.BEAR_MOD_low = this.settings.BEAR.mod_low;

		if(config.valProfit === undefined) config.valProfit = 1.75;
		if(config.stoplost === undefined) config.stoplost = 0.10;

		config.downwillbuy =  (config.downbuy !== undefined && config.downbuy > 0 ? config.downbuy / 100 : 0.0275);
		config.auto_buy = config.detachbuy === undefined ? false : config.detachbuy;

		rconfig = this.readConfig();

		if(rconfig.buyPrice > 0) this.order.buy_price = rconfig.buyPrice;
		if(rconfig.sellPrice > 0) this.order.sell_price = rconfig.sellPrice;
		if(rconfig.fixbuy > 0) this.order.fixbuy = rconfig.fixbuy;
		if(rconfig.fixsell > 0) this.order.fixsell = rconfig.fixsell;


		

	},
	update : function(){
		this.maSlow = this.talibIndicators.maSlow.result.outReal;
		this.maFast = this.talibIndicators.maFast.result.outReal;
		this.bbands = this.talibIndicators.bbands.result;
		
		this.BULL_RSI = this.talibIndicators.BULL_RSI.result.outReal;
		this.BEAR_RSI = this.talibIndicators.BEAR_RSI.result.outReal;

		this.adx = this.talibIndicators.adx.result.outReal;
		this.ma7 = this.talibIndicators.ma7.result.outReal;
		this.ma25 = this.talibIndicators.ma25.result.outReal;
		this.ma99 = this.talibIndicators.ma99.result.outReal;


		this.order.date = this.candle.start.unix();
		
	},
	check : function(){
		var price = this.candle.close;
		var zone = 'none';
		var priceUpperBB = this.bbands.outRealLowerBand + (this.bbands.outRealUpperBand - this.bbands.outRealLowerBand) / 100 * this.settings.BBtrend.upperThreshold;
		var priceLowerBB = this.bbands.outRealLowerBand + (this.bbands.outRealUpperBand - this.bbands.outRealLowerBand) / 100 * this.settings.BBtrend.lowerThreshold;

		if (price >= priceUpperBB) zone = 'high';
		if ((price < priceUpperBB) && (price > priceLowerBB)) zone = 'middle';
		if (price <= priceLowerBB) zone = 'low';

		var isTrend = "none";

		if(this.ma99 < this.ma25 && this.ma99 < this.ma7){
			isTrend = "up";
		}else if(this.ma99 > this.ma25 && this.ma99 > this.ma7){
			isTrend = "down";
		}

		if( isTrend == "down" )
		{
			rsi = this.BEAR_RSI;
			rsi_hi = this.settings.BEAR.high,
			rsi_low = this.settings.BEAR.low;
			//console.log(rsi, rsi_hi, rsi_low, isTrend)
			// ADX trend strength?
			if( this.adx > this.settings.ADX.high ) rsi_hi = rsi_hi + this.BEAR_MOD_high;
			else if( this.adx < this.settings.ADX.low ) rsi_low = rsi_low + this.BEAR_MOD_low;
				
			

		}else{
			rsi = this.BULL_RSI;
			rsi_hi = this.settings.BULL.high,
			rsi_low = this.settings.BULL.low;
			
			// ADX trend strength?
			//console.log(rsi, rsi_hi, rsi_low, isTrend)
			if( this.adx > this.settings.ADX.high ) rsi_hi = rsi_hi + this.BULL_MOD_high;		
			else if( this.adx < this.settings.ADX.low ) rsi_low = rsi_low + this.BULL_MOD_low;

		}


		var targetAll = this.readTargetsAll();
		if(targetAll.targets !== undefined && targetAll.targets === "sellnow"){
			this.order.block_time = this.candle.start.unix() + 84000;
			this.short();
			return true;
		}

		//console.log(rsi)

		if(rsi > rsi_hi && zone === "high"){
			//console.log("Sell : ",rsi, isTrend)
			this.targetOrder("sell")
		}

		if(rsi < rsi_low && zone === "low"){
			//console.log("Buy : ",rsi,isTrend)
			this.targetOrder("buy")
		}

	},

	readConfig : function(){
		this.filecache = __dirname + "/../markets/" + config.watch.asset+config.watch.currency+".json";
		if (fs.existsSync(this.filecache)) {
			var readJson = fs.readFileSync(this.filecache,"utf8");
			return  JSON.parse(readJson);
		}
		return {};
	},

	readTargetsAll : function(){
		this.filecache = __dirname + "/../target.json";
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
			if(data.priceChangePercent < -35){
				return "unlockbuy";
			}
		}

		var targetAll = this.readTargetsAll();
		if(targetAll.targets !== undefined && targetAll.targets === "sellall"){
			return "sellall";
		}
		

		return false;

	},

	targetOrder : function(type){
		var price = this.candle.close;
		var profix = this.order.buy_price + (this.order.buy_price * (config.valProfit/100));
		var amount = (this.order.balance / price ) - this.order.amount * config.downwillbuy;
		var stoplost = this.order.buy_price - (this.order.buy_price * config.stoplost)
		var readMarkets = this.readMarkets();

		//var amount_next = this.order.amount * 0.01;
		//console.log(this.order.buy_price, profix);

		var readConfig = this.readConfig();


		/*
		Target Markets Sell All
		*/
		if(readMarkets === "sellall"){

			//var unixtime = 60 * (240 * config.tradingAdvisor.candleSize);
			this.order.block_time = this.candle.start.unix() + 84000;
			this.short();
			return true;
		}

		if(readMarkets === "stopbuy" && type == "buy"){
			this.order.block_time = this.candle.start.unix() + 84000;
			return false;
		}
		if(readMarkets === "unlockbuy" && type == "buy"){
			this.order.block_time = 0;
			this.long();
			return true;
		}

		/*

		if(price < stoplost && this.order.buy_price > 0 && config.stoplost > 0){

			var unixtime = 60 * (240 * config.tradingAdvisor.candleSize);
			if(this.maFast > this.maSlow) unixtime = unixtime * 2;

			this.order.block_stoplost = this.candle.start.unix() + 84000 * this.order.block_stoplost_number;
			this.order.block_stoplost_number = this.order.block_stoplost_number + 1;
			console.log("stoplost");
			this.short();
			return true;
		}
		*/

		/*
		unlock Time
		*/
		if(this.order.date > this.order.block_time && this.order.block_time > 0){
			console.log("Unlock Time");
			this.order.block_time = 0;
			this.order.balance = 0;
		}

		/*
		if(this.order.date > this.order.block_stoplost && this.order.block_stoplost > 0){
			console.log("Unlock Time Stop Lost");
			this.order.block_stoplost = 0;
			this.order.block_stoplost_number = 0;
		}
		*/

		if(type === "sell"){
			
			if(readConfig.stopsell === true){
				return true;
			}

			if(this.order.fixsell > 0){

				if(price > this.order.fixsell ){
					this.short();
					return true;
				}


			}else{

				if(this.order.date > this.order.exit_time && this.order.exit_time > 0){
					this.order.exit_time = 0;
					this.short();
					return true;
				}
				if(config.valProfit > 0 && this.order.buy_price  > 0){

					if(price > profix && this.order.buy_price > 0){
						this.short();
						return true;
					}

				}else{

					this.short();
					return true;
				}

			}

			
			

		}


		if(type === "buy"){
			
			
			if(readConfig.stopbuy === true){
				return true;
			}

			/*
			Target Block Time
			*/
			if(this.order.block_time > this.order.date){
				return true;
			}

			if(this.order.fixbuy > 0){
				/*
				Fix Buy Prices
				*/
				if(price < this.order.fixbuy){
					this.long();
					return true;
				}

			}else{

				if(this.order.balance == 0 || config.auto_buy === true){
					this.long();
					return true;
				}

				if(amount > this.order.amount && this.order.balance > 0){
					//console.log(this.order.amount, amount);
					this.long();
					return true;
				}
			}
			
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
		if(trade.amount > 0){

		
			if(this.order.start_amount == 0) this.order.start_amount = trade.amount;
			if(this.order.start_price == 0) this.order.start_price = trade.price;


			this.order.finish_amount = trade.amount;
			this.order.finish_price = trade.price;

			this.order.profit_asset = (trade.amount - this.order.start_amount);
			this.order.profit_btc = this.order.profit_asset * trade.price;
			this.order.profit_start = this.order.start_price * (this.order.finish_amount - this.order.start_amount)

			
			
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


			var unixtime = 60 * (config.tradingAdvisor.historySize * config.tradingAdvisor.candleSize);

			if(trade.action === "buy"){

				this.order.block_time = 0;
				this.order.buy_price = trade.price;
				this.order.exit_time = trade.date.unix() + (unixtime * 15);
				if(config.tradingAdvisor.candleSize < 5){
					this.order.exit_time  = trade.date.unix() + (84000 * 7)
				}

				this.debugJson.balance = trade.balance;
			}

			if(trade.action === "sell"){

				this.order.buy_price = 0;
				this.order.sell_price = trade.price;
				this.order.balance = trade.balance;
				this.order.amount = trade.amount;
				this.order.exit_time = 0;
				this.order.block_time = trade.date.unix() + unixtime;

				this.debugJson.balance = trade.balance;

			}

			this.calMethodReport()
			var propertiesObject = this.debugJson;
		    var url = {url:report_server, qs:propertiesObject}
		    
		    

		    request(url, function(err, response, body) {
		      if(err) { console.log(err); return; }
		      console.log(body);
		    });

			this.debugJson = {};
			//console.log(this.order)
		}
		
	},
	calMethodReport :function(){
		var price = this.candle.close;
		var rsi = this.talibIndicators.rsi.result.outReal;
		this.debugJson.rsi = rsi;
		var macd = this.talibIndicators.macd.result;
		this.debugJson.macd = this.talibIndicators.macd.result.outMACDHist;
		var cci = this.talibIndicators.cci.result.outReal;
		this.debugJson.cci = cci;
		var srsi = this.talibIndicators.srsi.result;
		this.debugJson.srsi = srsi.outFastD > srsi.outFastK ? srsi.outFastD : srsi.outFastK;
		var mfi = this.talibIndicators.mfi.result.outReal;
		this.debugJson.mfi = mfi;
		
		if(price > this.bbands.outRealMiddle){
			this.debugJson.bbands = (((price - this.bbands.outRealUpperBand)/ this.bbands.outRealUpperBand) * 100) + 100;
		}else{
			this.debugJson.bbands = (((price - this.bbands.outRealLowerBand) / this.bbands.outRealLowerBand) * 100) - 100;
		}


	},
	end : function(){
		console.log(this.order);
	}
};


module.exports = strat;