'use strict'

var Cache = function () {
	this._self_ = {};
};

//depth가 더 많아진다면 set,has를 재귀함수로 변경

Cache.prototype.get = function () {
	var size = arguments.length;
	var prop = this._self_;
	
	if(size == 0){
		return prop;
	}
	
	for(var i=0, arg; arg=arguments[i]; i++){
		if(prop[arg] != null) prop = prop[arg];
	}
	
	return prop;
};

Cache.prototype.set = function (key, value) {
	this._self_[key] = value;
};

Cache.prototype.setChild = function (parentKey, key, value) {
	if( !this.has(parentKey) ){
		this.set(parentKey, {});
	}
	this._self_[parentKey][key] = value;
};

Cache.prototype.has = function (key) {
	return this._self_.hasOwnProperty(key);
};

Cache.prototype.hasChild = function (parentKey, key) {
	return this._self_.hasOwnProperty(parentKey) && this._self_[parentKey].hasOwnProperty(key);
};

Cache.prototype.clear = function () {
	this._self_ = {};
};


module.exports = Cache;