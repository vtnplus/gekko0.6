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
const pm2 = require("pm2");

var pm2list = []
app.use(express.json());
app.use((req, res, next) => {
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Credentials', 'true');
     res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
     res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
     res.setHeader('Cache-Control', 'no-cache');
     next();
 });

app.post('/genconfig', function (req, res) {
   
   
   var configReadData = configRead;
   var currency = req.body.currency;
   var asset = req.body.asset;
   var size = (req.body.size !== undefined ? req.body.size : "1");
   var history = (req.body.history !== undefined ? req.body.history : "120");

   var valPrices = (req.body.valPrices !== undefined ? req.body.valPrices : '1');
   var valProfit = (req.body.valProfit !== undefined ? req.body.valProfit : '1.75');
   var TradeLimit = (req.body.TradeLimit !== undefined ? req.body.TradeLimit : '0.1');
   var apiReportKey = (req.body.apiReportKey !== undefined ? req.body.apiReportKey : "");
   var method = (req.body.methodAI !== undefined ? req.body.methodAI : "BNB_Trader");
   var market24h = (req.body.market24h !== undefined && req.body.market24h > 0 ? "true" : "false");
   var detachbuy = (req.body.detachbuy !== undefined && req.body.detachbuy > 0 ? "true" : "false");
   var stoplost = (req.body.stoplost !== undefined ? req.body.stoplost : "0");
   var downbuy = (req.body.downbuy !== undefined ? req.body.downbuy : "1.75");
   var fixbuy = (req.body.fixbuy !== undefined ? req.body.fixbuy : "0");
   var fixsell = (req.body.fixsell !== undefined ? req.body.fixsell : "0");
   

   //var data = JSON.stringify(config);
   //console.log(valPrices);
   configReadData = replaceString(configReadData,"{currency}",currency);
   configReadData = replaceString(configReadData,"{asset}",asset);
   configReadData = replaceString(configReadData,'{size}',size);
   configReadData = replaceString(configReadData,'{history}',history);
   configReadData = replaceString(configReadData,'{market24h}',market24h);
   configReadData = replaceString(configReadData,'{detachbuy}',detachbuy);
   configReadData = replaceString(configReadData,'{stoplost}',stoplost);

   configReadData = replaceString(configReadData,'{fixbuy}',fixbuy);
   configReadData = replaceString(configReadData,'{fixsell}',fixsell);
   configReadData = replaceString(configReadData,'{downbuy}',downbuy);

   configReadData = replaceString(configReadData,'{method}',method);
   configReadData = replaceString(configReadData,'{valPrices}',valPrices);
   configReadData = replaceString(configReadData,"{valProfit}",valProfit);
   configReadData = replaceString(configReadData,"{TradeLimit}",TradeLimit);
   configReadData = replaceString(configReadData,"{apiReportKey}","'"+apiReportKey+"'");


   fs.writeFileSync(asset+currency+'-config.js', configReadData);



   /*
    Creade Sample File Config
   */

   res.end("");
});

