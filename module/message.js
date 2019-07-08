'use strict'

var Message = function (id) {
	this._storage_ = {};
	this._self_	 = {};
	
	this._self_.on = function (name, messageListener) {
		if( !this._storage_.hasOwnProperty(id) ){
			this._storage_[id] = {};
		}
		this._storage_[id][name] = messageListener;
		return this._self_;
	}.bind(this);
	
};

Message.prototype.self = function (){
	return this._self_;
};

Message.prototype.postMessage = function (id, name, message, callerScope) {
	if(this._storage_[id][name] !== undefined) this._storage_[id][name].call(callerScope, message);
	return this._self_;
};

module.exports = Message;