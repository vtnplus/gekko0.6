pm2 start gekko.js -n "BTC-PPT" -- -c BTC-PPT.js
#pm2 start gekko.js -n "BTC-LUN" -- -c BTC-PPT.js
pm2 start gekko.js -n "BTC-ETC" -- -c BTC-ETC.js
pm2 start gekko.js -n "BTC-ETH" -- -c BTC-ETH.js
pm2 start gekko.js -n "BTC-BNB" -- -c BTC-ETH.js
#pm2 start gekko.js -n "ui" -- --ui