app.post("/config", function (req, res) {
   var cmd = req.body.cmd;
   var currency = req.body.currency;
   var asset = req.body.asset;
   var contents = JSON.parse(req.body.contents);
   

  var fileCache = "markets/"+asset+currency+".json";
  if (fs.existsSync(fileCache)) {
    var readJson = fs.readFileSync(fileCache,"utf8");
    var readCache = JSON.parse(readJson);
    
    if(contents.buyPrice) readCache.buyPrice = contents.buyPrice;
    if(contents.sellPrice) readCache.sellPrice = contents.sellPrice;
    if(contents.stopbuy) readCache.stopbuy = contents.stopbuy;
    if(contents.stopsell) readCache.stopsell = contents.stopsell;
    if(contents.fixbuy) readCache.fixbuy = contents.fixbuy;
    if(contents.fixsell) readCache.fixsell = contents.fixsell;
    var makeJson = JSON.stringify(readCache);
    fsw.writeFileSync(fileCache, makeJson);
    
  }
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
      if(shell.exec('pm2 start gekko.js -n "'+asset+currency+'" --max-memory-restart 500M -- -c '+fileConfig).code !== 0){
         res.send(JSON.stringify({status: true}));
      }
   }else if(cmd === "restart"){
      if(shell.exec('pm2 restart "'+asset+currency+'"').code !== 0){
         res.send(JSON.stringify({status: true}));
      }
   }else if(cmd === "stop"){
      if(shell.exec('pm2 stop "'+asset+currency+'"').code !== 0){
         res.send(JSON.stringify({status: true}));
      }
   }else if(cmd === "delete"){
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

app.post('/system', function (req, res) {
  var cmd = req.body.cmd;
    if(cmd === "update"){
      
      if(shell.exec('git pull && systemctl restart cloud').code !== 0){
         res.send(JSON.stringify({status: true}));
      }
    }

    if(cmd === "killpm2"){
      if(shell.exec('pm2 delete all').code !== 0){
         res.send(JSON.stringify({status: true}));
      }
    }

    if(cmd === "market24h"){
      if(shell.exec('pm2 start markets.js -n "MARKETS"').code !== 0){
         res.send(JSON.stringify({status: true}));
      }
   }

   res.end("");

});


app.post('/apikeys', function (req, res) {
   var data = '{"binance":{"key":"'+req.body.keys+'","secret":"'+req.body.secret+'"}}';
   fs.writeFileSync('SECRET-api-keys.json', data);

   res.end("");
});

app.post("/setstatus", function(req, res){
   var cmd = req.body.cmd;
   var currency = req.body.currency;
   var asset = req.body.asset;

   var filecache = __dirname + "/markets/" + asset+currency + ".json";
   if (fs.existsSync(filecache)) {
       var readCache = JSON.parse(fs.readFileSync(filecache,"utf8"));
       if(cmd == "resetbuy"){
         readCache.buyPrice = 0;

       }

       if(cmd == "resetsell"){
         readCache.sellPrice = 0;
       }

       if(cmd == "restartbuy"){
         readCache.stopbuy = false;
       }

       if(cmd == "restartsell"){
         readCache.stopsell = false;
       }

       if(cmd == "stopbuy"){
         readCache.stopbuy = true;
       }

       if(cmd == "stopsell"){
         readCache.stopsell = true;
       }

        console.log(cmd);
        console.log(readCache);

       fs.writeFileSync(filecache, JSON.stringify(readCache));

      res.send(JSON.stringify({status: true}));
      res.end("");
   }
});
app.post("/cloud", function(req, res, next){
  var api = req.body.api;
   var filecache = __dirname + "/markets/.cloud";
    fs.writeFileSync(filecache, api);
    res.send(JSON.stringify({status: true}));
    res.end("");

});

app.post("/status", function(req, res, next){
      var data = [];
      pm2.connect(function(err) {
        
              if (err) {
                  console.error(err);
                  process.exit(0);
                  return;
              }
                  
              

             data.push(new Promise(function (resolve, reject) {
                pm2.list(function(err, process){
                  resolve(process);
                });
              }));

              Promise.all(data).then(function(result){

              return _.first(result);
           
           }).then(function(data){

                var obj = []
                _.forEach(data, function(value, key){
                  var readdata = {};
                  readdata.pid = value.pid;
                  readdata.name = value.name;
                  readdata.status = value.pm2_env.status;
                  obj.push(readdata);
                  
                });
                
                //

                return obj;

           }).then(function(data){
              //var filecache = __dirname + "/markets/" + asset+currency + ".json";
              var makeData = [];

              _.forEach(data, function(value, key){
                var filecache = __dirname + "/markets/" + value.name + ".json";
                //var readData = {};

                if (fs.existsSync(filecache)) {
                    value.info = JSON.parse(fs.readFileSync(filecache,"utf8"));
                }

                //console.log(value.name);
                makeData.push(value)
              });
              
              res.send(makeData);

              res.end("");
              //next();
              //res.render(makeData);
              //pm2.disconnect();
           }).catch(function(e){

           });
          //pm2.disconnect();
      });
      //res.send("ok");
      //res.end();
});

var server = app.listen(port, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})
server.timeout = 120000;