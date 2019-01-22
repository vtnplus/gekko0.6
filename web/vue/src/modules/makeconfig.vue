<template lang='pug'>
div
	.container
		h2 
			Make Config
			a.btn.btn-primary.float-right(href='#', v-if='!addApiToggle', v-on:click.prevent='GenConfigs') Gen Config
		.row
			.col
				.card
					.card-body
						market-picker(v-on:market='updateMarketConfig', :only-tradable='isTradebot')
						
			.col
				.card
					.card-body
						strat-picker.contain.my2(v-on:stratConfig='updateStrat')
</template>

<script>

import marketPicker from '../components/global/configbuilder/marketpicker.vue'
import stratPicker from './stratpicker.vue'
import _ from 'lodash'
import { post } from '../tools/ajax';


export default {
	data: () => {
	    return {
	       market: {},
	    }
	},
	components: {
	    marketPicker,
	    stratPicker
	},
	computed: {
		config: function() {
	      let config = {
	        exchange: this.exchange,
	        values: this.credentials
	      };

	      return config;
	    }
	},
	methods: {
		updateMarketConfig : function(exchange){
		var config = exchange.watch;
		config.candleSize = stratPicker.config
			console.log(config)
		},
		GenConfigs : function(){
			alert("");
		}
	}
}
</script>