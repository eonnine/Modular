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