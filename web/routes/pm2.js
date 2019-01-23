const pm2 = require('pm2');
const _ = require('lodash');
const fs = require('co-fs');

const gekkoRoot = __dirname + '/../../';
module.exports = function *() {
	pm2.connect(function(err) {
		this.body = pm2.list();
	});
	this.body = { status: 'ok' };
}