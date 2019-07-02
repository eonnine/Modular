'use strict'

var Promise = require('../util/promise');
var Queue = require('../util/queue');
var Cache = require('../util/cache');
var Word = require('../util/word');
var Ajax = require('../util/ajax');
var Util = require('../util/util');

var ViewModule = require('./module-view');
var Module = require('./module');

//var Es6 = require('../es6/es6');

var Loader = function () {
	this._isDefine_ = false;
	this._defineQueue_ = new Queue();
	this._cache_ = new Cache();
};

Loader.prototype.init = function (config) {
	
	this._defineQueue_.stop();
	
	var define = function (moduleOption, imports, fun) {

		var _this = this;
		
		if(fun === undefined){
			fun = imports;
			imports = moduleOption;
			moduleOption = undefined;
		}
		
		if(fun === undefined){
			fun = imports;
			imports = undefined;
		}
		
		var 	moduleName = undefined;
		var cache = true;
		
		if(typeof moduleOption === 'string'){
			moduleName = moduleOption;
		}
		else if(typeof moduleOption === 'object'){
			moduleName = ( moduleOption.name != null && moduleOption.name.replace(/\s/g, '') !== '' ) ? moduleOption.name : moduleName;
			cache = ( moduleOption.cache === false ) ? false : cache;
		}
		
		moduleName = undefined;
		
		_this._isDefine_ = true;
		
		_this._defineQueue_.offer(function (afterLoadScript) {
			_this.imports(
				imports,
				config,
				function (paramModules, clearCache) {
					afterLoadScript({ define: fun,	paramModules: paramModules, cache: cache });
				}
			);
		});
		
	}.bind(this);
	
  define.amd = { modular: true };
	
	window[Word.DEFINE] = define;
};

Loader.prototype.transpile = function (moduleString) {
	return moduleString;
	//return ( Es6.isTranspile ) ? Es6.Transpiler.transform(moduleString, { presets: [Word.ES6_PRESET] }).code : moduleString;
};

Loader.prototype.loadModuleJs = function (importParam, callback) {
	this.load(importParam, function (module) {
		callback(module.data, module.cache);
	});
};

Loader.prototype.loadModuleNode = function (importParam, callback) {
	var _this = this;
	var messageModule = new Module();
	var module = {};
	var cache = true;
	var promise = new Promise(function () {
		callback(module, cache);
		importParam.complete();
	});
	
	var libData = importParam.libData;
	if(libData !== undefined){
		importParam.url = libData.requestPath;
	}
	
	importParam.isGlobal = false;
	this.loadModuleAsString(importParam.url, function (moduleStr, modules, nodes, scripts) {
		Util.eachObj(modules, function (k, v, o) {
			promise.add(k, function (complete) {
				_this.makeModuleFunction(	_this.transpile(v))(new Module(), {}, messageModule.message.self());
				_this.loadModule(importParam, complete, k, function (defineModule) {
					Util.assign(module, defineModule.self);
					/**
					 * 페이지의 모듈 중에서 cache 속성이 false인 모듈이 있다면 모든 모듈을 non-caching
					 */
					cache = ( cache === true && defineModule.cache === false ) ? false : cache;
					complete();
				});
			  _this.loadComplete(k);
			});
		});
		
		promise.start();
	});
};

Loader.prototype.loadModuleView = function (importParam, callback) {
	var module = new ViewModule();
	
	var libData = importParam.libData;
	if(libData !== undefined){
		importParam.url = libData.requestPath;
	}
	
	this.loadModuleAsString(importParam.url, function (moduleStr, modules, nodes, scripts) {
		module.initRender(this.makeRender().bind(this, module, moduleStr, scripts));
		callback(module);
		importParam.complete();
	}.bind(this));	
};

Loader.prototype.load = function (importParam, callback) {
	var libData = importParam.libData;
	var moduleName, loadEventListener, isGlobal, isLib;

	var head = document.getElementsByTagName('head')[0];
	var node = this.createNode(importParam);
	
	if(libData !== undefined){
		importParam.url = libData.path;
		importParam.moduleName = moduleName = libData.self;
		importParam.isGlobal = libData.isGlobal;
		isLib = true;
	}else{
		moduleName = importParam.moduleName;
		importParam.isGlobal = false;
		isLib = false;
	}
	
	importParam.isLib = isLib;
	node.src = importParam.url;
	node.setAttribute(Word.MODULE_NAME, moduleName);
	
/*	if(Es6.isTranspile && isLib === false){
		this.loadModuleAsString(node.src, function (loadedModuleString) {
			node.removeAttribute('src');
			this.makeModuleFunction(this.transpile(loadedModuleString))({}, {}, {});
			this.loadModule(importParam, importParam.complete, moduleName, callback);
		  this.loadComplete(moduleName);
		}.bind(this));
		
	}else{*/
		loadEventListener = function (evt) {
			this.onLoadScript(evt, importParam, node, loadEventListener, callback);
		}.bind(this);
		
		node.addEventListener('load', loadEventListener, false);
		head.appendChild(node);
	//}
	
};

