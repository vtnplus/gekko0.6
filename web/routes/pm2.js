const pm2 = require('pm2');
const _ = require('lodash');
const fs = require('co-fs');

const gekkoRoot = __dirname + '/../../';
var jsonDevice;
var getList = function(arv){
	 jsonDevice = arv;
	 return;
};

var connectGetlist = function(){
	pm2.connect(false,function (err) {
	
	    pm2.list(function(err, processDescriptionList){
	    	
	    	getList(_.map(processDescriptionList, function(item){
	    		return {name :item.name, pid : item.pid, pmid : item.pm_id, status : item.pm2_env.status, pm_uptime : item.pm2_env.pm_uptime, restart_time : item.pm2_env.restart_time};
	    	}));
	    	//process.exit(0);
	    	//config.concat(data)
	    	return;
	    });
	    //pm2.disconnect();
	    return;
	});

	return jsonDevice;
}
module.exports = function *() {
	
	
	this.body = connectGetlist();
}




