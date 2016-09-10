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