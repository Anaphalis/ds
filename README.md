# DS
根据不可变数据和单向数据流的思想编写的数据源模块

可以在react中管理组件状态，也可以在MV*框架中管理controller/viewmode相互之间的数据交互，或者作为自定义事件总线使用

#examples
[基本使用](https://github.com/Anaphalis/ds/tree/master/examples/base)
[结合react中使用](https://github.com/Anaphalis/ds/tree/master/examples/todomvc-react)
[模仿redux接口](https://github.com/Anaphalis/ds/tree/master/examples/todomvc-redux)


#### usage

```javascript
  import {DS,IM} from 'ud-ds'
  var worldObj = {
    asia:{
      'east-asia':{
        china:'beijing',
        japan:{
          hokkaido:'aomori-ken'
        }
      }
    },
    europe:{
      'nordic-europe':{
        finland:'helsinki'
      },
      'eastern-europe':{
        Croatia:'Zagreb'
      }
    }
  }
  //注册根数据源，以点号分隔的都是根数据源下的对象的路径，回调函数里的data是对应的数据
  DS.regist('world',function(data){
    console.log('world:',data)
  });
  //可以注册根数据源下的某一个对象，对象不存在也可以注册，必须是对象回调才会被触发
  DS.regist('world.asia',function(data){
    console.log('world.asia:',data)
  })
  //同上
  DS.regist('world.asia.east-asia.japan',function(data){
    console.log('world.asia.east-asia.japan:',data)
  })
  //同上
  DS.regist('current',function(data){
    console.log('current',data)
  })
  //获取路径'world'的数据
  DS('world')
  //获取路径'world.europe'或者说'world'下'europe'对象的数据
  DS('world.europe')
  //合并更新路径'world'的数据，遵循不可变数据的原则，普通js对象一旦创建就不能修改，只能新建
  DS.upsert('world',worldObj)
  //取代更新路径'world'的数据，遵循不可变数据的原则
  DS('world',{})
  //合并更新
  DS.upsert('world.asia',{'east-asia':{'korea':'seoul','china':'beijing'}})
  //IM.modify(obj,{remove:'[field1,field2]',upsert:{field3:newObj}})
  //对obj移除field1,field2,增加field3,遵循不可变数据原则,remove和upsert操作的字段冲突时remove优先
  DS('world.asia.east-asia',IM.modify(DS('world.asia.east-asia'),{remove:'china',upsert:{'japan':{captal:'tokyo'}}}))
  //创建临时代理，将路径world.asia.east-asia映射到current上，current可以得到此路径的数据和变更通知
  DS.proxy('current','world.asia.east-asia')
  //一个路径只能映射一个代理，丢弃之前的代理并创建新代理映射到路径world.asia
  DS.proxy('current','world.asia')
  //丢弃代理，current的回调函数会收到一个内部信号[SDO {___sdo___info___: "dropProxy"}]
  DS.dropProxy('current')
  //以world为样板创建一个新对象，只是引用和world不一样，world必须是普通js对象
  IM(world)
  //更新对象内 输出路径的数据，遵循不可变数据原则
  IM(world,'asia/east-asia/china','xssxsx');

```

#### install
  >npm install ud-ds
