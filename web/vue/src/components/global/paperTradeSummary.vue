<template lang='pug'>
div
  table.table.table-hover
    tr
      td.w-25 
        strong Amount of trades
      td.w-25 {{ report.trades }}
    
      td.w-25 
        strong Sharpe ratio
      td.w-25 {{ round2(report.sharpe) }}
    tr
      td 
        strong Start balance
      td {{ round(report.startBalance) }} {{ report.currency }}
    
      td 
        strong Final balance
      td {{ round(report.balance) }} {{ report.currency }}
    tr
      td 
        strong Simulated profit
      td 
        a(:class='profitClass') {{ round(report.relativeProfit) }}%
      td Strategy
      td Candles
  

</template>

<script>

export default {
  props: ['report'],
  methods: {
    round2: n => (+n).toFixed(2),
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

.big {
  font-size: 1.3em;
  width: 80%;
}

.summary table {
  width: 80%;
}

.price.profit {
  color: #7FFF00;
}

.price.loss {
  color: red;
}

</style>
