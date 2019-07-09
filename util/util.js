'use strict'

var Word = require('./word');

var Util = {
  
	DOMParser: new DOMParser(),
	
	regExp : {
		scriptAreas: /<script(\s)(modular-name|modular-render)(\s|\S)*?(\s|\S)*?<\/script(\s|\S)*?>/g,
		scriptTags: /<script(\s|\S)*?\>|\<\/script(\s|\S)*?\>/g,
		annotaion: /(\/\*(\s|\S)*?\*\/)|<!-{2,}(\s|\S)*?-{2,}>|^\/\/.*|(\/\/.*)/g,
	},
	
	assign: function  (target, obj) {
		for(var k in obj){
			target[k] = obj[k];
		}
	},
	
  each: function (ary, func) {
    if (ary) {
      var i, len;
      for (i=0, len=ary.length; i < len; i++) {
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
      for (i=ary.length-1; i >= 0; i--) {
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
	
	parseDOMFromString: function (str, tagName) {
		return this.DOMParser.parseFromString(str, "application/xml").getElementsByTagName(tagName);
	}, 
	
	removeAnnotation: function (str) {
		return str.replace(this.regExp.annotaion, '');
	},
	
	warn: function (msg) {
		console.warn('modular >> ' + msg);
	},
	
	error: function (msg) {
		console.error('modular >> ' + msg);
	},
	
};

module.exports = Util;