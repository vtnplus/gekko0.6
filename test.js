const pm2 = require("pm2");
pm2.connect(function(err) {
        if (err) {
            console.error(err);
            process.exit(0);
            return;
		}
		var data = []
		pm2.list(function(err, processDescriptionList){
			obj = {
				pid : processDescriptionList.pid,
				name : processDescriptionList.name,
				status : processDescriptionList.pm2_env.status,
				starttime : processDescriptionList.pm2_env.created_at
			}
			data.push(obj)
			
		});
		console.log(data);
});