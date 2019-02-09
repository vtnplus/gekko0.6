#Install

	#Ubuntu System

		apt install curl git screen
		curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
		apt-get install -y nodejs
		git clone https://github.com/vtnplus/gekko0.6.git gekko
		cd gekko
		npm install
		cd ./exchange
		npm install
		cd ../
		npm install pm2 -g
		screen -S CloudService
		node cloud-server.js

		Ctrl +A + D

	# Config
		Goto http://smartweb.live register new account
		Goto http://smartweb.live/trader create API
		Goto http://smartweb.live/trader/member/keys enter server IP + Coind Trade
		Click config settings you Method
		Save and CLick Start
		