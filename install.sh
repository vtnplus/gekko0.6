apt install -y curl git screen
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
apt-get install -y nodejs
npm install
cd ./exchange
npm install
cd ../
npm install pm2 -g
chmod +x cloud-server.js
cp cloud.service /etc/systemd/system/cloud.service
systemctl enable cloud.service
systemctl start cloud.service
pm2 list