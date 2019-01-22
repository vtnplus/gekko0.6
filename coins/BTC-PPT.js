// Everything is explained here:
// @link https://gekko.wizb.it/docs/commandline/plugins.html

var config = {};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                          GENERAL SETTINGS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.debug = true; // for additional logging / debugging

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                         WATCHING A MARKET
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.watch = {

  // see https://gekko.wizb.it/docs/introduction/supported_exchanges.html
  exchange: 'binance',
  currency: 'BTC',
  asset: 'PPT',

  // You can set your own tickrate (refresh rate).
  // If you don't set it, the defaults are 2 sec for
  // okcoin and 20 sec for all other exchanges.
  // tickrate: 20
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING TRADING ADVICE
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

config.tradingAdvisor = {
  enabled: true,
  method: 'RBB_ADX_BB',
  candleSize: 1,
  historySize: 60,
}

// MACD settings:
config.RBB_ADX_BB = {
  
  valPrices : 1,
  valPricesPlus : 0.5,
  SMA : {
    long : 1000.0,
    short : 50.0
  },
  BULL : {
    high : 85.6,
    low : 42.3,
    mod_high : 3.2,
    mod_low : -9,
    rsi : 14.6
  },
  BEAR : {
    high : 60.4,
    low : 28.2,
    mod_high : 1.4,
    mod_low : -1.5,
    rsi : 10.5
  },
  ADX : {
    adx : 3.0,
    high : 70.0,
    low : 50.0
  },
  BBands : {
    NbDevDn : 2.0,
    NbDevUp : 2.0,
    TimePeriod : 20.0
  },
  BBtrend : {
    upperThreshold : 50,
    lowerThreshold : 50,
    persistence : 15
  }
};

// settings for other strategies can be found at the bottom, note that only
// one strategy is active per gekko, the other settings are ignored.

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                       CONFIGURING PLUGINS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// do you want Gekko to simulate the profit of the strategy's own advice?
config.paperTrader = {
  enabled: true,
  // report the profit in the currency or the asset?
  reportInCurrency: true,
  // start balance, on what the current balance is compared with
  simulationBalance: {
    // these are in the unit types configured in the watcher.
    asset: 316,
    currency: 0,
  },
  // how much fee in % does each trade cost?
  feeMaker: 0.075,
  feeTaker: 0.075,
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
  enabled: false,
  key: '',
  secret: '',
  username: '', // your username, only required for specific exchanges.
  passphrase: '', // GDAX, requires a passphrase.
}

config.eventLogger = {
  enabled: false,
  // optionally pass a whitelist of events to log, if not past
  // the eventLogger will log _all_ events.
  // whitelist: ['portfolioChange', 'portfolioValueChange']
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
config['I understand that Gekko only automates MY OWN trading strategies'] = true;

module.exports = config;