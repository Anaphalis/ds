import applyMiddleware from './applyMiddleware.js';
import compose from './compose.js';
import bindActionCreators from './bindActionCreators.js';
import {DS,IM} from '../../../../libs';

var DSAdapter = {};
DSAdapter.listeners = [];
DSAdapter.mode = 'wait';//wait or broadcast
DSAdapter.waitActions = [];
DSAdapter.createStore = function(initialState){
  DSAdapter.currentState = initialState;
  DSAdapter.dispatch((DS) =>{
    Object.keys(initialState).forEach((key)=>{
      DS(key,initialState[key])
    })
  });
  return {
    getState:DSAdapter.getState,
    dispatch:DSAdapter.dispatch,
    subscribe:DSAdapter.subscribe
  }
}
DSAdapter.subscribe = function(func){
  DSAdapter.listeners.push(func);
  return () => {
    DSAdapter.unsubscribe(func);
  }
}
DSAdapter.unsubscribe = function(func){
  var index = DSAdapter.listeners.indexOf(func);
  if(index!==-1)DSAdapter.listeners.splice(index,1);
}
DSAdapter.getState = function(){
  return DS.ds
}
DSAdapter._dispatch = function(actions){
  console.log('[DSA] dispatch',actions);
  if(!Array.isArray(actions))actions = [actions];
  actions.forEach((action)=>action(DS,IM))
  DS.ds = IM(DS.ds);//为connect专门更新
}

DSAdapter.dispatch = function(action){
  if(DSAdapter.mode==='broadcast'){
    return DSAdapter.waitActions.push(action)
  }
  var currentListeners = DSAdapter.listeners.slice();
  DSAdapter._dispatch(action)
  DSAdapter.mode = 'broadcast';//只有重新渲染时才有可能产生新的action,因此在重新渲染之前锁定dispatch
  currentListeners.forEach((func)=>{
    func()
  })
  while (DSAdapter.waitActions.length) {
    var currentListeners = DSAdapter.listeners.slice();
    DSAdapter._dispatch(DSAdapter.waitActions)
    currentListeners.forEach((func)=>{
      func()
    })
  }
  DSAdapter.mode = 'wait';

}
DSAdapter.connect = function(render){
  return (store) => {
    render();
    store.subscribe(render);
  }
}
var createStore = DSAdapter.createStore;
var connect = DSAdapter.connect;
export {applyMiddleware,createStore,compose,connect,bindActionCreators}
export default DSAdapter;
