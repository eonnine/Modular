# Modular 
  
#  
* ## *outline*
  * #### 모듈화 도구
  * commonJs, requireJs와 같은 기능을 가진 라이브러리를 직접 구현해보고자 개발
  
#
* ## *Usage*

>### *Install*
```html
<script src='/modular.js'></script>
```
  
#
> ### *Config*
```javascript
modular.config({
  //true인 경우, 브라우저가 es6문법을 지원하지 않을 때 runtime es6 tranpile 합니다. 
  es6: false, 
  //js 파일을 로드하는 require 설정
  resource: { 
    //resource 경로에 자동으로 추가할 prefix를 설정합니다.
    path: '/js/', 
    //경로에 해당 패턴이 포함되어있다면 path속성을 적용하지 않습니다.
    excludePattern: '-lib', 
    //true인 경우, 경로에서 excludePatten에 해당하는 문자열을 삭제합니다.
    isRemovePatten: true 
  },
  //page를 로드하는 request, requestView 설정
  request: {
    //request url에 자동으로 추가할 prefix를 설정합니다.
    path: '',
    //url에 해당 패턴이 포함되어있다면 path속성을 적용하지 않습니다.
    excludePattern: '-pop',
    //true인 경우, url에서 excludePatten에 해당하는 문자열을 삭제합니다.
    isRemovePatten: true
  },
  //alias 및 외부 js 라이브러리를 설정합니다.
  lib: {
    //[alias]: { self: [라이브러리의 전역변수명], path: [파일 경로] } 
    //모듈 호출 시 alias가 모듈명이 됩니다.
    _: { self:'_', path: 'us.js' },
    $: { self:'$', path: 'jquery.js' },
    util: { path: 'util.js' },
    Babel: { path: '/es6/babel.min.js' },
    ComboBox: { path: '/common/comboBox.do' },
  },
  //외부 js 라이브러리의 의존성을 설정합니다. (플러그인 등)
  //구현 예정
  //shim: {
  //},
  //초기화 로드 모듈을 설정합니다.
  //로드가 완료된 모듈은 콜백 함수의 각 인자의 $default 속성에서 접근할 수 있습니다.
  defaultDeps: {
    require: ['Babel','$', '_', 'util'],
    request: ['ComboBox'],
    requestView: ['/view.do']
  }
});
```  
  
#
> ### *Load: Async*
| imports: *Function(deps: Object, callback: Function!)* |
| :-- |
deps { require: [String], request: [String], requestView: [String] }
```text
모듈 로드 함수입니다.
두 번째 파라미터에서 선언한 모듈들을 비동기 방식으로 로드합니다.  

모든 모듈의 로딩이 완료되면 콜백 함수가 실행되며 로드된 각 모듈이 콜백 함수의 인자로 전달됩니다.  
첫 번째와 두 번째 파라미터는 생략이 가능합니다.
```
  
| define: *Function(options: Object, deps: Object, callback: Function!)* |
| :-- |
options { cache: Boolean }
deps { require: [String], request: [String], requestView: [String] }
```text
모듈 정의 함수입니다.
해당 모듈 호출 시 콜백 함수가 리턴한 값이 내보내어집니다.

options.cache = false 일 때 해당 모듈은 로딩시 캐싱하지 않습니다.

※초기화 로드 모듈일 경우, 두 번째 파라미터는 빈 값이어야 합니다.※

이 외에는 imports와 동일합니다.
```

| require: *[path: String]* |
| :------------------ |
```text
배열에 선언된 경로의 Js파일들을 로드하며 각 모듈에 선언된 define함수의 반환값을 가져옵니다.

각 path의 확장자를 제외한 마지막 부분이 모듈명이 됩니다. 
( ex: [ '/js/module.js', '/js/validator.min.js' ] => { module: {...}, validator.min: {...} } )
```  
  
| request: *[url: String]* |
| :------------------ |
```text
배열에 선언된 url로 요청을 보낸 뒤 응답받은 페이지들의 스크립트 노드들을 로드합니다.
각 모듈에 선언된 define함수의 반환값을 가져옵니다.

각 url의 확장자를 제외한 마지막 부분이 모듈명이 됩니다. 
```  
  
| requestView: *[url: String]* |
| :-- |
```text
배열에 선언된 url로 요청을 보낸 뒤 응답받은 페이지들을 View 객체로 변환하여 가져옵니다..

각 url의 확장자를 제외한 마지막 부분이 모듈명이 됩니다. 
```  
  
#
> ### *Load: Sync*
| module, exports |
| :-------------- |
```text
모듈 내보내기 객체.
동기 방식으로 모듈을 로드할 때 접근가능한 객체입니다.

module.exports = {
  name: 'Anna',
  age: 20
};

혹은

exports.name = 'Anna';
exports.age = 20;
...

위와 같은 방법으로 내보내기할 수 있습니다.
```  
  