Loader.prototype.onLoadScript = function (evt, importParam, node, loadEventListener, callback) {
	if(evt.type === 'load'){
		node.removeEventListener(node, loadEventListener, evt.type);
		this.loadModule(importParam, importParam.complete, node.getAttribute(Word.MODULE_NAME), callback);
		this.loadComplete(importParam.moduleName);
	}
};

Loader.prototype.loadModule = function (importParam, complete, importModuleName, callback) {
	var define = ( this._isDefine_ ) ? this._defineQueue_.peek() : undefined;
	if(define && !importParam.isGlobal){
		this.loadDefineModule(importParam, callback, complete, importModuleName, define);
	}else{
		this.loadGlobalModule(importParam, callback, complete);
	}
};

Loader.prototype.loadDefineModule = function (importParam, callback, complete, importModuleName, define) {
	var _this = this;
	define(function (moduleData) {
		importParam.moduleData = moduleData;
		var module = _this.getModule(importParam, importModuleName);
		callback(module);
		complete();
	});
};

Loader.prototype.loadGlobalModule = function (importParam, callback, complete) {
	var moduleName = importParam.moduleName;
	var msg = moduleName;
	if( !importParam.isLib ){
		msg += ': There is no define function declared. ';
	}
	var globalModule = this.getGlobalModule(moduleName);
	( globalModule !== undefined ) ? callback({ data: globalModule, cache: true }) : msg += ' ※fail loading module.';
	complete();
	if(msg !== moduleName){
		Util.warn(msg);
	}
};

Loader.prototype.loadComplete = function (moduleName) {
	this._isDefine_ = false;
	this.removeScriptNode(moduleName);
};

Loader.prototype.getModule = function (importParam, importModuleName) {
	var moduleData = importParam.moduleData;
	var module = {};
	module.name = importModuleName;
	module.self = {};
	module.data = moduleData.define.apply(moduleData.paramModules||[], moduleData.paramModules);
	module.self[importModuleName] = module.data
	module.cache = moduleData.cache;
	return module;
};

Loader.prototype.removeScriptNode = function (moduleName) {
	var scriptNodes = document.getElementsByTagName('script');
	var scriptNode;
	
	Util.each(function (i, el) {
		scriptNode = scriptNodes[i];
		if(scriptNode.hasAttribute(Word.MODULE_NAME) && moduleName === scriptNode.getAttribute(Word.MODULE_NAME)){
			scriptNode.parentNode.removeChild(scriptNode);
			return false;
		}
	});
};

Loader.prototype.getGlobalModule = function (moduleName) {
	var g = window||global;
	var globalModule = g[moduleName] || undefined;
	if(globalModule !== undefined){
		delete g[moduleName];
	}
	return globalModule;
};

Loader.prototype.createNode = function (importParam) {
  var node = document.createElement('script');
  node.type = 'text/javascript';
  node.charset = 'utf-8';
  node.async = true;
  return node;
};

Loader.prototype.loadModuleAsString = function (url, fun) {
	Ajax.getAsync(url, function (loadedModuleString) {
		loadedModuleString = Util.removeAnnotation(loadedModuleString);
		var scriptData = this.getScriptFromString(loadedModuleString);
		fun(loadedModuleString, scriptData.modules, scriptData.nodes, scriptData.scripts);
	}.bind(this));
};

Loader.prototype.makeModuleFunction = function (str) {
	try{
		return Function(Word.MODULE, Word.EXPORTS, Word.MESSAGE, str);
	}catch (e) {
		Util.error('syntax error: ' + str);
	}
};

Loader.prototype.makeRender = function () {
	return function render (module, html, scripts, targetId, isRunScript) {
		var target = document.getElementById(targetId);
		target.innerHTML = html;
		
		if(isRunScript === false) return false;
		
		Util.each(scripts, function (i, el) {
			this.makeModuleFunction(this.transpile(el))(new Module(), {}, module.message.self());
		}.bind(this));
	}
};

