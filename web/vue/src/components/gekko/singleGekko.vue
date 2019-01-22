<template lang='pug'>
  div.my2
    .contain(v-if='!data')
      h1 Unknown Gekko instance
      p Gekko doesn't know what gekko this is...
    div(v-if='data')
      div.minChart
        template(v-if='!isLoading')
          spinner(v-if='candleFetch === "fetching"')
          template(v-if='candleFetch === "fetched"')
            chart(:data='chartData', :height='500')

    .container
      br
      h2.contain AI {{ type }}
      div(v-if='isArchived', class='contain brdr--mid-gray p1 bg--orange')
        | This is an archived Gekko, it is currently not running anymore.
      div(v-if='data.errorMessage', class='contain brdr--mid-gray p1 bg--orange')
        | This is Gekko crashed with the following error: {{ data.errorMessage }}

      .grd.contain
        .row
          .col
            .card
              .card-header Market
              .card-body
                .row
                  .col 
                    strong Exchange
                  .col {{ config.watch.exchange }}
                .row
                  .col 
                    strong Currency
                  .col {{ config.watch.currency }}
                .row
                  .col 
                    strong Asset
                  .col {{ config.watch.asset }}
                .row
                  .col 
                    strong Type
                  .col {{ type }}
                .row(v-if='type != "watcher"')
                  .col 
                    strong Strategy
                  .col {{ stratName }}
                .row(v-if='type != "watcher"')
                  .col-lg-12.text-right
                    div(v-if='isStratrunner && !watcher && !isArchived') WARNING: stale gekko, not attached to a watcher, please report 
                      a(href='https://github.com/askmike/gekko/issues') here
                      | .
                    div(v-if='!isArchived')
                      button(v-on:click='stopGekko', class='btn btn-danger btn-sm') Stop Gekko
                    div(v-if='isArchived')
                      button(v-on:click='deleteGekko', class='btn btn-danger btn-sm') Delete Gekko
                    
                      

          .col
            .card
              .card-header Runtime
              .card-body
                spinner(v-if='isLoading')
                template(v-if='!isLoading')
                  .row(v-if='initialEvents.candle')
                    .col 
                      strong Watching since
                    .col {{ fmt(initialEvents.candle.start) }}
                  .row(v-if='latestEvents.candle')
                    .col 
                      strong Received data until
                    .col {{ fmt(latestEvents.candle.start) }}
                  .row(v-if='latestEvents.candle')
                    .col 
                      strong Data spanning
                    .col {{ humanizeDuration(moment(latestEvents.candle.start).diff(moment(initialEvents.candle.start))) }}
                  template(v-if='isStratrunner')
                    .row
                      .col 
                        strong Amount of trades
                      .col {{ trades.length }}
                    .row
                      .col 
                        strong Candle size
                      .col {{ config.tradingAdvisor.candleSize }}
                    .row
                      .col 
                        strong History size
                      .col {{ config.tradingAdvisor.historySize }}
        div(v-if='warmupRemaining', class='contain brdr--mid-gray p1 bg--orange')
          | This stratrunner is still warming up for the next 
          i {{ warmupRemaining.replace(',', ' and ') }}
          | , it will not trade until it is warmed up.

        p(v-if='isStratrunner && watcher && !isArchived')
          em This gekko gets market data from 
            router-link(:to='"/live-gekkos/" + watcher.id') this market watcher

        .row(v-if='isStratrunner')
          
          .col
            h3 Profit report
            template(v-if='!report')
              p
                em(v-if='isArchived') This Gekko never executed a trade..
                em(v-if='!isArchived') Waiting for at least one trade..
            template(v-if='report')
              .row
                .col 
                  strong Start balance
                .col {{ round(report.startBalance) }}
                .col 
                  strong Current balance
                .col {{ round(report.balance) }}
              .row
                .col 
                  strong Market
                .col {{round(report.market / 100 * report.startPrice)}} {{ config.watch.currency }} ({{ round(report.market) }} %)
                .col 
                  strong Profit
                .col {{ round(report.profit) }} {{ config.watch.currency }} ({{ round(report.relativeProfit) }} %)
              .row
                .col Alpha
                .col {{ round(report.alpha) }} {{ config.watch.currency }}
        
      template(v-if='!isLoading')
        roundtrips(v-if='isStratrunner', :roundtrips='roundtrips')
</template>

<script>

import Vue from 'vue'
import _ from 'lodash'

import { post } from '../../tools/ajax'
import spinner from '../global/blockSpinner.vue'
import chart from '../backtester/result/chartWrapper.vue'
import roundtrips from '../backtester/result/roundtripTable.vue'
import paperTradeSummary from '../global/paperTradeSummary.vue'
// global moment

