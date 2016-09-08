import {arrayFromPlainObject} from '../array'
import {gid} from '../gid'
import {DS,IM} from '../../../../libs'
export function addTodo(text) {
  var id = gid('todos')
  DS('todos.'+id,{
    text:text,
    completed:false,
    id:id
  })
}
export function deleteTodo(id) {
  DS('todos',IM.modify(DS('todos'),{remove:[id]}))
}
export function editTodo(id, text) {
  DS('todos.'+id,IM.modify(DS('todos.'+id),{upsert:{text:text}}));
}
export function completeTodo(id) {
  DS('todos.'+id,IM.modify(DS('todos.'+id),{upsert:{completed:true}}));
}
export function completeAll() {
  Object.keys(DS('todos')).forEach((id)=>{
    if(DS('todos.'+id).completed)return
    DS('todos.'+id,IM.modify(DS('todos.'+id),{upsert:{completed:true}}));
  })
}
export function clearCompleted() {
  Object.keys(DS('todos')).forEach((id)=>{
    if(!DS('todos.'+id).completed)return
    DS('todos.'+id,IM.modify(DS('todos.'+id),{upsert:{completed:false}}));
  })
}
