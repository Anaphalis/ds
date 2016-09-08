//自定义事件总线
function EventBus(){
	//已经注册的事件列表
	//key:eventType
	//value:array[{cb}]
	this.eventList = {};
	this.dispatchEvent = function(event,data){
		if(!this.eventList[event]){
			this.eventList[event] = new Array();
		}
		//取回调列表的快照，避免在执行回调时使用了有可能正在变化的回调列表
		var e = this.eventList[event].slice();
		//console.log('[EventBus]',this.eventList);
		e.forEach((cb)=>{
			cb(data)
		})
	};
	this.addEventListener = function(param){
		//console.log('addEventListener');
		var cb = param.callback;
		if(!this.eventList[param.eventType])this.eventList[param.eventType]=new Array();
		var index = this.eventList[param.eventType].indexOf(cb);
		if(index===-1)this.eventList[param.eventType].push(cb);
		//console.log(this.eventList);
	};
	this.removeEventListener = function(param){
		//console.log('removeEventLister');
		var e = this.eventList[param.eventType];
		if(!e)return console.error('未发现注册事件',param.eventType);
		var cb = param.callback;
		var index = this.eventList[param.eventType].indexOf(cb);
		this.eventList[param.eventType].splice(index,1);
		//console.log(this.eventList);
	};
}
var eventBus = new EventBus();
export default eventBus
