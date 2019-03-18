const log = require('../core/log.js');
const config = require('../core/util.js').getConfig();
const _ = require('lodash');
const request = require('request');
const fs = require('fs');

// strategy
var report_server = 'http://smartweb.live/trader/api/report';
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
			"exitbuy" : 0,
			"exitsell" : 0,
			"block_time" : 0,
			"block_stoplost_number" : 1,
			"fixbuy" : 0,
			"fixsell" : 0,
			"autotrend" : 0
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

		this.debug = false;

		if(this.debug){

			report_server = 'http://127.0.0.1/trader/api/report';
			config.profit = 0.5/100;

			config.downbuy =  0.75/100;
			config.stoplost = 10 / 100;

		}

		rconfig = this.readConfig();
		
		if(rconfig.buyPrice > 0) this.order.buy_price = rconfig.buyPrice;
		if(rconfig.sellPrice > 0) this.order.sell_price = rconfig.sellPrice;

		if(config.fixbuy > 0) this.order.fixbuy = config.fixbuy;
		if(config.fixsell > 0) this.order.fixsell = config.fixsell;

		this.is_sma = false;
		

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
		this.price = this.candle.close;
		if(this.order.date > this.trend.autotrend && this.trend.autotrend > 0){
			this.order.fixbuy = this.bbands.outRealLowerBand;
			this.order.fixsell = this.bbands.outRealUpperBand;
			console.log("Change Value", this.order.fixbuy, this.order.fixsell);
			this.trend.autotrend = this.order.date + 84000
		}

	},
	check : function(){
		var price = this.candle.close;
		var zone = 'none';
		var priceUpperBB = this.bbands.outRealLowerBand + (this.bbands.outRealUpperBand - this.bbands.outRealLowerBand) / 100 * this.settings.BBtrend.upperThreshold;
		var priceLowerBB = this.bbands.outRealLowerBand + (this.bbands.outRealUpperBand - this.bbands.outRealLowerBand) / 100 * this.settings.BBtrend.lowerThreshold;

		this.order.date = this.candle.start.unix();

		if (price >= priceUpperBB) zone = 'high';
		if ((price < priceUpperBB) && (price > priceLowerBB)) zone = 'middle';
		if (price <= priceLowerBB) zone = 'low';


		/*
		Trend with MA
		*/
		var isTrend = "none";

		if(this.is_sma === true){
			if( this.maFast < this.maSlow )
			{
				isTrend = "up";
			}else{
				isTrend = "down";
			}
		}else{
			if(this.ma99 < this.ma25 && this.ma99 < this.ma7){
				isTrend = "up";
			}else if(this.ma99 > this.ma25 && this.ma99 > this.ma7){
				isTrend = "down";
			}
		}


		if(config.market24h){
			this.readMarkets();
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

		if(config.stoplost > 0){
			this.actionStoplost()
		}

		if(rsi > rsi_hi && zone === "high"){
			//console.log("Sell : ",rsi, isTrend)
			this.short()
		}

		if(rsi < rsi_low && zone === "low"){
			//console.log("Buy : ",rsi,isTrend)
			this.long()
		}

		//console.log(isTrend)
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
				this.trend.block_time = this.order.date + 84000;
				return "sellall";
			}

			if(data.priceChangePercent > 25){
				this.trend.block_time = this.order.date + 84000;
				return "stopbuy";
			}
			
			if(data.priceChangePercent < -35){
				this.trend.block_time = 0;
				return "unlockbuy";
			}
		}

		return false;

	},
	getProfitBuy : function(){
		var profit = this.order.sell_price - (this.order.sell_price * config.downbuy)

		if(this.order.fixbuy > 0){
			this.order.exitbuy = 0;
			return this.order.fixbuy;
		}

		return profit;
	},
	long : function(){
		/*
		Buy
		*/
		var canbuy = false;
		var profit = this.getProfitBuy()
		
		

		if(this.price <= profit || config.downbuy === 0){
			canbuy = true;
		}

		if(this.order.sell_price === 0 || (this.order.date > this.order.exitbuy && this.order.exitbuy > 0)) canbuy = true; // set default start
		
		

		if(this.trend.block_time > 0 && this.order.date < this.trend.block_time) canbuy = false;


		if(this.trend.direction !== "up" && canbuy === true){
			this.trend.direction = 'up';

			this.advice('long');
		}
	},
	getProfitSell : function(){
		var profit = this.order.buy_price + (this.order.buy_price * config.profit)
		if(this.order.fixsell > 0){
			this.order.exitsell = 0;
			return this.order.fixsell;
		}
		return profit;
	},
	short : function(){
		/*
		Sell
		*/
		var cansell = false;
		var profit = this.getProfitSell()
		
		if(this.price >= profit){
			cansell = true;
		}

		if(this.order.buy_price === 0 || (this.order.date > this.order.exitsell && this.order.exitsell > 0)) cansell = true; // set default start

		if(this.trend.direction !== "down" && cansell === true){
			this.trend.direction = 'down';
			this.advice('short');
		}
	},
	actionStoplost : function(){
		var price = this.price;
		var stoplost = this.order.buy_price - (this.order.buy_price * config.stoplost)

		if(price <= stoplost){
			this.trend.direction = 'down';
			this.advice('short');
			this.trend.block_time = this.order.date + (84000 * config.stoplostexit);
		}
	},
	onTrade : function(trade){
		this.debugJson = {};

		if(trade.amount > 0){
			this.calMethodReport();

			if(trade.action == "buy"){
				this.order.buy_price = trade.price
				this.order.sell_price = 0
				if(config.exitsell){
					this.order.exitsell = trade.date.unix() + (84000 * config.exitsell);
				}
				
				this.order.exitbuy = 0;
			}
			if(trade.action == "sell"){
				this.order.sell_price = trade.price
				this.order.buy_price = 0

				if(config.exitbuy){
					this.order.exitbuy = trade.date.unix() + (84000 * config.exitbuy);
				}
				
				this.order.exitsell = 0;
			}

			if(this.order.fixsell > 0 && this.order.fixbuy > 0){
				if(this.trend.autotrend > 0){
					this.trend.autotrend = 0
				}else{
					this.trend.autotrend = trade.date.unix() + 3600;
				}
				
			}

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
			var propertiesObject = this.debugJson;
		    var url = {url:report_server, qs:propertiesObject}
		    
		    

		    request(url, function(err, response, body) {
		      if(err) { console.log(err); return; }
		      console.log(body);
		    });
			
		}
		//console.log(trade)
	},
	calMethodReport :function(){
		var price = this.price;
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
}
module.exports = strat;