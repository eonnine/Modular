'use strict'

var Util = require('./util');

var Ajax = function () {
	this._async_ = false;
};

Ajax.prototype.async = function (async) {
	this._async_ = async === undefined ? false : async;
	return this;
};

Ajax.prototype.createXMLHttpRequest = function () {
  return ( window.XMLHttpRequest ) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
};

Ajax.prototype.$ = function (url, onLoad) {
	var xhr = this.createXMLHttpRequest();
	xhr.open("GET", url, this._async_);
	
	var result = {};
	
	xhr.onload = function (res) {
  	var status = res.target.status;
  	if(status !== 200){
  		Util.error('module:[' + url + '] status:[' + status + '].');
  	}
		onLoad(result, res);
	};
	
	xhr.send();
	
	return result.data;
};

Ajax.prototype.getSync = function (url, callback) {
	this.async(false);
  return this.$(url, function (result, res) {
		var response = res.target.response || res.target.responseText;
		result.data = callback(response);
	});
};

Ajax.prototype.getAsync = function (url, callback) {
	this.async(true);
  this.$(url, function (result, res) {
  	var response = res.target.response || res.target.responseText;
		callback(response);
  });
};

module.exports = new Ajax();