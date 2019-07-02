'use strict'

var Cache = function () {
	this._self_ = {};
};

Cache.prototype.has = function (key) {
	return this._self_.hasOwnProperty(key);
};

Cache.prototype.get = function (key) {
	return this._self_[key];
};

Cache.prototype.set = function (key, value) {
	this._self_[key] = value;
};

Cache.prototype.clear = function () {
	this._self_ = {};
};

module.exports = Cache;