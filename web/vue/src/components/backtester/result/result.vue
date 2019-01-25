<template lang='pug'>
div
  chart(:data='candles', height='500')

  .container
    
    h3 Backtest result
    result-summary(:report='result.performanceReport')
    
    roundtripTable(:roundtrips='result.roundtrips')
</template>

<script>
import resultSummary from './summary.vue'
import chart from './chartWrapper.vue'

import roundtripTable from './roundtripTable.vue'

export default {
  props: ['result'],
  data: () => {
    return {}
  },
  methods: {},
  components: {
    roundtripTable,
    resultSummary,
    chart
  },
  computed: {
    candles: function() {
      return {
        candles: this.result.stratCandles,
        trades: this.result.trades
      };
    }
  }
}
</script>

<style>
</style>
