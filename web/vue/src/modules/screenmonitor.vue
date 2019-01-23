<template lang='pug'>
div
	div.slider
		h1 Screen Monitor
	div
		Khoa
		div.container
			table.table.table-hover
				thead
					th PID
					th Name
					th PID
					th Uptime
					th Restart Time
					th Status
					th
				tbody
					tr(v-for='getpm in listPm2')
						td {{getpm.pmid}}
						td {{getpm.name}}
						td {{getpm.pid}}
						td {{fmt(getpm.pm_uptime/1000)}}
						td {{getpm.restart_time}}
						td {{getpm.status}}
						td.text-right 
							a.btn.btn-sm.btn-outline-info() Stop
							a.btn.btn-sm.btn-outline-info() Start
							a.btn.btn-sm.btn-outline-info() Delete
</template>
<script>
	import _ from 'lodash'
	import { post } from '../tools/ajax';
	import { get } from '../tools/ajax';
	export default {
		data: () => {
			return {
				listPm2 : []
			}
		},
		created: function () {
			get('pm2', (err, data) => {
				this.listPm2 = data;
			});
		},
		components: {
			
		},
		computed: {
		},
		methods: {
			fmt: date => {

		     
		      let mom;

		      if(_.isNumber(date)) {
		        mom = moment.unix(date);
		      } else {
		        mom = moment(date).utc();
		      }

		      return mom.utc().format('YYYY-MM-DD HH:mm');
		    },
		}
	}
</script>