Loader.prototype.getScriptFromString = function (loadedModuleString) {
	var 
		startIndex = 0, 
		endIndex = 0, 
		scriptStrObject = {}, 
		scriptNodeObject = {}, 
		scriptArray = [],
		moduleName,
		scriptNode, 
		script;
	
	if(loadedModuleString !== undefined && typeof loadedModuleString === 'string'){
		while( loadedModuleString.indexOf('<script') != -1 ){
			startIndex = loadedModuleString.indexOf('<script');
			endIndex = loadedModuleString.indexOf('</script');
	
			script = loadedModuleString.substring(startIndex, endIndex) + '</script>';
			
			loadedModuleString = loadedModuleString.substring(endIndex + 9/*'</script>'.length*/, loadedModuleString.length);
			
			try{
				scriptNode = Util.DOMParser.parseFromString(script, "application/xml").getElementsByTagName('script');
			}catch (e) {
				Util.error('syntax error:' + script);
			}

			if(scriptNode.length === 0){
				break;
			}
	
			script = script.substring(script.indexOf('>') + 1, script.indexOf('</script>'));

			scriptNode = scriptNode[0];
			
			if(this.isIgnoreScript(scriptNode)){
				continue;
			}
			
			if(this.isModuleScript(scriptNode)){
				moduleName = scriptNode.getAttribute(Word.MODULE_NAME);
				scriptNodeObject[moduleName] = scriptNode;
				scriptStrObject[moduleName] = script;
			}

			scriptArray.push(script);
		}
	}
	
	return { modules: scriptStrObject, nodes: scriptNodeObject, scripts: scriptArray }
};

Loader.prototype.isModuleScript = function (scriptNode) {
	return scriptNode.hasAttribute(Word.MODULE_NAME);
};

Loader.prototype.isIgnoreScript = function (scriptNode) {
	return scriptNode.hasAttribute(Word.MODULE_IGNORE) && 
				 scriptNode.getAttribute(Word.MODULE_IGNORE) === 'true';
};

Loader.prototype.imports = function (imports, config, fun) {
	var configDefaultDeps = config._self_.defaultDeps;
	var importPromise = new Promise();
	var paramModules = [];
  var importModules = {};
  var defaultDepArray, requireArray;
  var _this = this;
  
  Util.eachObj(imports, function (k, v, o) {
  	if(Array.isArray(o[k])){
  		importModules[k] = {};
  		importModules[k][Word.DEFAULT_DEPS] = {};
  		paramModules.push(importModules[k]);
  		
  		defaultDepArray = configDefaultDeps[k];
  		
  		//기본 로드 모듈과 인자로 호출한 모듈간 중복 제거
  	  requireArray = defaultDepArray.concat(v).filter(function (x, i, arr) {
  	  	return arr.indexOf(x) === i;
  	  });
  	  
  		Util.each(requireArray, function(i, el){
  			_this.importModule({
					type: k,
 					path: el,
 					config: config,
 					importPromise: importPromise,
					isDefault: ( defaultDepArray.indexOf(el) > -1 ) ? true : false,
					libData: config.getLibData(el),
					moduleName: Util.getNameFromPath(el),
					importModules: importModules,
				});
  		});
  		
  	}
  });
  
  importPromise.setComplete(function () {
  	fun(paramModules, function () {
  		_this._cache_.clear();
  	});
  });
  
  importPromise.start();
}

Loader.prototype.importModule = function (importParam) {
	importParam.setModuleDataFun	= function (requireWord, moduleData) {
		( importParam.isDefault === true ) 
		  ? importParam.importModules[requireWord][Word.DEFAULT_DEPS][importParam.moduleName] = moduleData 
		  : importParam.importModules[requireWord][importParam.moduleName] = moduleData;
	};
	
	importParam.type === Word.REQUIRE_JS     ? this.importModuleJs(importParam) 	    :
	importParam.type === Word.REQUIRE_PAGE ? this.importModuleNode(importParam) : 
	importParam.type === Word.REQUIRE_VIEW ? this.importModuleView(importParam) : 
	undefined;
};

Loader.prototype.importModuleJs = function (importParam) {
	var _this = this;
	var moduleName = importParam.moduleName;
	importParam.importPromise.add(moduleName, function (complete) {

		if(_this._cache_.has(moduleName)){
			importParam.setModuleDataFun(Word.REQUIRE_JS, _this._cache_.get(moduleName));
			complete();
			return false;
		}
		
		importParam.url = importParam.config.getResourceUrl(importParam.path);
		importParam.complete = complete;
		
		_this.loadModuleJs(importParam, function(module, cache){
			importParam.setModuleDataFun(Word.REQUIRE_JS, module);
			if(cache === true){
				_this._cache_.set(moduleName, module);
			}
		});
	});
};

