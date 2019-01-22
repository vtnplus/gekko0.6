<template lang='pug'>
div
  div.slider
    h1.text-center Start a new live Gekko
    router-link.btn.btn-outline-primary.btn-lg(to='/live-gekkos/new') Start a new Task!
  .container
    h3 Market watchers
    .text(v-if='!watchers.length')
      p You don't have any market watchers.
    table.table.table-hover(v-if='watchers.length')
      thead
        tr
          th Exchange
          th Currency
          th Asset
          th Status
          th Started at
          th Last update
          th Duration
      tbody
        tr.clickable(v-for='gekko in watchers', v-on:click='$router.push({path: `/live-gekkos/${gekko.id}`})')
          td {{ gekko.config.watch.exchange }}
          td {{ gekko.config.watch.currency }}
          td {{ gekko.config.watch.asset }}
          td {{ status(gekko) }}
          td
            template(v-if='gekko.events.initial.candle') {{ fmt(gekko.events.initial.candle.start) }}
          td
            template(v-if='gekko.events.latest.candle') {{ fmt(gekko.events.latest.candle.start) }}
          td
            template(v-if='gekko.events.initial.candle && gekko.events.latest.candle') {{ timespan(gekko.events.latest.candle.start, gekko.events.initial.candle.start) }}
    h3 Strat runners
    .text(v-if='!stratrunners.length')
      p You don't have any stratrunners.
    table.table.table-hover(v-if='stratrunners.length')
      thead
        tr
          th Exchange
          th Currency
          th Asset
          th Status
          th Duration
          th Strategy
          th PnL
          th Type
          th Trades
      tbody
        tr.clickable(v-for='gekko in stratrunners', v-on:click='$router.push({path: `/live-gekkos/${gekko.id}`})')
          td {{ gekko.config.watch.exchange }}
          td {{ gekko.config.watch.currency }}
          td {{ gekko.config.watch.asset }}
          td {{ status(gekko) }}
          td
            template(v-if='gekko.events.initial.candle && gekko.events.latest.candle') {{ timespan(gekko.events.latest.candle.start, gekko.events.initial.candle.start) }}
          td {{ gekko.config.tradingAdvisor.method }}
          td
            template(v-if='!report(gekko)') 0
            template(v-if='report(gekko)') {{ round(report(gekko).profit) }} {{ report(gekko).currency }}
          td {{ gekko.logType }}
          td
            template(v-if='!gekko.events.tradeCompleted') 0
            template(v-if='gekko.events.tradeCompleted') {{ gekko.events.tradeCompleted.length }}
   
    
</template>

<script>
// global moment
// global humanizeDuration

export default {
  created: function() {
    this.timer = setInterval(() => {
      this.now = moment();
    }, 1000)
  },
  destroyed: function() {
    clearTimeout(this.timer);
  },
  data: () => {
    return {
      timer: false,
      now: moment()
    }
  },
  computed: {
    stratrunners: function() {
      return _.values(this.$store.state.gekkos)
        .concat(_.values(this.$store.state.archivedGekkos))
          .filter(g => {
            if(g.logType === 'papertrader')
              return true;

            if(g.logType === 'tradebot')
              return true;

            return false;
          })
    },
    watchers: function() {
      return _.values(this.$store.state.gekkos)
        .concat(_.values(this.$store.state.archivedGekkos))
        .filter(g => g.logType === 'watcher')
    }
  },
  methods: {
    humanizeDuration: (n) => window.humanizeDuration(n),
    moment: mom => moment.utc(mom),
    fmt: mom => moment.utc(mom).format('YYYY-MM-DD HH:mm'),
    round: n => (+n).toFixed(3),
    timespan: function(a, b) {
      return this.humanizeDuration(this.moment(a).diff(this.moment(b)))
    },
    status: state => {
      if(state.errored)
        return 'errored';
      if(state.stopped)
        return 'stopped';
      if(state.active)
        return 'running';

      console.log('unknown state:', state);
    },
    report: state => {
      return _.get(state, 'events.latest.performanceReport');
    }
  }
}
</script>

<style>
table.clickable {
  border-collapse: separate;
}

tr.clickable td:nth-child(1) {
  padding-left: 5px;
}

tr.clickable {
  cursor: pointer;
}
tr.clickable:hover {
  background: rgba(216,216,216,.99);
}
</style>
