'use strict'

var Queue = function () {
	this._stop_ = false;
	this._self_ = [];
};

Queue.prototype.offer = function (fun) {
	this._self_.push(fun);
	if(this._stop_ === false){
		this.peek()();
	}
};

Queue.prototype.peek = function () {
	return this._self_.shift();
};

Queue.prototype.length = function () {
	return this._self_.length;
};

Queue.prototype.isEmpty = function () {
	return ( this._self_.length === 0 );
};

Queue.prototype.stop = function () {
	this._stop_ = true;
};

Queue.prototype.run =  function () {
	while( !this.isEmpty() ){
		this.peek()();
	}
	this._stop_ = false;
};

module.exports = Queue;