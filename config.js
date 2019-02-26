// Everything is explained here:
// @link https://gekko.wizb.it/docs/commandline/plugins.html
const toml = require('toml');
const fs = require('fs');
const _ = require('lodash');
const secret = require("./SECRET-api-keys.json");
var config = {};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          GENERAL SETTINGS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.debug = true; // for additional logging / debugging

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                         WATCHING A MARKET
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


config.watch = {
  exchange: 'binance',
  currency: '{currency}',
  asset: '{asset}',
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING TRADING ADVICE
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.tradingAdvisor = {
  enabled: true,
  method: '{method}',
  candleSize: {size},
  historySize: {history},
}

config.{method} = toml.parse(fs.readFileSync(__dirname + "/config/strategies/"+config.tradingAdvisor.method+".toml", 'utf8'));

config.valPrices = {valPrices};
config.valProfit = {valProfit};// Default 1.75
config.TradeLimit = {TradeLimit};
config.market24h = {market24h};
config.detachbuy = {detachbuy};
config.stoplost = {stoplost};
config.workflowmod = {workflowmod};

config.apiReportKey = {apiReportKey}; // API KEY Cloud Server
// settings for other strategies can be found at the bottom, note that only
// one strategy is active per gekko, the other settings are ignored.

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING PLUGINS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// do you want Gekko to simulate the profit of the strategy's own advice?
config.paperTrader = {
  enabled: false,
  // report the profit in the currency or the asset?
  reportInCurrency: true,
  // start balance, on what the current balance is compared with
  simulationBalance: {
    // these are in the unit types configured in the watcher.
    asset: 0,
    currency: 0.1,// Add custom balance
  },
  // how much fee in % does each trade cost?
  feeMaker: 0.15,
  feeTaker: 0.25,
  feeUsing: 'maker',
  // how much slippage/spread should Gekko assume per trade?
  slippage: 0.05,
}

config.performanceAnalyzer = {
  enabled: true,
  riskFreeReturn: 5
}

// Want Gekko to perform real trades on buy or sell advice?
// Enabling this will activate trades for the market being
// watched by `config.watch`.
config.trader = {
  enabled: true,
  key: secret.binance.key,
  secret: secret.binance.secret,
  username: '', // your username, only required for specific exchanges.
  passphrase: '', // GDAX, requires a passphrase.
}

config.eventLogger = {
  enabled: false,
  // optionally pass a whitelist of events to log, if not past
  // the eventLogger will log _all_ events.
  // whitelist: ['portfolioChange', 'portfolioValueChange']
}

config.pushover = {
  enabled: false,
  sendPushoverOnStart: false,
  muteSoft: true, // disable advice printout if it's soft
  tag: '[GEKKO]',
  key: '',
  user: ''
}

// want Gekko to send a mail on buy or sell advice?
config.mailer = {
  enabled: false, // Send Emails if true, false to turn off
  sendMailOnStart: true, // Send 'Gekko starting' message if true, not if false

  email: '', // Your Gmail address
  muteSoft: true, // disable advice printout if it's soft

  // You don't have to set your password here, if you leave it blank we will ask it
  // when Gekko's starts.
  //
  // NOTE: Gekko is an open source project < https://github.com/askmike/gekko >,
  // make sure you looked at the code or trust the maintainer of this bot when you
  // fill in your email and password.
  //
  // WARNING: If you have NOT downloaded Gekko from the github page above we CANNOT
  // guarantuee that your email address & password are safe!

  password: '', // Your Gmail Password - if not supplied Gekko will prompt on startup.

  tag: '[GEKKO] ', // Prefix all email subject lines with this

  //       ADVANCED MAIL SETTINGS
  // you can leave those as is if you
  // just want to use Gmail

  server: 'smtp.gmail.com', // The name of YOUR outbound (SMTP) mail server.
  smtpauth: true, // Does SMTP server require authentication (true for Gmail)
  // The following 3 values default to the Email (above) if left blank
  user: '', // Your Email server user name - usually your full Email address 'me@mydomain.com'
  from: '', // 'me@mydomain.com'
  to: '', // 'me@somedomain.com, me@someotherdomain.com'
  ssl: true, // Use SSL (true for Gmail)
  port: '', // Set if you don't want to use the default port
}


config.candleWriter = {
  enabled: true
}

config.adviceWriter = {
  enabled: false,
  muteSoft: true,
}

config.backtestResultExporter = {
  enabled: false,
  writeToDisk: false,
  data: {
    stratUpdates: false,
    portfolioValues: true,
    stratCandles: true,
    roundtrips: true,
    trades: true
  }
}

config.candleUploader = {
  enabled: false,
  url: '',
  apiKey: ''
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING ADAPTER
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.adapter = 'sqlite';

config.sqlite = {
  path: 'plugins/sqlite',

  dataDirectory: 'history',
  version: 0.1,

  journalMode: 'WAL',

  dependencies: []
}

// Postgres adapter example config (please note: requires postgres >= 9.5):
config.postgresql = {
  path: 'plugins/postgresql',
  version: 0.1,
  connectionString: 'postgres://user:pass@localhost:5432', // if default port
  database: null, // if set, we'll put all tables into a single database.
  schema: 'public',
  dependencies: [{
    module: 'pg',
    version: '7.4.3'
  }]
}

// Mongodb adapter, requires mongodb >= 3.3 (no version earlier tested)
config.mongodb = {
  path: 'plugins/mongodb',
  version: 0.1,
  connectionString: 'mongodb://localhost/gekko', // connection to mongodb server
  dependencies: [{
    module: 'mongojs',
    version: '2.4.0'
  }]
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING BACKTESTING
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Note that these settings are only used in backtesting mode, see here:
// @link: https://gekko.wizb.it/docs/commandline/backtesting.html

config.backtest = {
  daterange: 'scan',
  // daterange: {
  //   from: "2018-03-01",
  //   to: "2018-04-28"
  //},
  batchSize: 50
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING IMPORTING
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.importer = {
  daterange: {
    // NOTE: these dates are in UTC
    from: "2017-11-01 00:00:00",
    to: "2017-11-20 00:00:00"
  }
}



// set this to true if you understand that Gekko will
// invest according to how you configured the indicators.
// None of the advice in the output is Gekko telling you
// to take a certain position. Instead it is the result
// of running the indicators you configured automatically.
//
// In other words: Gekko automates your trading strategies,
// it doesn't advice on itself, only set to true if you truly
// understand this.
//
// Not sure? Read this first: https://github.com/askmike/gekko/issues/201
config['autostart'] = true;

module.exports = config;