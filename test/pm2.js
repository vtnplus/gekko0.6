const pm2 = require('pm2');
const _ = require('lodash');
const config = {};
var getList = function(arv){
	 console.log(JSON.stringify(arv));
};

pm2.connect(false,function (err) {
	
    pm2.list(function(err, processDescriptionList){
    	
    	getList(_.map(processDescriptionList, function(item){
    		return '{name :'+item.name+'}';
    	}));
    	process.exit(0);
    	//config.concat(data)
    });
    
});