const pm2 = require("pm2");
pm2.connect(function(err) {
        if (err) {
            console.error(err);
            process.exit(0);
            return;
		}
		pm2.list(function(err, processDescriptionList){
			console.log(processDescriptionList);
		});
});