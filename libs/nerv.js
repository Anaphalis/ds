'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cell = require('./cell');

var _cell2 = _interopRequireDefault(_cell);

var _event = require('./event');

var _event2 = _interopRequireDefault(_event);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//状态管理
//等待：发现指令则进入更新态
//更新：更新cell，并从cell中收集待广播事件，然后进入广播态
//广播：查找需要的回调，并依次执行，执行后进入等待态
//指令格式:{path:a.b.c,data:data};
//Nerv接受DS并且可以使用cell，核心状态机
function Nerv(DS) {
  this.orderList = []; //更新数据的指令列表
  this.DS = DS;
  Object.defineProperties(this, {
    //wait update broadcast
    'state': {
      set: function set(val) {
        this._state = val;
        this['_' + val + 'Start'](); //after
      },
      get: function get() {
        return this._state;
      }
    }
  });
  this.state = 'wait';
};
Nerv.prototype.pushOrder = function (order) {
  if (order) {
    this.orderList.push(order);
    if (this.state === "wait") {
      this._getOneAndUpdate();
    }
  }
};
Nerv.prototype._getOneAndUpdate = function () {
  //console.log('_getOneAndUpdate',this.state,this.orderList,this.orderList.length)
  if (this.state !== 'wait') return; //不是等待态不启动
  if (this.orderList.length === 0) return;else {
    this.currentOrder = this.orderList.shift();
    this.state = 'update';
  }
};
Nerv.prototype._waitStart = function () {
  //console.log('进入等待态');
  this._getOneAndUpdate();
};
Nerv.prototype._updateStart = function () {
  //console.log('进入更新态');
  this.broadcastList = [];
  var order = this.currentOrder;
  this.broadcastList = new _cell2.default(order.pathString, order.value, DS.ds);
  this.state = 'broadcast';
};
Nerv.prototype._broadcastStart = function () {
  //console.log('进入广播态',this.broadcastList);
  var DS = this.DS;
  var caster = DS.caster;
  var broadcastList = this.broadcastList;
  Object.keys(broadcastList).forEach(function (pathString) {
    if (broadcastList[pathString] === "recycle") {
      _event2.default.dispatchEvent(pathString, DS.info.destoryInfo);
    } else {
      _event2.default.dispatchEvent(pathString, DS.getDataByPath(pathString));
    }
  });
  this.state = 'wait';
};
exports.default = Nerv;