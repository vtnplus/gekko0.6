const rp = require('request-promise');
const _ = require('lodash');
const request = require('request');
const fs = require('fs');

var options = {
    uri: 'http://smartweb.live/markets.json',
    
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
};

rp(options).then(function (body) {

	if(_.isObject(body)){
		fs.writeFile(__dirname + "/markets/cloud.json", JSON.stringify(body), function (err) {
		    if (err) 
		        return console.log(err);
		    console.log('Load Markets');
		});
	}
	
});

setInterval(function(){


	rp(options).then(function (body) {
		if(_.isObject(body)){
			fs.writeFile(__dirname + "/markets/cloud.json", JSON.stringify(body), function (err) {
			    if (err) 
			        return console.log("Null");
			    console.log('Load Markets');
			});
		}
	});
},1000*120);