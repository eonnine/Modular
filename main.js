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