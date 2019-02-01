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
		npm start
	#Default install run with UI
	You can run muti with screen

		screen -S "Coin1"
		node gekko.js -c "your config.js"
