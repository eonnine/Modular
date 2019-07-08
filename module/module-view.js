'use strict'

var Promise = require('../util/promise');
var Queue = require('../util/queue');
var Word = require('../util/word');
var Util = require('../util/Util');

var Module = require('./module');

var ViewModule = function (viewId, cache) {
	
	this._create_ = function () {
		var module = new Module(viewId);
		this.extendToModuleForView(module, cache);
		return module;
	};
	
	return this._create_();
};

ViewModule.prototype.extendToModuleForView = function (module, cache) {
	module.renderIds = [];
	module.moduleScope = {};
	module.isCompleteConstructor = false;
	module.postQueue = new Queue();
	module.viewCache = cache;
	
	module.initRender = function (renderFunction, renderConstructor) {
		this.exports.render = this.exports.render.bind(this, renderFunction);
		
		var promise = new Promise(function(data) {
			this.moduleScope.state = data[Word.RENDER_CONSTRUCTOR];
			this.startPostQueue();
			this.isCompleteConstructor = true;
		}.bind(this));

		if (renderConstructor !== undefined) {
		//var renderConstructor = ;
			promise.add(Word.RENDER_CONSTRUCTOR, function(complete) {
				renderConstructor(undefined, function(fun) {
					fun(complete);
				});
			});
		}
		
		this.postQueue.stop();
		promise.start();
	};
	
	module.startPostQueue = function () {
		module.postQueue.run();
	};
	
	this.extendToExportsForView.call(module, module.exports);
	
	Util.defineProperty(module, 'message');
};

ViewModule.prototype.extendToExportsForView = function (exports) {
	var _this = this;
	exports.render = function (renderFunction, targetIds) {
		if(targetIds === undefined || typeof targetIds !== 'string' ){
			Util.warn('render() parameter: not exists area id for render!');
			return _this.exports;
		}
		
		var renderParam = {
			moduleName: _this.id,
			targetIds: targetIds.split(','),
			startPostQueue: _this.startPostQueue,
			setModuleScope: function (scopeData) {
				_this.moduleScope.$self.push(scopeData.self);
			},
			addRenderIds: function (el) {
				if( _this.renderIds.indexOf(el) === -1 ) {
					_this.renderIds.push(el);
				}
			},
		};
		
		if(_this.isCompleteConstructor === true){
			_this.moduleScope.$self = [];
			beginRender(renderFunction, renderParam);
		}else{
			_this.postQueue.offer(function () {
				_this.moduleScope.$self = [];
				beginRender(renderFunction, renderParam);
			});
		}
			
		return _this.exports;
	};
	
	exports.postMessage = function (name, message) {
		
		_this.postQueue.offer(function () {
			_this.message.postMessage(_this.id, name, message, _this.moduleScope);
		});
		
		if( _this.isCompleteConstructor ){
			_this.startPostQueue();
		}
		
		return _this.exports;
	};
	
	exports.destroy = function (idsString) {
		var originRenderElementName = _this.id + Word.CACHE_VIEW_RENDER_ORIGIN_ELEMENT_SUFFIX;
		var renderIds = _this.renderIds;
		var idsArray = idsString == undefined ? undefined : idsString.split(',');
		
		this.postMessage('destroy');
		
		Util.eachRvs(renderIds, function (i, el) {
			if(idsString === undefined || idsArray.indexOf(el) != -1 ){
				var parent = document.getElementById(el);
				if( _this.viewCache.hasChild(originRenderElementName, el) ){
					parent.innerHTML = _this.viewCache.get(originRenderElementName, el);
				} else {
					while (parent.firstChild) {
						parent.removeChild(parent.firstChild);
					}
				} 
				
				renderIds.splice(i, 1);
			}
		});
		return _this.exports;
	};
};

function beginRender (renderFunction, renderParam) {
	var isRunScript = true;

	Util.each(renderParam.targetIds, function (i, el) {
		renderFunction({
			targetId: el,
			isRunScript: isRunScript,
			startPostQueue: renderParam.startPostQueue,
			setModuleScope: renderParam.setModuleScope,
			moduleName: renderParam.moduleName + Word.CACHE_VIEW_RENDER_FUN_SUFFIX,
			originRenderElementName: renderParam.moduleName + Word.CACHE_VIEW_RENDER_ORIGIN_ELEMENT_SUFFIX,
		});
		isRunScript = false;
		renderParam.addRenderIds(el);
	});
}

module.exports = ViewModule;