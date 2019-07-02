'use strict'

var Module = require('./module');
var Util = require('../util/Util');

var ViewModule = function () {
	
	this._create_ = function () {
		var module = new Module();
		this.extendToModuleForView(module);
		return module;
	};
	
	return this._create_();
};

ViewModule.prototype.extendToModuleForView = function (module) {
	module.renderIds = [];
	module.messageStorage = {};
	
	module.initRender = function (renderFunction) {
		this.exports.render = this.exports.render.bind(this, renderFunction);
	};
	
	this.extendToExportsForView.call(module, module.exports);
	
	Util.defineProperty(module, 'messageStorage');
	Util.defineProperty(module, 'message');
};

ViewModule.prototype.extendToExportsForView = function (exports) {
	exports.postMessage = function (name, message) {
		this.message.postMessage(name, message);
		return this.exports;
	}.bind(this);
	
	exports.render = function (renderFunction, targetIds) {
		if(targetIds !== undefined && typeof targetIds === 'string' ){
			targetIds = targetIds.split(',');

			var isRunScript = true;
			var _this = this;
			Util.each(targetIds, function (i, el) {
				renderFunction(el, isRunScript);
				_this.renderIds.push(el);
				isRunScript = false;
			});
		}else{
			Util.warn('render() parameter: not exists area id for render!');
		}
		
		return this.exports;
	};
	
	exports.destroy = function (idsString) {
		var renderIds = this.renderIds;
		var idsArray = idsString == undefined ? undefined : idsString.split(',');
		
		Util.eachRvs(renderIds, function (i, el) {
			if(idsString === undefined || idsArray.indexOf(el) != -1 ){
				var parent = document.getElementById(el);
				while (parent.firstChild) {
					parent.removeChild(parent.firstChild);
				}
				renderIds.splice(i, 1);
			}
		});
		
		return this.exports;
	}.bind(this);
};

module.exports = ViewModule;