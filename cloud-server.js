const shell = require('shelljs');
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
app.use(express.json());

app.post('/genconfig', function (req, res) {
   
   
   var configReadData = configRead;
   var currency = req.body.currency;
   var asset = req.body.asset;
   var size = (req.body.size !== undefined ? req.body.size : "1");
   var history = (req.body.history !== undefined ? req.body.history : "60");

   var valPrices = (req.body.valPrices !== undefined ? req.body.valPrices : '1');
   var valProfit = (req.body.valProfit != undefined ? req.body.valProfit : '1.75');
   var TradeLimit = (req.body.TradeLimit != undefined ? req.body.TradeLimit : '0.1');
   var apiReportKey = (req.body.apiReportKey !== undefined ? req.body.apiReportKey : "");
   var method = (req.body.methodAI !== undefined ? req.body.methodAI : "BNB_Trader");
   var market24h = (req.body.market24h !== undefined ? "true" : "false");
   //var data = JSON.stringify(config);
   //console.log(valPrices);
   configReadData = replaceString(configReadData,"{currency}",currency);
   configReadData = replaceString(configReadData,"{asset}",asset);
   configReadData = replaceString(configReadData,'{size}',size);
   configReadData = replaceString(configReadData,'{history}',history);
   configReadData = replaceString(configReadData,'{market24h}',market24h);

   configReadData = replaceString(configReadData,'{method}',method);
   configReadData = replaceString(configReadData,'{valPrices}',valPrices);
   configReadData = replaceString(configReadData,"{valProfit}",valProfit);
   configReadData = replaceString(configReadData,"{TradeLimit}",TradeLimit);
   configReadData = replaceString(configReadData,"{apiReportKey}","'"+apiReportKey+"'");


   fs.writeFile(asset+currency+'-config.js', configReadData, function (err) {
	    if (err) 
	        return console.log(err);
	    console.log('Config ',asset+currency);
	});

   res.end("");
});

/*
Created Start or Stop Trader
*/

app.post('/task', function (req, res) {
   var cmd = req.body.cmd;
   var currency = req.body.currency;
   var asset = req.body.asset;
   var fileConfig = asset+currency+"-config.js";

   if(cmd === "start"){
      if(shell.exec('pm2 start gekko.js -n "'+asset+currency+'" -- -c '+fileConfig).code !== 0){
         res.send(JSON.stringify({status: true}));
      }
   }else if(cmd === "restart"){
      if(shell.exec('pm2 restart "'+asset+currency+'"').code !== 0){
         res.send(JSON.stringify({status: true}));
      }
   }else if(cmd === "stop"){
      if(shell.exec('pm2 delete "'+asset+currency+'"').code !== 0){
         res.send(JSON.stringify({status: true}));
      }
   }else if(cmd === "market24h"){
      if(shell.exec('pm2 start markets.js -n "MARKETS"').code !== 0){
         res.send(JSON.stringify({status: true}));
      }
   }
   res.end("");
});

app.post('/apikeys', function (req, res) {
   var data = '{"binance":{"key":"'+req.body.keys+'","secret":"'+req.body.secret+'"}}';
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