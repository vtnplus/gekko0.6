const pm2 = require("pm2");
const _ = require('lodash');
const fs = require('fs');
var data = [];
var darastd = []

pm2.connect(function(err) {
	
        if (err) {
            console.error(err);
            process.exit(0);
            return;
        }
            
        

       data.push(new Promise(function (resolve, reject) {
       		pm2.list(function(err, process){
       			resolve(process);
       		});
       	}));

        Promise.all(data).then(function(result){

   			return _.first(result);
	   
	   }).then(function(data){

	       	var obj = []
	       	_.forEach(data, function(value, key){
	       		var readdata = {};
	       		readdata.pid = value.pid;
	       		readdata.name = value.name;
	       		readdata.status = value.pm2_env.status;
	       		obj.push(readdata);
	       		
	       	});
	       	
	       	pm2.disconnect();
	       	return obj;

	   }).then(function(data){

	   		data = JSON.stringify(data);
	   		fs.writeFile("./markets/pm2.json", data, function (err) {
		        if (err) 
		            return console.log(err);
		        console.log('Save Cache Buy');
		    });
	   });
       
        //
        
//              pm2.disconnect();
});



var readCache = JSON.parse(fs.readFileSync("./markets/pm2.json","utf8"));

console.log(readCache);



