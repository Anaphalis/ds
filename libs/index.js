'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IM = exports.DS = undefined;

var _nerv = require('./nerv');

var _nerv2 = _interopRequireDefault(_nerv);

var _event = require('./event');

var _event2 = _interopRequireDefault(_event);

var _util = require('./util');

var _im = require('./im');

var _im2 = _interopRequireDefault(_im);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//数据源对外接口部分
//ds 数据源树形结构
//setter 回调存放
//ps 代理存放
//caster
function DS(pathString, value) {
  if (value === undefined) {
    //get模式
    if (proxyMap[pathString]) {
      pathString = proxyMap[pathString]['eventType'];
    }
    return DS.getDataByPath(pathString);
  } else if ((0, _util.isRawObject)(value)) {
    //set模式
    if (proxyMap[pathString]) {
      pathString = proxyMap[pathString]['eventType'];
    }
    DS.setDataByPath(pathString, value);
  } else {
    console.error('输入错误，必须为普通对象');
  }
}
var ds = DS.ds = {};
var proxyMap = DS.proxyMap = {};
var nerv = DS.nerv = new _nerv2.default(DS);
DS.EventBus = _event2.default;
DS.caster = _event2.default.eventList;
DS.toString = function () {
  return 'DS() { [native code] }';
};
DS.getDataByPath = function (pathString) {
  var path = pathString.split('.');
  var obj = DS.ds;
  while (path.length !== 0) {
    var field = path.shift();
    obj = obj[field];
  }
  return obj;
};
DS.create = function (root) {
  if (!ds[root]) ds[root] = {};
};
DS.setDataByPath = function (pathString, value) {
  //console.log('DS setDataByPath',pathString);
  var order = { pathString: pathString, value: value };
  nerv.pushOrder(order);
};
DS.regist = function (pathString, cb) {
  _event2.default.addEventListener({
    eventType: pathString,
    callback: cb
  });
};
DS.cancel = function (pathString, cb) {
  _event2.default.removeEventListener({
    eventType: pathString,
    callback: cb
  });
};
DS.proxy = function (proxyPathString, pathString) {
  DS.dropProxy(proxyPathString); //先扔掉之前的代理
  var proxy = {
    eventType: pathString,
    callback: function callback(data) {
      _event2.default.dispatchEvent(proxyPathString, data);
    }
  };
  proxyMap[proxyPathString] = proxy; //如果想一个代理代理多个就改这里
  _event2.default.addEventListener(proxy);
  //立刻广播一下
  _event2.default.dispatchEvent(proxyPathString, DS(pathString));
};
DS.dropProxy = function (proxyPathString) {
  if (!proxyMap.hasOwnProperty(proxyPathString)) return;
  //console.log('dropProxy',proxyPathString);
  var proxy = proxyMap[proxyPathString];
  _event2.default.removeEventListener(proxy);
  //广播一下
  _event2.default.dispatchEvent(proxyPathString, DS.info.dropProxyInfo);
};
DS.getProxyPath = function (proxyPathString) {
  if (!proxyMap.hasOwnProperty(proxyPathString)) return false;
  return proxyMap[proxyPathString].eventType;
};
//部分更新，只更新和增加，不删除
DS.upsert = function (pathString, value) {
  if (!(0, _util.isRawObject)(value)) return console.error('参数错误，必须为对象');
  if (!DS(pathString)) {
    DS(pathString, value); //2016-8-15修改，使未创建过的数据源也能直接upsert
    return;
  }
  var _val = (0, _im2.default)(DS(pathString));
  _val = _im2.default._assign(_val, value);
  DS(pathString, _val);
};
DS.destroy = function (root) {
  //销毁一个根数据源
  delete DS.ds[root];
};
DS.info = {
  destoryInfo: new SDO('destory'),
  dropProxyInfo: new SDO('dropProxy'),
  proxyIdleInfo: new SDO('proxyIdle')
};
function SDO(info) {
  this.___sdo___info___ = info;
}
window.DS = DS;
exports.DS = DS;
exports.IM = _im2.default;
exports.default = DS;