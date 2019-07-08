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