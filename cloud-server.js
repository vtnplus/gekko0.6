const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const port = 8910
const util = require(__dirname + '/core/util');
//const config = util.getConfig();
const dirs = util.dirs();
const _ = require('lodash');
const fs = require('fs');
const async = require('async');
const moment = require('moment');
var configRead = fs.readFileSync('./config.js','utf8');
const replaceString = require('replace-string');

app.post('/genconfig', function (req, res) {
   
   var configReadData = configRead;
   var currency = req.query.currency;
   var asset = req.query.asset;
   var valPrices = (req.query.valPrices !== undefined ? req.query.valPrices : '1');
   var valProfit = (req.query.valProfit != undefined ? req.query.valProfit : '1.75');
   var TradeLimit = (req.query.TradeLimit != undefined ? req.query.TradeLimit : '0.1');
   var apiReportKey = (req.query.apiReportKey !== undefined ? req.query.apiReportKey : "");
   var method = (req.query.methodAI !== undefined ? req.query.methodAI : "BNB_Trader");
  
   //var data = JSON.stringify(config);
   //console.log(valPrices);
   configReadData = replaceString(configReadData,"{currency}",currency);
   configReadData = replaceString(configReadData,"{asset}",asset);

   configReadData = replaceString(configReadData,'{method}',method);
   configReadData = replaceString(configReadData,'{valPrices}',valPrices);
   configReadData = replaceString(configReadData,"{valProfit}",valProfit);
   configReadData = replaceString(configReadData,"{TradeLimit}",TradeLimit);
   configReadData = replaceString(configReadData,"{apiReportKey}","'"+apiReportKey+"'");


   fs.writeFile(asset+currency+'-config.js', configReadData, function (err) {
	    if (err) 
	        return console.log(err);
	    console.log('Wrote Hello World in file helloworld.txt, just check it');
	});

   res.end("");
});

/*
Created Start or Stop Trader
*/

app.get('/task', function (req, res) {
});

app.post('/apikeys', function (req, res) {
   var data = '{"binance":{"key":"'+req.query.keys+'","secret":"'+req.query.secret+'"}}';
   fs.writeFile('SECRET-api-keys.json', data, function (err) {
       if (err) 
           return console.log(err);
       console.log('Write api-keys');
   });

   res.end("");
});

var server = app.listen(port, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})