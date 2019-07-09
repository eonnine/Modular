(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
//this source must be built by browserify
require('./main');
},{"./main":2}],2:[function(require,module,exports){
(function (module) {
	for(var key in module) this[key] = module[key];
}((function () {
	'use strict'

	//import+++
	var Promise = require('./util/promise');
	var Polyfill = require('./util/polyfill');
	var Queue = require('./util/queue');
	var Word = require('./util/word');
	var Ajax = require('./util/ajax');
	var Util = require('./util/util');
	
	var Loader = require('./module/loader');
	var Config = require('./module/config');
  //import---
	
	Polyfill();
	
	var _config_ = new Config();
	var _queue_ = new Queue();
	var _modular_ = {};

	Loader.init(_config_);
	
  _modular_[Word.REQUIRE_IMPORT] = function (imports, fun) {
  	_queue_.offer(function () {
	  	setTimeout(function () {
	  		Loader.imports(	imports, _config_, function (paramModules, clearCache) {
				  fun.apply(paramModules, paramModules);
					clearCache();
				});
	  	}, 20);
  	});
  };
	 
	_modular_[Word.MODULAR_CONFIGURE] = {
	  config: function (props) {
	    _config_.set(props);
	  }
	};
	 
	return _modular_;
}())));
},{"./module/config":3,"./module/loader":4,"./util/ajax":9,"./util/polyfill":11,"./util/promise":12,"./util/queue":13,"./util/util":14,"./util/word":15}],3:[function(require,module,exports){
'use strict'

var Word = require('../util/word');
var Util = require('../util/util');

var Module = require('./module');

//var Es6 = require('../es6/es6');

var Config = function (option) {
	
	this._self_ = {
		es6: false,
		resource: {
			path: '',
			excludePattern: '',
			isRemovePatten: true
		},
		request: {
			path: '',
			excludePattern: '',
			isRemovePatten: true
		},
		lib: {},
		alias: {},
		shim: {},
		defaultDeps: {
			require: [],
			request: [],
			requestView: [],
		}
	};
	
};

Config.prototype.set = function (props) {
	var setConfig = function (config, props) {
		Util.eachObj(props, function(key, value){
			if( typeof props[key] === 'object' && Object.keys(props[key]).length > 0 ){
				setConfig(config[key], props[key]);
			}
			if( props[key] != undefined && typeof props[key] != 'object' ){
				
				if(config !== undefined)
  			config[key] = props[key];
			}
		});
	}
	
	setConfig(this._self_, props);
	
	var lib = this._self_.lib;
	Util.eachObj(props.lib, function (k, v) {
		lib[k] = v;
	});
	
	var alias = this._self_.alias;
	Util.eachObj(props.alias, function (k, v) {
		alias[k] = v;
	});
	
	var shim = this._self_.shim;
	Util.eachObj(props.shim, function (k, v) {
		shim[k] = v;
	});
	
	/*if(this._self_.es6 === true && !Util.isEs6Browser){
		Es6.init();
	}*/
	
	this.setConfigValidator(this._self_);
};

Config.prototype.setConfigValidator = function (c) {
	c.resource.isRemovePatten = ( c.resource.isRemovePatten !== true ) ? false : true;
	c.request.isRemovePatten = ( c.request.isRemovePatten !== true ) ? false : true;
	c.resource.excludePattern = ( c.resource.excludePattern == undefined ) ? undefined : c.resource.excludePattern;
	c.request.excludePattern = ( c.request.excludePattern == undefined ) ? undefined : c.request.excludePattern;
};

Config.prototype.getResourceUrl = function (path) {
	return this.makePath(path, this._self_.resource);
};

Config.prototype.getRequestUrl = function (path) {
	return this.makePath(path, this._self_.request);
};

Config.prototype.getLibData = function (path) {
  var lib = this._self_.lib[path];
	if(lib === undefined){
		return undefined;
	}
	return {
		self: lib.self||path, 
		propPath: lib.path||path,
		requestPath: this.concat(this._self_.lib[path].path, this._self_.request.path),
	  path: this.concat(this._self_.lib[path].path, this._self_.resource.path),
		isGlobal: ( lib.self ) ? true : false,
	};
};

Config.prototype.getAliasData = function (path) {
  var alias = this._self_.alias[path];
	if(alias === undefined){
		return undefined;
	}
	return {
		propPath: alias.path||path,
		requestPath: this.concat(this._self_.alias[path].path, this._self_.request.path),
	  path: this.concat(this._self_.alias[path].path, this._self_.resource.path),
	};
}

Config.prototype.makePath = function (path, r) {
	
	if(path === undefined || path.replace(/\s/gi) === ''){
		Util.error('There is empty path');
	}
	
	var lib = this._self_.lib;
	if( lib.hasOwnProperty(path) && lib[path].hasOwnProperty('path') ){
		return this.concat(lib[path].path, r.path); 
	}
	
	var isExclude = this.isExcludePattern(path, r.excludePattern);
	path = ( r.isRemovePatten ) ? path.replace(r.excludePattern, '') : path;
	return ( isExclude ) ? path : this.concat(path, r.path);
};

Config.prototype.concat = function (path, resourcePath) {
	path = ( resourcePath != undefined && typeof resourcePath === 'string' ) ? resourcePath + path : path;
	return path.replace(/\/\//g,'\/');
};

Config.prototype.isExcludePattern = function (path, excludePattern) {
	var isExclude = false;
	
	if(excludePattern === '/') return isExclude = true;
	if(excludePattern !== undefined && excludePattern.replace(/\s\S/g, '') !== ''){
		var excludeArray = excludePattern.split(',').map(function(el){
	     return el.replace(/\s/gi, '');
		 });

		var patternIndex = path.indexOf(excludePattern);

		if( patternIndex !== -1 ) isExclude = true;
	}
	return isExclude;
};

module.exports = Config;
},{"../util/util":14,"../util/word":15,"./module":7}],4:[function(require,module,exports){
(function (global){
'use strict'

var Promise = require('../util/promise');
var Queue = require('../util/queue');
var Cache = require('../util/cache');
var Word = require('../util/word');
var Ajax = require('../util/ajax');
var Util = require('../util/util');

var ViewModule = require('./module-view');
var Module = require('./module');

// var Es6 = require('../es6/es6');

var Loader = function() {
	this._isDefine_ = false;
	this._defineQueue_ = new Queue();
	this._cache_ = new Cache();
};

Loader.prototype.init = function(config) {

	this._defineQueue_.stop();

	var define = function(moduleOption, imports, fun) {

		var _this = this;

		if (fun === undefined) {
			fun = imports;
			imports = moduleOption;
			moduleOption = undefined;
		}

		if (fun === undefined) {
			fun = imports;
			imports = undefined;
		}

		var moduleName = undefined;
		var cache = true;

		if (typeof moduleOption === 'string') {
			moduleName = moduleOption;
		} else if (typeof moduleOption === 'object') {
			moduleName = (moduleOption.name != null && moduleOption.name.replace(/\s/g, '') !== '') ? moduleOption.name : moduleName;
			cache = (moduleOption.cache === false) ? false : cache;
		}

		moduleName = undefined;

		_this._isDefine_ = true;

		_this._defineQueue_.offer(function(afterLoadScript) {
			_this.imports(imports, config, function(paramModules, clearCache) {
				afterLoadScript({
					define : fun,
					paramModules : paramModules,
					cache : cache
				});
			});
		});

	}.bind(this);

	define.amd = {
		modular : true
	};

	window[Word.DEFINE] = define;
};

Loader.prototype.transpile = function(moduleString) {
	return moduleString;
	// return ( Es6.isTranspile ) ? Es6.Transpiler.transform(moduleString, {
	// presets: [Word.ES6_PRESET] }).code : moduleString;
};

Loader.prototype.loadModuleJs = function(importParam, callback) {
	this.load(importParam, function(module) {
		callback(module.data, module.cache);
	});
};

Loader.prototype.loadModuleNode = function(importParam, callback) {
	var _this = this;
	var messageModule = new Module();
	var module = {};
	var cache = true;
	var promise = new Promise(function() {
		callback(module, cache);
		importParam.complete();
	});

	if (importParam.libData !== undefined) {
		importParam.url = importParam.libData.requestPath;
	} else if(importParam.aliasData !== undefined) {
		importParam.url = importParam.aliasData.requestPath;
	}

	importParam.isGlobal = false;
	this.loadModuleAsString(importParam.url, function(moduleStr, scriptData) {
		Util.eachObj(scriptData.modules, function(k, v, o) {
			promise.add(k, function(complete) {
				_this.makeModuleFunction(_this.transpile(v))(new Module(), {});
				_this.loadModule(importParam, complete, k, function(defineModule) {
					Util.assign(module, defineModule.self);
					/**
					 * 페이지의 모듈 중에서 cache 속성이 false인 모듈이 있다면 모든 모듈을 non-caching
					 */
					cache = (cache === true && defineModule.cache === false) ? false : cache;
					complete();
				});
				_this.loadComplete(k);
			});
		});

		promise.start();
	});
};

Loader.prototype.loadModuleView = function(importParam, callback) {
	var libData = importParam.libData;
	
	if (importParam.libData !== undefined) {
		importParam.url = importParam.libData.requestPath;
	} else if(importParam.aliasData !== undefined) {
		importParam.url = importParam.aliasData.requestPath;
	}

	var module = new ViewModule(Util.getNameFromPath(importParam.url), this._cache_);

	this.loadModuleAsString(importParam.url, function(moduleStr, scriptData) {
		module.initRender(
			this.makeRender().bind(this, module, moduleStr, scriptData),
			this.makeRenderModuleFunction(this.transpile(scriptData.renderScript.constructor))
		);
		callback(module);
		importParam.complete();
	}.bind(this));
};

Loader.prototype.load = function(importParam, callback) {
	var libData = importParam.libData;
	var loadEventListener;

	var head = document.getElementsByTagName('head')[0];
	var node = this.createNode(importParam);

	if (libData !== undefined) {
		importParam.url = libData.path;
		importParam.moduleName = libData.self;
		importParam.isGlobal = libData.isGlobal;
		importParam.isLib = true;
	} else if(importParam.aliasData !== undefined){
		importParam.url = importParam.aliasData.path;
	} else {
		importParam.isGlobal = false;
		importParam.isLib = false;
	}

	node.src = importParam.url;
	node.setAttribute(Word.MODULE_NAME, importParam.moduleName);

	/*
	 * if(Es6.isTranspile && isLib === false){ this.loadModuleAsString(node.src,
	 * function (loadedModuleString) { node.removeAttribute('src');
	 * this.makeModuleFunction(this.transpile(loadedModuleString))({}, {}, {});
	 * this.loadModule(importParam, importParam.complete, moduleName, callback);
	 * this.loadComplete(moduleName); }.bind(this));
	 * 
	 * }else{
	 */
	loadEventListener = function(evt) {
		this.onLoadScript(evt, importParam, node, loadEventListener, callback);
	}.bind(this);

	node.addEventListener('load', loadEventListener, false);
	head.appendChild(node);
	// }

};

Loader.prototype.onLoadScript = function(evt, importParam, node,
		loadEventListener, callback) {
	if (evt.type === 'load') {
		node.removeEventListener(node, loadEventListener, evt.type);
		this.loadModule(importParam, importParam.complete, node.getAttribute(Word.MODULE_NAME), callback);
		this.loadComplete(importParam.moduleName);
	}
};

Loader.prototype.loadModule = function(importParam, complete, importModuleName,
		callback) {
	var define = (this._isDefine_) ? this._defineQueue_.peek() : undefined;
	if (define && !importParam.isGlobal) {
		this.loadDefineModule(importParam, callback, complete, importModuleName, define);
	} else {
		this.loadGlobalModule(importParam, callback, complete);
	}
};

Loader.prototype.loadDefineModule = function(importParam, callback, complete, importModuleName, define) {
	var _this = this;
	define(function(moduleData) {
		importParam.moduleData = moduleData;
		var module = _this.getModule(importParam, importModuleName);
		callback(module);
		complete();
	});
};

Loader.prototype.loadGlobalModule = function(importParam, callback, complete) {
	var moduleName = importParam.moduleName;
	var msg = moduleName;
	if (!importParam.isLib) {
		msg += ': There is no define function declared. ';
	}
	var globalModule = this.getGlobalModule(moduleName);
	(globalModule !== undefined) ? callback({ data : globalModule, cache : true }) : msg += ' ※fail loading module.';
	complete();
	if (msg !== moduleName) {
		Util.warn(msg);
	}
};

Loader.prototype.loadComplete = function(moduleName) {
	this._isDefine_ = false;
	this.removeScriptNode(moduleName);
};

Loader.prototype.getModule = function(importParam, importModuleName) {
	var moduleData = importParam.moduleData;
	var module = {};
	module.name = importModuleName;
	module.self = {};
	module.data = moduleData.define.apply(moduleData.paramModules || [], moduleData.paramModules);
	module.self[importModuleName] = module.data;
	module.cache = moduleData.cache;
	return module;
};

Loader.prototype.removeScriptNode = function(moduleName) {
	var scriptNodes = document.getElementsByTagName('script');
	Util.each(scriptNodes, function(i, scriptNode) {
		if (scriptNode.hasAttribute(Word.MODULE_NAME)
				&& moduleName === scriptNode.getAttribute(Word.MODULE_NAME)) {
			scriptNode.parentNode.removeChild(scriptNode);
			return false;
		}
	});
};

Loader.prototype.getGlobalModule = function(moduleName) {
	var g = window || global;
	var globalModule = g[moduleName] || undefined;
	if (globalModule !== undefined) {
		delete g[moduleName];
	}
	return globalModule;
};

Loader.prototype.createNode = function(importParam) {
	var node = document.createElement('script');
	node.type = 'text/javascript';
	node.charset = 'utf-8';
	node.async = true;
	return node;
};

Loader.prototype.loadModuleAsString = function(url, fun) {
	Ajax
			.getAsync(
					url,
					function(loadedModuleString) {
						loadedModuleString = Util.removeAnnotation(loadedModuleString);
						var scriptData = this.getScriptFromString(loadedModuleString);
						fun(loadedModuleString, scriptData);
					}.bind(this));
};

Loader.prototype.makeModuleFunction = function(str) {
	return this.makeFunction([ Word.MODULE, Word.EXPORTS ], str);
};

Loader.prototype.makeRenderModuleFunction = function(str) {
	return this.makeFunction([ Word.MESSAGE, Word.RENDER_CONSTRUCTOR ], str);
};

Loader.prototype.makeFunction = function(args, str) {
	try {
		return Function(args, /*'"use strict" \n ' +*/ str);
	} catch (e) {
		Util.error('syntax error: ' + str);
		return undefined;
	}
};

Loader.prototype.makeRender = function() {
	return function render(module, html, scriptData, param) {
		var _this = this;
		var target = document.getElementById(param.targetId);
		var scripts = scriptData.scripts;
		
		if( !_this._cache_.hasChild(param.originRenderElementName, param.targetId) ){
			_this._cache_.setChild(param.originRenderElementName, param.targetId, target.innerHTML);
		}
		
		target.innerHTML = html;

		param.setModuleScope({
			self : target.querySelector('[' + Word.MODULE_ELEMENT + ']')
		});

		if (!param.isRunScript) {
			return false;
		}
		
		Util.eachObj(scripts, function(k, v, o) {
			var renderFun;
			if (_this._cache_.hasChild(param.moduleName, k)) {
				renderFun = _this._cache_.get(param.moduleName, k);
			} else {
				renderFun = _this.makeRenderModuleFunction(_this.transpile(v))
				_this._cache_.setChild(param.moduleName, k, renderFun);
			}
			renderFun(module.message.self(), function() {});
		});

	}
};

Loader.prototype.getScriptFromString = function(loadedModuleString) {
	var startIndex = 0, endIndex = 0, renderScript = {}, scriptStrModules = {}, scriptNodeObject = {}, scriptStrObject = {}, moduleName, scriptNode, script;

	if (loadedModuleString !== undefined
			&& typeof loadedModuleString === 'string') {
		while (loadedModuleString.indexOf('<script') != -1) {
			startIndex = loadedModuleString.indexOf('<script');
			endIndex = loadedModuleString.indexOf('</script');

			script = loadedModuleString.substring(startIndex, endIndex) + '</script>';

			loadedModuleString = loadedModuleString.substring(
					endIndex + 9/* '</script>'.length */, loadedModuleString.length);

			try {
				scriptNode = Util.DOMParser.parseFromString(script, "application/xml").getElementsByTagName('script');
			} catch (e) {
				Util.error('syntax error:' + script);
			}

			if (scriptNode.length === 0) {
				break;
			}

			script = script.substring(script.indexOf('>') + 1, script.indexOf('</script>'));

			scriptNode = scriptNode[0];

			if (this.isRenderConstructor(scriptNode)) {
				scriptNode.setAttribute(Word.MODULE_IGNORE, 'true');
				renderScript.constructor = script;
			}

			if (this.isIgnoreScript(scriptNode)) {
				continue;
			}

			moduleName = scriptNode.getAttribute(Word.MODULE_NAME);

			if (moduleName == undefined || Util.trim(moduleName) === '') {
				Util.error('"' + Word.MODULE_NAME + '" property is required: \n' + script);
			}

			scriptNodeObject[moduleName] = scriptNode;
			scriptStrModules[moduleName] = script;
			scriptStrObject[moduleName] = script;

		}
	}

	return {
		modules : scriptStrModules,
		nodes : scriptNodeObject,
		scripts : scriptStrObject,
		renderScript : renderScript
	};
};

Loader.prototype.isRenderConstructor = function(scriptNode) {
	return scriptNode.hasAttribute(Word.MODULE_RENDER)
			&& (scriptNode.getAttribute(Word.MODULE_RENDER) === 'constructor');
}

Loader.prototype.isIgnoreScript = function(scriptNode) {
	return scriptNode.hasAttribute(Word.MODULE_IGNORE)
			&& scriptNode.getAttribute(Word.MODULE_IGNORE) === 'true';
};

Loader.prototype.imports = function(imports, config, fun) {
	var configDefaultDeps = config._self_.defaultDeps;
	var importPromise = new Promise();
	var paramModules = [];
	var importModules = {};
	var defaultDepArray, requireArray;
	var _this = this;

	Util.eachObj(imports, function(k, v, o) {
		if (Array.isArray(o[k])) {
			importModules[k] = {};
			importModules[k][Word.DEFAULT_DEPS] = {};
			paramModules.push(importModules[k]);

			defaultDepArray = configDefaultDeps[k];

			// 기본 로드 모듈과 인자로 호출한 모듈간 중복 제거
			requireArray = defaultDepArray.concat(v).filter(function(x, i, arr) {
				return arr.indexOf(x) === i;
			});

			Util.each(requireArray, function(i, el) {
				_this.importModule({
					type : k,
					path : el,
					config : config,
					importPromise : importPromise,
					isDefault : (defaultDepArray.indexOf(el) > -1) ? true : false,
					libData : config.getLibData(el),
					aliasData : config.getAliasData(el),
					moduleName : Util.getNameFromPath(el),
					importModules : importModules,
				});
			});

		}
	});

	importPromise.setComplete(function() {
		fun(paramModules, function() {
			_this._cache_.clear();
		});
	});

	importPromise.start();
}

Loader.prototype.importModule = function(importParam) {
	importParam.setModuleDataFun = function(requireWord, moduleData) {
		(importParam.isDefault === true) 
	    ? importParam.importModules[requireWord][Word.DEFAULT_DEPS][importParam.moduleName] = moduleData
			: importParam.importModules[requireWord][importParam.moduleName] = moduleData;
	};

	if(importParam.type === Word.REQUIRE_JS){
		this.importModuleJs(importParam);
	} else if(importParam.type === Word.REQUIRE_PAGE){
		this.importModuleNode(importParam);
	} else if(importParam.type === Word.REQUIRE_VIEW){
		this	.importModuleView(importParam);
	}
};

Loader.prototype.importModuleJs = function(importParam) {
	var _this = this;
	var moduleName = importParam.moduleName;
	importParam.importPromise.add(moduleName, function(complete) {

		if (_this._cache_.has(moduleName)) {
			importParam.setModuleDataFun(Word.REQUIRE_JS, _this._cache_.get(moduleName));
			complete();
			return false;
		}

		importParam.url = importParam.config.getResourceUrl(importParam.path);
		importParam.complete = complete;

		_this.loadModuleJs(importParam, function(module, cache) {
			importParam.setModuleDataFun(Word.REQUIRE_JS, module);
			if (cache === true) {
				_this._cache_.set(moduleName, module);
			}
		});
	});
};

Loader.prototype.importModuleNode = function(importParam) {
	var _this = this;
	var moduleName = importParam.moduleName;
	importParam.importPromise.add(moduleName, function(complete) {

		if (_this._cache_.has(moduleName)) {
			importParam.setModuleDataFun(Word.REQUIRE_JS, _this._cache_
					.get(moduleName));
			complete();
			return false;
		}

		importParam.url = importParam.config.getRequestUrl(importParam.path);
		importParam.complete = complete;

		_this.loadModuleNode(importParam, function(module, cache) {
			importParam.setModuleDataFun(Word.REQUIRE_PAGE, module);
			if (cache === true) {
				_this._cache_.set(moduleName, module);
			}
		});
	});
};

Loader.prototype.importModuleView = function(importParam) {
	var cacheModuleName = importParam.moduleName + Word.CACHE_VIEW_SUFFIX;
	var _this = this;
	importParam.importPromise.add(importParam.moduleName, function(complete) {

		if (_this._cache_.has(cacheModuleName)) {
			importParam.setModuleDataFun(Word.REQUIRE_JS, _this._cache_.get(cacheModuleName));
			complete();
			return false;
		}

		importParam.url = importParam.config.getRequestUrl(importParam.path);
		importParam.complete = complete;

		_this.loadModuleView(importParam, function(module) {
			importParam.setModuleDataFun(Word.REQUIRE_VIEW, module.exports);
			_this._cache_.set(cacheModuleName, module.exports);
		});
	});
};

module.exports = new Loader();
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../util/ajax":9,"../util/cache":10,"../util/promise":12,"../util/queue":13,"../util/util":14,"../util/word":15,"./module":7,"./module-view":6}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
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
		
		if(_this.isCompleteConstructor === true && _this.postQueue.length() === 0){
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
		if(_this.isCompleteConstructor === true && _this.postQueue.length() === 0){
			_this.exports.postMessage('destroy');
			beginDestroy(idsString, _this.id, _this.renderIds, _this.viewCache);
		}else{
			_this.postQueue.offer(function () {
				_this.exports.postMessage('destroy');
				beginDestroy(idsString, _this.id, _this.renderIds, _this.viewCache);
			});
		}
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

function beginDestroy (idsString, id, renderIds, viewCache) {
	var originRenderElementName = id + Word.CACHE_VIEW_RENDER_ORIGIN_ELEMENT_SUFFIX;
	var renderIds = renderIds;
	var idsArray = idsString == undefined ? undefined : idsString.split(',');
	
	Util.eachRvs(renderIds, function (i, el) {
		if(idsString === undefined || idsArray.indexOf(el) != -1 ){
			var parent = document.getElementById(el);
			if( viewCache.hasChild(originRenderElementName, el) ){
				parent.innerHTML = viewCache.get(originRenderElementName, el);
			} else {
				while (parent.firstChild) {
					parent.removeChild(parent.firstChild);
				}
			} 
			
			renderIds.splice(i, 1);
		}
	});
}

module.exports = ViewModule;
},{"../util/Util":8,"../util/promise":12,"../util/queue":13,"../util/word":15,"./module":7}],7:[function(require,module,exports){
'use strict'

var Message = require('./message');
var Util = require('../util/Util');

var Module = function (id) {
	
	this._create_ = function () {
		var module = this.createModule();
		module.message = new Message(id);
		module.cache = true;
		module.id = id;
		Util.defineProperty(module, 'exports');
		Util.defineProperty(module, 'cache', { configurable: false, enumerable: false, writable : true });
		return module;
	};
	
	return this._create_();
};

Module.prototype.createModule = function () {
	var module = {};
	module.exports = this.createExports();
	return module;
};

Module.prototype.createExports = function () {
	var exports = {};
	return exports;
};

module.exports = Module;
},{"../util/Util":8,"./message":5}],8:[function(require,module,exports){
'use strict'

var Word = require('./word');

var Util = {
  
	DOMParser: new DOMParser(),
		
	assign: function  (target, obj) {
		for(var k in obj){
			target[k] = obj[k];
		}
	},
	
  each: function (ary, func) {
    if (ary) {
      var i;
      for (i = 0; i < ary.length; i++) {
        if (ary[i] && func(i, ary[i]) === false){
        	return false;
        }
      }
    }
    return true;
  },
  
  eachRvs: function (ary, func) {
    if (ary) {
      var i;
      for (i = ary.length-1; i >= 0; i--) {
        if (ary[i] && func(i, ary[i]) === false){
        	return false;
        }
      }
    }
    return true;
  },

  eachObj: function (obj, func) {
  	if(obj){
	    var key;
	    for (key in obj) {
	      if (!func(key, obj[key], obj) === false){
	      	return false;
	      }
	    }
  	}
  	return true;
  },
  
  defineProperty: function (module, propNm, descriptor) {
  	descriptor = descriptor || { configurable: false, enumerable: false };
  	Object.defineProperty(module, propNm, descriptor);
  },
  
	getNameFromPath: function (str) {
		str = String(str);
		var index = 0;
		index += 
						 ( str.split('./')[0] === './' ) ? 2 :
						 ( str[0] === '/' ) ? 1 : 
						 0;
		if(index != 0){
			str = str.substring(index, str.length);
		}
		
		index = str.lastIndexOf('/');
		if(index != -1){
			str = str.substring(index+1, str.length);
		}
		
		index = str.lastIndexOf('.');
		if(index != -1){
			str = str.substring(0, index);
		}
		return str;
	},
	
	trim: function (str) {
		return str.replace(/\s\S/g, '');
	},
	
	isEs6Browser: (function () {
	  try {
	      eval('function foo(bar, ...rest) { return 1; };');
	  } catch (error) {
	      return false;
	  }
	  return true;
	}()),
	
	removeAnnotation: function (str) {
		return str.replace(/(\/\*(\s|\S)*?\*\/)|<!-{2,}(\s|\S)*?-{2,}>|^\/\/.*/g, '');
	},
	
	warn: function (msg) {
		console.warn('modular >> ' + msg);
	},
	
	error: function (msg) {
		console.error('modular >> ' + msg);
	},
	
};

module.exports = Util;
},{"./word":15}],9:[function(require,module,exports){
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
},{"./util":14}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
var polyfill = function () {
	
	
};

module.exports = polyfill;
},{}],12:[function(require,module,exports){
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
},{"../util/util":14}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"./word":15,"dup":8}],15:[function(require,module,exports){
'use strict'

var WordMap = {
	REQUIRE_PAGE: 'request',
	REQUIRE_JS: 'require',
	REQUIRE_VIEW: 'requestView',
	REQUIRE_IMPORT: 'imports',
	DEFAULT_DEPS: '$default',
	MODULE: 'module',
	EXPORTS: 'exports',
	MESSAGE: 'message',
	DEFINE: 'define',
	MODULAR_CONFIGURE: 'modular',
	MODULE_NAME: 'modular-name',
	MODULE_IGNORE: 'modular-ignore',
	MODULE_ELEMENT: 'modular-module',
	MODULE_RENDER: 'modular-render',
	RENDER_CONSTRUCTOR: 'renderConstructor',
	ES6_TYPE: 'text/babel',
	ES6_PRESET: 'es2015',
	CACHE_SYNC_PREFIX: 'cache-sync-',
	CACHE_VIEW_SUFFIX: '-view',
	CACHE_VIEW_RENDER_FUN_SUFFIX: '-view-render-fun',
	CACHE_VIEW_RENDER_ORIGIN_ELEMENT_SUFFIX: '-view-render-origin-element',
}

module.exports = WordMap;
},{}]},{},[1]);