export default {
  created: function() {
    if(!this.isLoading)
      this.getCandles();
  },
  components: {
    spinner,
    chart,
    paperTradeSummary,
    roundtrips
  },
  data: () => {
    return {
      candleFetch: 'idle',
      candles: false
    }
  },
  computed: {
    id: function() {
      return this.$route.params.id;
    },
    gekkos: function() {
      return this.$store.state.gekkos;
    },
    archivedGekkos: function() {
      return this.$store.state.archivedGekkos;
    },
    data: function() {
      if(!this.gekkos)
        return false;
      if(_.has(this.gekkos, this.id))
        return this.gekkos[this.id];
      if(_.has(this.archivedGekkos, this.id))
        return this.archivedGekkos[this.id];

      return false;
    },
    config: function() {
      return _.get(this, 'data.config');
    },
    latestEvents: function() {
      return _.get(this, 'data.events.latest');
    },
    initialEvents: function() {
      return _.get(this, 'data.events.initial');
    },
    trades: function() {
      return _.get(this, 'data.events.tradeCompleted') || [];
    },
    roundtrips: function() {
      return _.get(this, 'data.events.roundtrip') || [];
    },
    isLive: function() {
      return _.has(this.gekkos, this.id);
    },
    type: function() {
      return this.data.logType;
    },
    isStratrunner: function() {
      return this.type !== 'watcher';
    },
    isArchived: function() {
      return this.data.stopped;
    },
    warmupRemaining: function() {
      if(!this.isStratrunner) {
        return false;
      }

      if(this.isArchived) {
        return false;
      }

      if(this.initialEvents.stratWarmupCompleted) {
        return false;
      }

      if(!this.initialEvents.candle) {
        return false;
      }

      const historySize = _.get(this.config, 'tradingAdvisor.historySize');

      if(!historySize) {
        return false;
      }

      const warmupTime = _.get(this.config, 'tradingAdvisor.candleSize') * historySize;

      return humanizeDuration(
        moment(this.initialEvents.candle.start).add(warmupTime, 'm').diff(moment()),
        { largest: 2 }
      );
    },
    chartData: function() {
      return {
        candles: this.candles,
        trades: this.trades
      }
    },
    report: function() {
      return _.get(this.latestEvents, 'performanceReport');
    },
    stratName: function() {
      if(this.data)
        return this.data.config.tradingAdvisor.method;
    },
    stratParams: function() {
      if(!this.data)
        return 'Loading...';

      let stratParams = Vue.util.extend({}, this.data.config[this.stratName]);
      delete stratParams.__empty;

      if(_.isEmpty(stratParams))
        return 'No parameters'

      return JSON.stringify(stratParams, null, 4);
    },
    isLoading: function() {
      if(!this.data)
        return true;
      if(!_.get(this.data, 'events.initial.candle'))
        return true;
      if(!_.get(this.data, 'events.latest.candle'))
        return true;

      return false;
    },
    watcher: function() {
      if(!this.isStratrunner) {
        return false;
      }

      let watch = Vue.util.extend({}, this.data.config.watch);
      return _.find(this.gekkos, g => {
        if(g.id === this.id)
          return false;

        return _.isEqual(watch, g.config.watch);
      });
    },
    hasLeechers: function() {
      if(this.isStratrunner) {
        return false;
      }

      let watch = Vue.util.extend({}, this.data.config.watch);

      return _.find(this.gekkos, g => {
        if(g.id === this.id)
          return false;

        return _.isEqual(watch, g.config.watch);
      });
    }
  },
  watch: {
    'data.events.latest.candle.start': function() {
      setTimeout(this.getCandles, _.random(100, 2000));
    }
  },
  methods: {
    round: n => (+n).toFixed(5),
    humanizeDuration: (n, x) => window.humanizeDuration(n, x),
    moment: mom => moment.utc(mom),
    fmt: mom => moment.utc(mom).format('YYYY-MM-DD HH:mm'),
    getCandles: function() {
      if(this.isLoading) {
        return;
      }

      if(this.candleFetch === 'fetching') {
        return;
      }

      this.candleFetch = 'fetching';

      let to = this.data.events.latest.candle.start;
      let from = this.data.events.initial.candle.start;
      let candleSize = 1;

      if(this.type !== 'watcher') {
        candleSize = this.data.config.tradingAdvisor.candleSize;
      }

      let config = {
        watch: this.data.config.watch,
        daterange: {
          to, from
        },
        candleSize
      };

      // We timeout because of 2 reasons:
      // - In case we get a batch of candles we only fetch once
      // - This way we give the db (mostly sqlite) some time to write
      //   the result before we query it.
      setTimeout(() => {
        post('getCandles', config, (err, res) => {
          this.candleFetch = 'fetched';
          if(!res || res.error || !_.isArray(res))
            return console.log(res);

          this.candles = res.map(c => {
            c.start = moment.unix(c.start).utc().format();
            return c;
          });
        })
      }, _.random(150, 2500));
    },
    stopGekko: function() {
      if(this.hasLeechers) {
        return alert('This Gekko is fetching market data for multiple stratrunners, stop these first.');
      }

      if(!confirm('Are you sure you want to stop this Gekko?')) {
        return;
      }

      post('stopGekko', { id: this.data.id }, (err, res) => {
        console.log('stopped gekko');
      });
    },
    deleteGekko: function() {
      if(!this.isArchived) {
        return alert('This Gekko is still running, stop it first!');
      }

      if(!confirm('Are you sure you want to delete this Gekko?')) {
        return;
      }

      post('deleteGekko', { id: this.data.id }, (err, res) => {
        this.$router.push({
          path: `/live-gekkos/`
        });
      });
    }
  }
}
</script>

<style>
</style>
