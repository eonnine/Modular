'use strict'

var Message = require('./message');
var Util = require('../util/Util');

var Module = function (_isView) {
	
	this._create_ = function () {
		var module = this.createModule();
		module.message = new Message();
		module.cache = true;
		Util.defineProperty(module, 'exports');
		Util.defineProperty(module, 'cache', { configurable: false, enumerable: false, writable : true });
		return module;
	};
	
	return this._create_();
};

Module.prototype.createModule = function () {
	var module = {};
	module.exports = this.createExports();
	return module;
};

Module.prototype.createExports = function () {
	var exports = {};
	return exports;
};

module.exports = Module;