var log = require('../core/log.js');
var config = require('../core/util.js').getConfig();
//const Table = require('cli-table');
//const table = new Table({ head: ["Date", "Price", "SMA","FMA"] });

var strat = {
	
	/* INIT */
	init: function()
	{
		this.resetTrend();
		config.paperTrader.simulationBalance = {
			asset : 50,
			currency : 0
		}
		this.readyTarget = 0;
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
	check : function(){
		if(this.readyTarget == 0){
			this.short();
			console.log(this.readyTarget)
		}
		
	},
	long : function(){
		if(this.trend.direction !== "up"){
			this.resetTrend();
			this.trend.direction = 'up';
			this.advice('long');
			
			
		}
	},
	short : function(){
		var canSell = false;
		

		if(this.trend.direction !== "down"){
			this.resetTrend();
			this.trend.direction = 'down';
			this.advice('short');
			this.readyTarget = this.readyTarget+1;

			console.log('========================================================================');
			console.log('Trip in Buy : ' + this.buyPrices + " Sell : "+this.candle.close);
			console.log('========================================================================');

			this.buyPrices = 0;
		}
	},
	end : function(){

	}
}
module.exports = strat;