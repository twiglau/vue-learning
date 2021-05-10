/**
 * JS 运行机制
 * JS执行是单线程的,它是基于时间循环.
 * 1> 所有同步任何都是主线程上执行,形成一个执行栈(execution context stack)
 * 2> 主线程外, "任务队列"(task queue), 只要异步任务有了运行结果,就在"任务队列"之中放置一个事件.
 * 3> 一旦 "执行栈" 中的所有同步任务执行完毕, 系统就会读取 "任务队列", 看看里面有哪些事件. 那些
 *    对应的异步任务,于是结束等待状态,进入执行栈,开始执行.
 * 4> 主线程不断重复上面的第三步.
 */

//主线程的执行过程就是一个 tick, 而所有的异步结果都是通过 "任务队列"来调度被调度. 消息队列中存放
//的是一个个的任务(task). 规范中规定 task 分为两大类,分别是 macro task 和 micro task, 并且
//每个macro task 结束后, 都要清空所有的 micro task.
for(macroTask for macroTaskQueue){
    //1. Handle current MACRO-TASK
    handleMacroTask();

    //2. Handle all MICRO-TASK
    for(microTask of microTaskQueue){
        handleMicroTask(microTask);
    }
}
//在浏览器中,常见的 macro task 有 setTimeout,MessageChannel,postMessage,setImmediate;
//常见的 micro task 有 MutationObserver 和 Promise.then.

/**
 * Vue 的实现
 * 在Vue源码2.5+后, nextTick 的实现单独有一个JS来维护. 在 src/core/util/next-tick.js中:
 */
import { noop }  from 'shared/util'
import { handleError } from './error'
import { isIOS,isNative } from './env'

const callbacks = []
let pending = false

function flushCallbacks(){
    pending = false
    cosnt copies = callbacks.slice(0)
    callbacks.length = 0
    for(let i = 0; i < copies.length; i++) {
        copies[i]()
    }
}

//Here we have async deferring wrappers using both microtask and (macro) tasks.
//In < 2.4 we used microtasks everywhere, but there are some scenarios where
//microtasks have too high a priority and fire in between supposedly
//sequentail events (e.g. #4521,#6690) or even between bubbling of the same
//event (#6566). However, using (macro) tasks everywhere also has subtle problems
//when state is changed right before repaint(e.g. #6813, out-in transitions).
//Here we use microtask by default, but expose a way to force(macro) task when
//needed (e.g. in event handlers attached by v-on).
let microTimerFunc
let macroTimerFunc
let useMacroTask = false

if(typeof setImmediate !== 'undefined' && isNative(setImmediate)){
    macroTimerFunc = () =>{
        setImmediate(flushCallbacks)
    }
}else if(typeof MessageChannel !== 'undefined' && isNative(MessageChannel) || MessageChannel.toString() === '[object MessageChannelConstructor]'){
    const channel = new MessageChannel()
    const port = channel.port2
    channel.port1.onmessage = flushCallbacks
    macroTimerFunc = () =>{
        port.postMessage(1)
    }
}else {
    macroTimerFunc = ()=>{
        setTimeout(flushCallbacks,0)
    }
}

if(typeof Promise !== 'undefined' && isNative(Promise)){
    const p = Promise.resolve()
    microTimerFunc = () =>{
        p.then(flushCallbacks)
        //in problematic UIWebViews, Promise.then doesn't completely break,but it can get stuck in a weird
        //state where callbacks are pushed into the microtask queue but the queue isn't being flushed, until the
        //browser needs to do some other work, e.g. handle a timer. Therefore we can 
        //"force" the microtask queue to be flushed by adding an empty timer.
        if(isIOS) setTimeout(noop)
    }
}else{
    microTimerFunc = macroTimerFunc
}

export function withMacroTask(fn: Function): Function {
    return fn._withTask || (fn._withTask = function(){
        useMacroTask = true
        const res = fn.apply(null,arguments)
        useMacroTask = false
        return res
    })
}
export function nextTick(cb?: Function,ctx?:Object){
    let _resolve
    callbacks.push( () => {
        if(cb){
            try {
                cb.call(ctx)
            } catch (e){
                handleError(e,ctx,'nextTick')
            }
        }else if(_resolve){
            _resolve(ctx)
        }
    })
    if(!pending){
        pending = true
        if(useMacroTask){
            macroTimerFunc()
        }else{
            microTimerFunc()
        }
    }
    if(!cb && typeof Promise !== 'undefined'){
        return new Promise(resolve => {
            _resolve = resolve
        })
    }
}