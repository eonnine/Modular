'use strict'

var Util = require('../util/util');

var Promise = function (_fun) {
	this._array_ = [];
	this._completeFun_ = _fun;
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

Promise.prototype.complete = function (_el) {
	_el.isLoad = true;
	if(this.isComplete()){
		this.runComplete();
	}
};

Promise.prototype.isComplete = function () {
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
	
	this._completeFun_();
	this._completeFun_= undefined;
};

module.exports = Promise;