Loader.prototype.importModuleNode = function (importParam) {
	var _this = this;
	var moduleName = importParam.moduleName;
	importParam.importPromise.add(moduleName, function (complete) {
		
		if(_this._cache_.has(moduleName)){
			importParam.setModuleDataFun(Word.REQUIRE_JS, _this._cache_.get(moduleName));
			complete();
			return false;
		}
		
		importParam.url = importParam.config.getRequestUrl(importParam.path);
		importParam.complete = complete;
		
		_this.loadModuleNode(importParam, function(module, cache){
			importParam.setModuleDataFun(Word.REQUIRE_PAGE, module);
			if(cache === true){
				_this._cache_.set(moduleName, module);
			}
		});
	});
};

Loader.prototype.importModuleView = function (importParam) {
	var cacheModuleName = importParam.moduleName + Word.CACHE_VIEW_SUFFIX;
	var _this = this;
	importParam.importPromise.add(importParam.moduleName, function (complete) {
		
		if(_this._cache_.has(cacheModuleName)){
			importParam.setModuleDataFun(Word.REQUIRE_JS, _this._cache_.get(cacheModuleName));
			complete();
			return false;
		}
		
		importParam.url = importParam.config.getRequestUrl(importParam.path);
		importParam.complete = complete;
		
		_this.loadModuleView(importParam, function(module){
	  	importParam.setModuleDataFun(Word.REQUIRE_VIEW, module.exports);
	 		_this._cache_.set(cacheModuleName, module.exports);
		});
	});
};





//Sync load
Loader.prototype.syncLoadModuleJs = function (name, url, libData) {
	var cacheName = Word.CACHE_SYNC_PREFIX + name;
	if(this._cache_.has(cacheName)){
		return this._cache_.get(cacheName);
	}
	
	if(libData !== undefined){
		url = libData.path;
	}
	
	var loadedModuleString = this.getModuleString(url);
	var module = new Module();
	this.makeModuleFunction(this.transpile(loadedModuleString))(module, module.exports, module.message.self());
	
	if(libData.isGlobal){
		module.exports = this.getGlobalModule(libData.self);
	}
	
	if(module.cache !== false){
		this._cache_.set(cacheName, module.exports);
	}
	
	return module.exports;
};

Loader.prototype.syncLoadModuleNode = function (name, url, libData) {
	var cacheName = Word.CACHE_SYNC_PREFIX + name;
	if(this._cache_.has(cacheName)){
		return this._cache_.get(cacheName);
	}
	
	if(libData !== undefined){
		url = libData.requestPath;
	}
	
	var loadedModuleString = this.getModuleString(url);
	var moduleObject = this.getScriptFromString(loadedModuleString).modules;
	var module = new Module();
	var tempModule;
	for(var key in moduleObject){
		tempModule = new Module();
		this.makeModuleFunction(this.transpile(moduleObject[key]))(tempModule, tempModule.exports, module.message.self());
		module.exports[key] = tempModule.exports;
	}
	
	if(module.cache !== false){
		this._cache_.set(cacheName, module.exports);
	}
	
	return module.exports;
};

Loader.prototype.syncLoadModuleNodeByName = function (name, url, libData, moduleNames) {
	var cacheName = Word.CACHE_SYNC_PREFIX + name;
	if(this._cache_.has(cacheName)){
		return this._cache_.get(cacheName);
	}
	
	if(libData !== undefined){
		url = libData.requestPath;
	}
	
	var loadedModuleString = this.getModuleString(url);
	var moduleObject = this.getScriptFromString(loadedModuleString).modules;
	var module = new Module();
	for(var key in moduleObject){
		if(moduleNames === key){
			this.makeModuleFunction(this.transpile(moduleObject[key]))(module, module.exports, module.message.self());
			break;
		}
	}
	
	if(module.cache !== false){
		this._cache_.set(cacheName, module.exports);
	}
	
	return module.exports;
};

Loader.prototype.syncLoadModuleView = function (name, url, libData) {
	var cacheName = Word.CACHE_SYNC_PREFIX + name + Word.CACHE_VIEW_SUFFIX;
	if(this._cache_.has(cacheName)){
		return this._cache_.get(cacheName);
	}
	
	if(libData !== undefined){
		url = libData.propPath;
	}
	
	var moduleStr = this.getModuleString(url);
	var scriptArray = this.getScriptFromString(moduleStr).scripts;
	var module = new ViewModule();
	module.initRender(this.makeRender().bind(this, module, moduleStr, scriptArray));
	
	if(module.cache !== false){
		;this._cache_.set(cacheName, module.exports);
	}
	
	return module.exports;
};

Loader.prototype.getModuleString = function (url) {
	var moduleStr;
	Ajax.getSync(url, function (loadedModuleString) {
		loadedModuleString = Util.removeAnnotation(loadedModuleString);
		moduleStr = loadedModuleString;
	});
	return moduleStr;
};
//Sync load end





module.exports = new Loader();