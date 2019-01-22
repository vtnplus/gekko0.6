<template lang='pug'>
div

  .row
    .col
      table.table.table-hover
        tr
          td.w-25 
            strong Start time
          td.w-25 {{ report.startTime }}
        
          td.w-25 
            strong End time
          td.w-25 {{ report.endTime }}
        tr
          
       
          td 
            strong Start price
          td {{ round(report.startPrice) }} {{ report.currency }}

          td 
            strong End price
          td {{ round(report.endPrice) }} {{ report.currency }}
        tr
          
          td 
            strong Timespan
          td {{ report.timespan }}

          td 
            strong Market
          td {{ round(report.market) }}%

  paperTradeSummary(:report='report')

</template>

<script>

import paperTradeSummary from '../../global/paperTradeSummary.vue'

export default {
  props: ['report'],
  components: {
    paperTradeSummary
  },
  methods: {
    round: n => (+n).toFixed(5)
  },
  computed: {
    profitClass: function() {
      if(this.report.relativeProfit > 0)
        return 'profit'
      else
        return 'loss'
    }
  }
}
</script>

<style>
.summary td {
  text-align: right;
}

</style>
