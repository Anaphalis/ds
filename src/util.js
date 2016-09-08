//不是数组，不是函数，不是字面量，不是null,undefined的普通对象
function isRawObject (object){
  if(!object)return false//null undefined
  if(typeof object!=="object")return false//过滤 函数 字面量
  if(Array.isArray(object))return false//过滤数组
  if(object.constructor&&object.constructor!==Object) return false//拥有构造器但是构造器不是Object的都不是RawObject
  //只有没有构造器：Object.create(null) o.constructor === undefined  或者构造器为Object: {}才是RawObject
  return true;
}
export {isRawObject}
