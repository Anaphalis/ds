'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _util = require('./util');

//更新对象的一个键，注意是rawObejct的一个键，而不是数组,set,mep的一个键
function IM(obj, path, val) {
  //immutable
  //直接IM(obj)为做一个内容相同的新对象，类似Object.assign，但保证对象内key的顺序不变
  if (path === undefined && val === undefined) {
    if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null) {
      var _obj = Object.create(obj.constructor);
      var _obj = {};
      return IM._assign(_obj, obj);
    } else {
      return console.error('参数错误', obj, path, val);
    }
  }

  if (obj === undefined || path === undefined) return console.error('参数错误', obj, path, val);
  var paths = path.split('/');

  function _im(obj, paths, val) {
    var _path = paths.shift();
    //console.log('_im-->',_path);
    var newObj = IM._assign({}, obj);
    //修改，原先没有路径会提示错误，现在改为警告并新建对象
    if (!newObj.hasOwnProperty(_path)) {
      console.warn('路径错误,创建路径', newObj, _path);
      newObj[_path] = {};
    }
    if (paths.length === 0) {
      newObj[_path] = val; //最后一层，进行真正的赋值
      return newObj;
    } else {
      newObj[_path] = _im(newObj[_path], paths, val);
      return newObj;
    }
  }
  var ret = _im(obj, paths, val);
  //console.log('[immutable]',ret);
  return ret;
}

//把o2的属性混入o1,但是不改变o1的prototype
IM._assign = function (o1, o2) {
  if ((typeof o1 === 'undefined' ? 'undefined' : _typeof(o1)) !== 'object' || o1 === null || (typeof o2 === 'undefined' ? 'undefined' : _typeof(o2)) !== 'object' || o2 === null) return console.error('参数错误');
  var keys = Object.keys(o2);
  //console.log(keys);
  keys.forEach(function (key) {
    o1[key] = o2[key];
  });
  return o1;
};
//不做深层修改
IM.modify = function modify(o1, op) {
  if ((typeof o1 === 'undefined' ? 'undefined' : _typeof(o1)) !== 'object' || o1 === null) console.error('参数错误');
  var ret = IM(o1);
  if (!op) return ret;
  if (op.hasOwnProperty('upsert') && (0, _util.isRawObject)(op.upsert)) {
    //添加&修改
    Object.keys(op.upsert).forEach(function (key) {
      ret[key] = op.upsert[key];
    });
  }
  if (op.hasOwnProperty('remove')) {
    //删除
    var keys = op.remove;
    if (!Array.isArray(keys)) keys = [keys];
    keys.forEach(function (key) {
      delete ret[key];
    });
  }
  return ret;
};
exports.default = IM;
// var AA = {
//   aa:{
//     bb:{
//       cc:'dd'
//     },
//     ee:{
//       ff:'gg'
//     },
//     hh:{
//       ii:'jj'
//     }
//   },
//   kk:{
//     ll:'mm'
//   },
//   nn:{
//     oo:'pp'
//   }
// }
// var BB = IM(AA,'aa/ee/ff','xssxsx');