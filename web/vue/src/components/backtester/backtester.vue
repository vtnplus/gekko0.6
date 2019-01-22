<template lang='pug'>
div
  div.slider
    h1 Backtest
    a.btn.btn-outline-primary.btn-lg(href='#', v-if='backtestState !== "fetching"', v-on:click.prevent='run') Backtest

  div.container
   
    config-builder(v-on:config='check')
  div(v-if='backtestable')
    .txt--center
      a.btn.btn-primary(href='#', v-if='backtestState !== "fetching"', v-on:click.prevent='run') Backtest
      div(v-if='backtestState === "fetching"').scan-btn
        p Running backtest..
        spinner
  result(v-if='backtestResult && backtestState === "fetched"', :result='backtestResult')
</template>

<script>
import configBuilder from './backtestConfigBuilder.vue'
import result from './result/result.vue'
import { post } from '../../tools/ajax'
import spinner from '../global/blockSpinner.vue'

export default {
  data: () => {
    return {
      backtestable: false,
      backtestState: 'idle',
      backtestResult: false,
      config: false,
    }
  },
  methods: {
    check: function(config) {
      // console.log('CHECK', config);
      this.config = config;

      if(!config.valid)
        return this.backtestable = false;

      this.backtestable = true;
    },
    run: function() {
      this.backtestState = 'fetching';

      post('backtest', this.config, (error, response) => {
        this.backtestState = 'fetched';
        this.backtestResult = response;
      });
    }
  },
  components: {
    configBuilder,
    result,
    spinner
  }
}
</script>
