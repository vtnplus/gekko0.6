#GEKKO MOD BOT

System VPS Ubuntu >= 16.04 
install command

	apt install curl git
	curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
	apt install nodejs
	git clone https://github.com/vtnplus/gekko0.6.git gekko
	cd gekko
	npm install
	cd exchange
	npm install
	cd ..

# config URL
	nano web/vue/dist/UIconfig.js

	Change config
		api: {
	    host: '127.0.0.1', //=> change to your domain or IP
	    port: 8000,
	    timeout: 120000 // 2 minutes
	  },
	  ui: {
	    ssl: false,
	    host: 'localhost', //=> change to your domain or IP
	    port: 8000,
	    path: '/'
	  },
# Start
	node gekko.js --ui

goto http://yourip:8000
and start