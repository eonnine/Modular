'use strict'

var Es6 = function () {
	this.Transpiler = undefined;
	this.isTranspile = false;
};

Es6.prototype.init = function () {
	/*
	require("./babel-polyfill");
	this.Transpiler = require('./babel.min');
	this.Transpiler.disableScriptTags();
	this.isTranspile = true;
	*/
};

module.exports = new Es6();

