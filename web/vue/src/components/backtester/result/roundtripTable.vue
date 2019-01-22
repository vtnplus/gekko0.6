<template lang='pug'>
 div
    h2 Roundtrips
    table.table.table-hover(v-if='roundtrips.length')
      thead
        tr
          th Entry at (UTC)
          th Exit at (UTC)
          th Exposure
          th entryPrice
          th Entry balance
          th exitPrice
          th Exit balance
          th P&amp;L
          th Profit
        tr(v-for='rt in roundtrips')
          td {{ fmt(rt.entryAt) }}
          td {{ fmt(rt.exitAt) }}
          td {{ diff(rt.duration) }}
          td {{ rt.entryPrice }}
          td {{ round(rt.entryBalance) }}
          td {{ rt.exitPrice }}
          td {{ round(rt.exitBalance) }}
          template(v-if="Math.sign(rt.pnl)===-1")
            td.text-danger {{ Math.sign(rt.pnl)*rt.pnl.toFixed(2) }}
            td.text-danger {{ rt.profit.toFixed(2) }}%
          template(v-else)
            td.text-success {{ rt.pnl.toFixed(2) }}
            td.text-success {{ rt.profit.toFixed(2) }}%
    div(v-if='!roundtrips.length')
      p Not enough data to display
</template>

<script>
import _ from 'lodash'

export default {
  props: ['roundtrips'],
  data: () => {
    return {}
  },
  methods: {
    diff: n => moment.duration(n).humanize(),
    humanizeDuration: (n) => window.humanizeDuration(n),
    fmt: date => {

      // roundtrips coming out of a backtest
      // are unix timestamp, live roundtrips
      // are date strings.
      // TODO: normalize

      let mom;

      if(_.isNumber(date)) {
        mom = moment.unix(date);
      } else {
        mom = moment(date).utc();
      }

      return mom.utc().format('YYYY-MM-DD HH:mm');
    },
    round: n => (+n).toFixed(3),
  },
}
</script>

