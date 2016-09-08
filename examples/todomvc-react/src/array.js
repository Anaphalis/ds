var arrayFromPlainObject = function(obj){
  if(!obj||obj.constructor&&obj.constructor!=Object)return console.error('不是普通对象')
  var ret = [];
  Object.keys(obj).forEach((key)=>{
    ret.push(obj[key])
  })
  return ret
}
export {arrayFromPlainObject}