| require: *Function(path: String!)* |
| :-- |
```text
해당 경로에 맞는 Js파일을 로드합니다.
로드한 모듈에서 exports된 데이터를 반환합니다.
```  
  

| request: *Function(url: String!, moduleName: String)* |
| :-- |
```text
url로 요청을 보낸 뒤 응답받은 페이지의 스크립트 노드들을 로드합니다.
로드한 모듈에서 exports된 데이터를 반환합니다.

두 번째인자를 이용하여 특정 모듈만 로드할 수 있습니다. 생략 가능
```  
  

| requestView: *Function(url: String!)* |
| :-- |
```text
url로 요청을 보낸 뒤 응답받은 페이지를 View 객체로 변환합니다.
```  
  
#
* ## *Example*

> ### *Load: Async*
* #### Js
```javascript
//hello.js  
define({
  cache: false
}, { /* require: [], request: [], requestView: [] */
}, function () {
  return 'Hello Modular';
});
```
```javascript
imports({
  require: ['hello.js'],
}, function (_require) {
  console.log(_require); // { hello: 'Hello Modular' }
});
```  
   
   
* #### Script Node
```html
<!-- sample.html -->  
<html>
<body>
This is Sample Page
<body>

<script module-name="firstModule">
  define(function() {
    return 'first sample';
  });
</script>

<script module-name="secondModule" module-ignore="false">
  define({}, {}, function() {
    return 'second sample';
  });
</script>

<script module-name="ignoreModule" module-ignore="true">
  define({}, function() {
    return 'not loaded module';
  });
</script>
</html>
```
```javascript
imports({
  request: ['/sample.do']
}, function (_request) {  
  console.log(_request); // { sample: { firstModule: 'first sample', secondModule: 'second sample' } }
});
```  
  
  
* #### View
```html
<!-- view.html -->  
<html>
<body>
This is View Page
<body>

<script module-name="renderScript">
  alert('run script');
  message.on('init' ,function(message) {
    console.log('complete render => ', message);
  });
</script>

<script module-name="ignoreModule" module-ignore="true">
  alert('not run script');
</script>
</html>
```
```html
<html>
<body>
  <div id="renderArea"></div>
  <div id="renderAreaSecond"></div>
</body>
<script>
imports({
  requestView: ['/view.do']
}, function (_requestView) {  
  console.log(_requestView); // { view: { reunder: f(), postMessage: f(), destroy: f() } }
  
  var view = _requestView.view;
  
  view
  //'view.html' be inserted in elements ('renderArea','renderAreaSecond')
  //alert: 'run script'
  .render('renderArea,renderAreaSecond') 
  //run messageListener
  //console: 'complete render => helloView'
  .postMessage('init', 'hello View'); 
  
  //'view.html' be deleted in element ('renderArea')
  view.destroy('renderArea');
  
});
</script>
</html>
```  
  
#
> ### *Load: Sync*
* #### Js, Script Node, View
```javascript
//hello.js
module.exports = 'Hello Modular'  
  
  
//sample.html
<script module-name="firstModule">
  module.exports = 'first sample';
</script>  
  
<script module-name="secondModule" module-ignore="false">
  module.exports = 'second sample';
</script>  
  
<script module-name="ignoreModule" module-ignore="true">
  exports.name = 'eonnine';
  exports.age = 29;
  exports.gender = male;
</script>  
```

```javascript
var hello = require('hello.js'); //'Hello Modular'
var sample = request('/sample.do'); //{ firstModule: 'first sample', secondModule: 'second sample' }
var secondModule = request('/sample.do', 'secondModule'); //'second sample'
var view = requestView('/view.do'); //{ reunder: f(), postMessage: f(), destroy: f() }
```
  
* ## *support browser*  
| chrome | firefox | sapari | opera | ie edge | ie 10++ |
| :----- | :-----: | :----: | :---: | :-----: | ------: |


***

* ## *history*  
#
> *2019-05-31*  
- require, request, requestView, module, exports 기능 추가  
  
- module 및 exports로 데이터 내보내기  
- 내보낸 데이터를 require(js), request(response view), requestView(response view의 렌더링 기능 및 메시지 통신 기능) 를 통해 동기적으로 가져오기   
***
> *2019-06-09*  
- imports, define 기능 추가  
  
- 모듈 가져오기와 종속성 모듈 가져오기를 비동기로 처리  
***
> *2019-06-09*  
- 로드가 완료된 스크립트 태그 삭제 처리  
- 데이터 캐시 기능과 외부 js 라이브러리 로드 기능 추가  
***
> *2019-06-16*
- Es6 transpile 옵션 추가 (Babel)  
- 주석된 코드는 인식하지 않게 처리  
***
> *2019-06-19*
- 비동기 로드 방식 개선
- default 모듈 옵션 추가  
  
***
> *이후 작업 예정*
- 라이브러리 의존성 설정 (shim, 플러그인 등) 기능 추가  




