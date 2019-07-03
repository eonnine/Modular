'use strict'

var Message = function () {
	this._storage_ = {};
	this._self_	 = {};
	
	this._self_.on = function (name, messageListener) {
		this._storage_[name] = messageListener;
		return this._self_;
	}.bind(this);
	
};

Message.prototype.self = function (){
	return this._self_;
};

Message.prototype.postMessage = function (name, message) {
	if(this._storage_[name] !== undefined) this._storage_[name](message);
	return this._self_;
};

module.exports = Message;