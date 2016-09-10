//数据源接口部分
//ds 数据源树形结构
//setter 回调存放
//ps 代理存放
import Nerv from './nerv';
import EventBus from './event';
import {isRawObject} from './util';
import IM from './im';
function DS(pathString,value){
  if(value === undefined){
    //get模式,加上代理这里估计要改
    if(proxyMap[pathString]){
      pathString = proxyMap[pathString]['eventType'];
    }
    return DS.getDataByPath(pathString)
  }else if(isRawObject(value)){
    //set模式
    if(proxyMap[pathString]){
      pathString = proxyMap[pathString]['eventType'];
    }
    DS.setDataByPath(pathString,value);
  }else{
    console.error('输入错误，必须为普通对象');
  }
}
var ds = DS.ds = {};
var proxyMap = DS.proxyMap = {};
var nerv = DS.nerv =  new Nerv(DS);
DS.EventBus = EventBus;
DS.caster = EventBus.eventList;
DS.toString = function(){
  return 'DS() { [native code] }'
};
DS.getDataByPath = function(pathString){
  var path = pathString.split('.');
  var obj = DS.ds;
  while (path.length!==0) {
    var field = path.shift();
    obj = obj[field]
  }
  return obj;
}
DS.create = function(root){
  if(!ds[root])ds[root] = {};
}
DS.setDataByPath = function(pathString,value){
  //console.log('DS setDataByPath',pathString);
  var order = {pathString:pathString,value:value};
  nerv.pushOrder(order);
}
DS.regist = function(pathString,cb){
  EventBus.addEventListener({
    eventType:pathString,
    callback:cb
  })
}
DS.cancel = function(pathString,cb){
  EventBus.removeEventListener({
    eventType:pathString,
    callback:cb
  })
}
DS.proxy = function(proxyPathString,pathString){
  DS.dropProxy(proxyPathString);//先扔掉之前的代理
  var proxy = {
    eventType:pathString,
    callback:function(data){
      EventBus.dispatchEvent(proxyPathString,data);
    }
  }
  proxyMap[proxyPathString] = proxy;//如果想一个代理代理多个就改这里
  EventBus.addEventListener(proxy);
  //立刻广播一下
  EventBus.dispatchEvent(proxyPathString,DS(pathString));
}
DS.dropProxy = function(proxyPathString){
  if(!proxyMap.hasOwnProperty(proxyPathString))return
  //console.log('dropProxy',proxyPathString);
  var proxy = proxyMap[proxyPathString];
  EventBus.removeEventListener(proxy);
  //广播一下
  EventBus.dispatchEvent(proxyPathString,DS.info.dropProxyInfo);
}
DS.getProxyPath = function(proxyPathString){
  if(!proxyMap.hasOwnProperty(proxyPathString))return false;
  return proxyMap[proxyPathString].eventType
}
//部分更新
DS.upsert = function(pathString,value){
  if(!isRawObject(value))return console.error('参数错误，必须为对象');
  if(!DS(pathString)){
    DS(pathString,value);//2016-8-15修改，使未创建过的数据源也能直接upsert
    return;
  }
  var _val = IM(DS(pathString));
  _val = IM._assign(_val,value);
  DS(pathString,_val);
}
DS.destroy = function(root){
  //销毁一个根数据源，其实很没有必要
}
DS.info = {
  destoryInfo:new SDO('destory'),
  dropProxyInfo:new SDO('dropProxy'),
  proxyIdleInfo:new SDO('proxyIdle')
}
function SDO (info){this.___sdo___info___ = info;}
window.DS = DS;
export {DS,IM};
export default DS;
