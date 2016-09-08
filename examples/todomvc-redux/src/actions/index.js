import {arrayFromPlainObject} from '../array'
import {gid} from '../gid'
export function addTodo(text) {
  return (DS) =>{
    var id = gid('todos')
    DS('todos.'+id,{
      text:text,
      completed:false,
      id:id
    })
  }
}

export function deleteTodo(id) {
  //调不到方法不用怕，等着别人给，谁用谁提供
  return (DS,IM) => DS('todos',IM.modify(DS('todos'),{remove:[id]}))
}

export function editTodo(id, text) {
  return (DS,IM) => DS('todos.'+id,IM.modify(DS('todos.'+id),{upsert:{text:text}}));
}

export function completeTodo(id) {
  return (DS,IM) => DS('todos.'+id,IM.modify(DS('todos.'+id),{upsert:{completed:true}}));
}

export function completeAll() {
  return (DS,IM) => {
    Object.keys(DS('todos')).forEach((id)=>{
      if(DS('todos.'+id).completed)return
      DS('todos.'+id,IM.modify(DS('todos.'+id),{upsert:{completed:true}}));
    })
  }
}

export function clearCompleted() {
  return (DS,IM) => {
    Object.keys(DS('todos')).forEach((id)=>{
      if(!DS('todos.'+id).completed)return
      DS('todos.'+id,IM.modify(DS('todos.'+id),{upsert:{completed:false}}));
    })
  }
}
