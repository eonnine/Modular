'use strict'

var Util = require('../util/util');

var Promise = function (_fun) {
	this._array_ = [];
	this._completeFun_ = _fun;
	this._state_ = {};
};

Promise.prototype.add = function (_name, _fun) {
	this._array_.push({ name: _name, fun: _fun, isLoad: false });
};

Promise.prototype.start = function () {
	var _this = this;
	
	if(_this._array_.length === 0){
		this.runComplete();
	}
	
	Util.each(_this._array_, function (_i, _el) {
		_el.fun(_this.complete.bind(_this, _el));
	});
};

Promise.prototype.complete = function (_el, data) {
	_el.isLoad = true;
	this._state_[_el.name] = data;
	if(this.isComplete()){
		this.runComplete();
	}
};

Promise.prototype.isComplete = function () {
	if(this._array_.length === 0){
		return true;
	}
	
	return Util.each(this._array_, function (_i, _el) {
		if(_el.isLoad === false){
			return false; 
		}
	});
}

Promise.prototype.setComplete = function (_fun) {
	this._completeFun_ = ( _fun === undefined ) ? function () {} : _fun;
};

Promise.prototype.runComplete = function () {
	if(this._completeFun_ === undefined){
		return false;
	}
	
	this._completeFun_(this._state_);
	this._completeFun_= undefined;
	this._array_ = [];
};

module.exports = Promise;