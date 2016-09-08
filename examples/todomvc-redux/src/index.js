import React from 'react'
import { render } from 'react-dom'
import {applyMiddleware,createStore,connect,bindActionCreators} from './dsadapter'
import App from './containers/App'
import 'todomvc-app-css/index.css'
import createLogger from 'redux-logger';
import * as TodoActions from './actions'
const store = applyMiddleware(createLogger())(createStore)({
  todos:{
    0:{
      text: '用DS做数据源改写react-redux应用',
      completed: false,
      id: 0
    },
    1:{
      text: '用适配器保证redux接口不用变化，中间件依然可用',
      completed: false,
      id: 1
    },
    2:{
      text: '去掉reducer,合并state的功能由DS完成',
      completed: false,
      id: 2
    },
    3:{
      text: '改写action',
      completed: false,
      id: 3
    }
  }
})
let actions = bindActionCreators(TodoActions, store.dispatch)
connect(() =>{
  render(
    <App {...store.getState()} actions = {actions}/>,
  document.getElementById('root')
  )
})(store)
