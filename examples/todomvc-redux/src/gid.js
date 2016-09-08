var ids = {};
var gid = function(name){
  if(!name)throw 'gid need name'
  if(ids.hasOwnProperty(name)){
    ids[name] += 1;
  }else{
    ids[name] = 0;
  }
  return name+'::'+ids[name]
}
export {gid}
