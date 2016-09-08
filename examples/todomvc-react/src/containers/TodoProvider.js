import React, { Component, PropTypes } from 'react'
import * as TodoActions from '../actions'
import {DS,IM} from '../../../../libs'
//高阶组件，用来提供数据源
export const TodoProvider = (App) => class extends Component {
  constructor () {
    super()
    this.state = {
      actions:TodoActions,
      todos:{
        0:{
          text: '用DS做数据源构建react应用',
          completed: false,
          id: 0
        },
        1:{
          text: '使用高阶组件作为action和数据的提供层',
          completed: false,
          id: 1
        },
        2:{
          text: '用state的改变触发重绘',
          completed: false,
          id: 2
        }
      }
    }
    DS.upsert('todos',this.state.todos);
    DS.regist('todos',(data) => {
      this.setState({
        todos:data
      })
    })
  }
  render () {
    return ( <App actions = {this.state.actions} todos = {this.state.todos}/>)
  }
}
