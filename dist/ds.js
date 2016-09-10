(function(portal){
            var _modules = Object.create(null);
          var process = {env:{NODE_ENV:''}};
          var global = {};
          function require(refPath){
            var relativePath = this.ref[refPath];
             //console.log(refPath,this.ref);
            if(_modules[relativePath].ready)return _modules[relativePath].module.exports;
            return _exec(relativePath)
          }
          function _exec(relativePath){
             //console.log('_exec',relativePath)
            var _module = _modules[relativePath].module;
            if(_modules[relativePath].working){
              //console.log('模块已经在执行中，不能再次执行',_module.exports,relativePath);
              return _module.exports
            }
            _modules[relativePath].working = true;
            _modules[relativePath].exec(require.bind(_modules[relativePath]),_module,_module.exports);
            _modules[relativePath].ready = true;
            _modules[relativePath].working = false;
            return _module.exports;
          }

            _modules['src/ds/index.js'] = {exec:function(require,module,exports){

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

//数据源接口部分
//ds 数据源树形结构
//setter 回调存放
//ps 代理存放
function DS(pathString, value) {
  if (value === undefined) {
    //get模式,加上代理这里估计要改
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
//部分更新
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
  //销毁一个根数据源，其实很没有必要
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
window.IM = _im2.default;
exports.DS = DS;
exports.IM = _im2.default;
exports.default = DS;
          },module:{exports:{}},ref:{"./nerv":"src/ds/nerv.js","./event":"src/ds/event.js","./util":"src/ds/util.js","./im":"src/ds/im.js"}};

_modules['src/ds/nerv.js'] = {exec:function(require,module,exports){

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
          },module:{exports:{}},ref:{"./cell":"src/ds/cell.js","./event":"src/ds/event.js"}};

_modules['src/ds/cell.js'] = {exec:function(require,module,exports){

            'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require('./util');

var _im = require('./im');

var _im2 = _interopRequireDefault(_im);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//数据源本体
//将所有的rawObejct都转化成Cell对象
//还需要么，就是把数据的引用更新正确，并且记录正确的广播列表
//创建镜像，用来存储新的对象，但是要确定确实数据更新了
//通过路径找到节点，将路径记入
//如果节点不存在，创建节点并赋值  整个过程要记录更新列表，这个必须在前
//观察节点，这时节点如果引用没有变化，则返回，不管里面变没变
//如果变化了，则开始比较
//比较：对比更新对象的字段和原节点的字段，新建 ，销毁 ，更新
//更新则递归：对比到不是rawObejct的级别，为什么不对比最底层的值，因为不希望把从属数据源和监听扩大到值上，监听的最低级别也要是rawObejct
//如果要更新的不是rawObejct=>原节点也是值，不用管了，原节点是rawObejct，则把这个节点下面的所有路径记录到广播表


//输入的value至少是空对象，undefined和null滚粗，必须是rawObejct,不是rawObejct报错
//这里不再验证value是rawObejct,此类不对外开放
//注意path一律指代数组 pathString 指代字符串

//将递归改为迭代

function Cell(pathString, value, ds) {
  //console.log('新的cell',pathString,value);
  this.broadcastList = [];
  this.pathString = pathString;
  this.path = pathString.split('.');
  this.value = value;
  this.ds = ds;
  this.rootPathString = this.path[0]; //根数据源路径

  //console.log('根数据源',this.rootPathString,this.rootDS);
  this.mirror = {};
  this.updateList = {};
  //检查节点是否存在,如果不存在，创建空对象直到目标节点
  var _r = this.detectNodeExist();
  this.isOldPath = _r.isOldPath;
  this.dsAimNode = _r.dsAimNode; //ds中是否存在路径，ds中节点对象
  //console.log('是否存在路径：',this.isOldPath);
  //console.log('目标节点',this.dsAimNode);
  this.rootDS = ds[this.rootPathString]; //根数据源这时才确定存在
  //如果是存在的路径，检查是否需要更新
  if (this.isOldPath) this.isNeedUpdate = !this.detectNodeSame();
  //console.log('是否需要更新',this.isNeedUpdate)
  if (!this.isNeedUpdate && this.isOldPath) return {}; //不需要更新直接返回一个提醒
  var down = this.updateNode();

  this.downMirror = down.mirror;
  this.downUpdateList = down.updateList; //处理要更新的目标节点到底部

  this.updateBase(this.downMirror, this.downUpdateList); //处理根节点到目标节点
  ds[this.rootPathString] = this.mirror;
  //这里的ds不包括其他根数据源
  //console.log('ds=>',JSON.stringify(ds),'更新列表=>',this.updateList);
  return this.updateList;
}
Cell.prototype.detectNodeExist = function () {
  var isOldPath = true;
  var obj = this.ds;
  var path = this.path;
  for (var i = 0, l = path.length; i < l; i++) {
    if (!obj.hasOwnProperty(path[i])) {
      isOldPath = false;
      obj[path[i]] = {};
    }
    obj = obj[path[i]];
  }
  //console.log('detectNodeExist',isOldPath,obj,this.path,this.ds);
  return { isOldPath: isOldPath, dsAimNode: obj };
};
Cell.prototype.detectNodeSame = function () {
  var isSame = false;
  if (this.value === this.dsAimNode) isSame = true;
  //console.log('detectNodeSame',isSame)
  return isSame;
};
//更新根节点到目标节点的镜像和更新列表
Cell.prototype.updateBase = function (downMirror, downUpdateList) {
  var mirror = this.mirror; //准备代替根数据源的镜像
  var path = this.path.concat(); //路径
  var rootDS = this.rootDS; //根数据源
  var updateList = {};
  //console.log(updateList,downUpdateList);
  path.shift();
  mirror = rootDS;
  var _mirror = mirror,
      _rootDS = rootDS;
  //console.log('查看初始镜像',_mirror,_rootDS,rootDS,path);
  for (var i = 0, l = path.length; i < l; i++) {
    var field = path[i];
    if (i != l - 1) {
      _mirror[field] = (0, _im2.default)(_rootDS[field]); //这里肯定都是对象
    } else {
      _mirror[field] = downMirror; //给更新的节点预留
    }
    _mirror = _mirror[field];
    _rootDS = _rootDS[field];
  }
  if (path.length === 0) {
    mirror = downMirror;
    //console.log('没有多余路径',_mirror,mirror);
  }
  var paths = this.reducePath(this.path.concat());
  paths.forEach(function (pathstr) {
    updateList[pathstr] = 'update';
  });
  //console.log('更新列表合并',updateList,downUpdateList);
  //console.log('数据合并',mirror,downMirror)
  this.updateList = _im2.default._assign(updateList, downUpdateList);
  this.mirror = mirror;
  //console.log('完整的更新结果',JSON.stringify(mirror),JSON.stringify(this.updateList));
};
//更新节点,整个路径已经在广播列表里了，接下来看value和nodevalue里有多少路径需要更新
Cell.prototype.updateNode = function () {
  //这一段是更新目标节点到树底部
  //顶部到目标节点这里没有更新
  var path = this.path;
  var updateList = {}; //path op
  var mirror = {}; //不改变原节点，在新节点里赋值，反正这个节点肯定是新的
  var source = this.dsAimNode; //原节点
  var value = this.value;
  var getAllPath = this.getAllPath;
  //把source和value里的东西填到Mirror里，最后用mirror代替source,parent是父级节点,用
  //parent[pathstr]对currentNode进行赋值
  var _updateNode = function _updateNode(newVal, oldVal, currentPath, currentNode, parent, pathstr) {
    //递归更新

    var ntype = (0, _util.isRawObject)(newVal);
    var otype = (0, _util.isRawObject)(oldVal);
    //最简单的处理方式就是：数据结构不能变
    //如果数据结构不一样，则需要大块的变更节点和记录路径
    //console.log('更新',newVal,oldVal,currentPath,currentNode,ntype,otype)
    if (ntype === false && otype === false) {
      //双方都是值
      parent[pathstr] = newVal; ////不管一样不一样，还是要把新值给镜像，不然丢了
      return;
    } else if (ntype !== otype) {
      if (ntype === true) {
        //原节点是值，新节点是对象,新节点

        parent[pathstr] = newVal; //修改currentNode没问题，但是直接赋值，这个currentNode就和外面的currentNode没关系了
        //将更新的路径加入队列
        var _pathList = getAllPath(newVal, currentPath);
        _pathList.forEach(function (path) {
          updateList[path] = 'create';
        });
      } else if (otype == true) {
        //console.log('新节点是值',currentNode,newVal);
        parent[pathstr] = newVal; //修改currentNode没问题，但是直接赋值，这个currentNode就和外面的currentNode没关系了
        var _pathList = getAllPath(oldVal, currentPath);
        _pathList.forEach(function (path) {
          //console.log('-------------',path)
          updateList[path] = 'recycle';
        });
        //console.log('检查updateList recycle1',updateList)
      }
    } else if (ntype === true && otype === true) {
      //如果新旧节点都是rawObejct,要交并补
      // var nfields = new Set(Object.keys(newVal));
      // var ofields = new Set(Object.keys(oldVal));
      // var inter = new Set([...nfields].filter(field=>ofields.has(field)));//比较
      // var ndiffo = new Set([...nfields].filter(field=>!ofields.has(field)));//新建
      // var odiffn = new Set([...ofields].filter(field=>!nfields.has(field)));//销毁
      var nfields = Object.keys(newVal);
      var ofields = Object.keys(oldVal);
      var inter = [];
      var ndiffo = [];
      for (var i = 0, l = nfields.length; i < l; i++) {
        var _key = nfields[i];
        var _index = ofields.indexOf(_key);
        if (_index !== -1) {
          inter.push(_key);
          ofields.splice(_index, 1);
        } else {
          ndiffo.push(_key);
        }
      }
      var odiffn = ofields;

      //处理新建
      ndiffo.forEach(function (field) {
        //console.log('新建',field)
        currentNode[field] = newVal[field]; //将新数据加入镜像
        //如果新数据不是普通对象，就不用添加路径了
        if ((0, _util.isRawObject)(newVal[field])) {
          var _path = currentPath.concat();
          _path.push(field);
          updateList[_path.join('.')] = 'create';
          //将newVal[field]中所有的路径加入到更新队列
          var _pathList = getAllPath(newVal[field], _path);
          //console.log('获取的路径',_pathList,newVal[field],_currentPath)
          //console.log('检查updateList create2',updateList)
          _pathList.forEach(function (path) {
            updateList[path] = 'create';
          });
          //console.log(updateList)
        }
      });
      //处理删除
      odiffn.forEach(function (field) {
        //没有需要添加到镜像的新节点
        if ((0, _util.isRawObject)(oldVal[field])) {
          var _path = currentPath.concat();
          _path.push(field);
          updateList[_path.join('.')] = 'recycle';
          var _pathList = getAllPath(oldVal[field], _path);
          _pathList.forEach(function (path) {
            updateList[path] = 'recycle';
          });
          //console.log(updateList)
        }
      });
      inter.forEach(function (field) {
        if (newVal[field] !== oldVal[field]) {
          //这里是不是newVal[field]!==oldVal[field]
          currentNode[field] = {};
          var _currentPath = currentPath.concat();
          _currentPath.push(field);

          //这里，如果
          if ((0, _util.isRawObject)(newVal[field]) || (0, _util.isRawObject)(oldVal[field])) {
            updateList[_currentPath.join('.')] = 'update';
          }
          //console.log('递归updateNode',newVal[field],oldVal[field],_currentPath,currentNode[field])
          _updateNode(newVal[field], oldVal[field], _currentPath, currentNode[field], currentNode, field);
        } else {
          //console.info('数据没有改变，不做处理',currentPath.join('.')+'.'+field);
          currentNode[field] = newVal[field]; //还是要把值给镜像，不然丢了
        }
      });
    }
  };
  updateList[path.join('.')] = 'update';
  var p = this.getParentNode(path);
  //console.log('updata------->',value,source,path,mirror,p.parent,p.field);
  _updateNode(value, source, path, mirror, p.parent, p.field);
  //console.log('更新节点完成',mirror,updateList);
  return { mirror: mirror, updateList: updateList };
};
Cell.prototype.getParentNode = function (path) {
  if (!path || path.length === 0) return console.error('DS中获取父节点错误');
  var _path = path.concat();
  var field = _path.pop();
  var parent = this.getNodeByPath(_path);
  return { parent: parent, field: field };
};

Cell.prototype.getNodeByPath = function (path) {
  var _path = path.concat();
  var obj = this.ds;
  for (var i = 0, l = _path.length; i < l; i++) {
    if (!obj) {
      console.error('路径错误', this.ds, path);
      return false;
    }
    obj = obj[_path[i]];
  }
  return obj;
};
Cell.prototype.getAllPath = function (obj, path) {
  //path是输入的相对路径,要放在数组中
  //console.log('GETALLAPTH',obj,path,isRawObject(obj))
  var paths = [];
  var path = path.concat();
  if (!(0, _util.isRawObject)(obj)) return paths;

  var _getPath = function _getPath(obj, currentPath) {
    var fields = Object.keys(obj);
    fields.forEach(function (field) {

      //console.log('当前执行的field',field,isRawObject(obj[field]));
      if ((0, _util.isRawObject)(obj[field])) {
        //console.log(currentPath)
        var _path = currentPath.concat();
        _path.push(field);
        paths.push(_path.join('.'));
        _getPath(obj[field], _path);
      }
    });
  };
  _getPath(obj, path);
  //console.log('GETALLAPTH结果---->',paths);//第一个元素是[]join来的'',要去掉
  return paths;
};
Cell.prototype.reducePath = function (path) {
  var rpath = [];
  path.reduce(function (p1, p2) {
    var p = p1 + '.' + p2;
    rpath.push(p);
    return p;
  });
  rpath.unshift(path[0]); //reduce丢了第一个
  return rpath;
};
exports.default = Cell;
          },module:{exports:{}},ref:{"./util":"src/ds/util.js","./im":"src/ds/im.js"}};

_modules['src/ds/util.js'] = {exec:function(require,module,exports){

            "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

//不是数组，不是函数，不是字面量，不是null,undefined的普通对象
function isRawObject(object) {
  if (!object) return false; //null undefined
  if ((typeof object === "undefined" ? "undefined" : _typeof(object)) !== "object") return false; //过滤 函数 字面量
  if (Array.isArray(object)) return false; //过滤数组
  if (object.constructor && object.constructor !== Object) return false; //拥有构造器但是构造器不是Object的都不是RawObject
  //只有没有构造器：Object.create(null) o.constructor === undefined  或者构造器为Object: {}才是RawObject
  return true;
}
exports.isRawObject = isRawObject;
          },module:{exports:{}},ref:{}};

_modules['src/ds/im.js'] = {exec:function(require,module,exports){

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
          },module:{exports:{}},ref:{"./util":"src/ds/util.js"}};

_modules['src/ds/event.js'] = {exec:function(require,module,exports){

            'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
//自定义事件总线
function EventBus() {
	//已经注册的事件列表
	//key:eventType
	//value:array[{cb}]
	this.eventList = {};
	this.dispatchEvent = function (event, data) {
		//发出事件的对象如果需要就扔进data里
		if (!this.eventList[event]) {
			this.eventList[event] = new Array();
		}
		var e = this.eventList[event].slice();
		//console.log('[EventBus]',this.eventList);
		e.forEach(function (cb) {
			cb(data);
		});
	};
	this.addEventListener = function (param) {
		//console.log('addEventListener');
		var cb = param.callback;
		if (!this.eventList[param.eventType]) this.eventList[param.eventType] = new Array();
		var index = this.eventList[param.eventType].indexOf(cb);
		if (index === -1) this.eventList[param.eventType].push(cb);
		//console.log(this.eventList);
	};
	this.removeEventListener = function (param) {
		//console.log('removeEventLister');
		var e = this.eventList[param.eventType];
		if (!e) return console.error('未发现注册事件', param.eventType);
		var cb = param.callback;
		var index = this.eventList[param.eventType].indexOf(cb);
		this.eventList[param.eventType].splice(index, 1);
		//console.log(this.eventList);
	};
}
var eventBus = new EventBus();
exports.default = eventBus;
          },module:{exports:{}},ref:{}};

            _exec(portal);
          })('src/ds/index.js');
