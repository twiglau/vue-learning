/**
 * 问题: 我明明已经更新了数据,为什么当我获取某个节点的数据时,却还是更新前的数据?
 *       在视图更新之后,怎么基于新的视图进行操作?
 * 
 * 简单的场景:
 */
`
<template>
    <div>
        <p ref="message">{{ msg }}</p>
        <button @click="handleClick">updateMsg</button>
    </div>
</template>
<script>
export default {
    name: 'index',
    data () {
        return {
            msg: 'hello'
        }
    },
    methods: {
        handleClick () {
            this.msg = 'hello world';
            console.log(this.$refs.message.innerText); // hello
        }
    }
}
</script>
`
//以上运行结果如图0-1 所示
/**
 * 运行上面代码,可以看到,修改数据后并不会立即更新dom,dom的更新是异步的,无法通过
 * 同步代码获取,虽然此时 this.msg 已经变了,但是dom节点的值并没有更新,也就是说,
 * 变的只是数据,而视图节点的值未更新. 所以当这时去获取节点的
 * this.$refs.message.innerText时,拿到的还是原来的数据. 那末问题来了,
 * 啥时候才能拿到更新的数据?
 * 
 * 如果我们需要获取数据更新后的dom信息,比如动态获取dom的宽高,位置等,就需要使用nextTick.
 */
`
handleClick () {
    this.msg = 'hello world';
    this.$nextTick(() => {
        console.log(this.$refs.message.innerText) // hello world
    })
}
`

/**
 * 如vue官网的描述:
 * 
 * Vue在更新DOM时是异步执行的. 只要监听到数据变化,Vue将开启一个队列,并缓冲在同一事件中发生
 * 的所有数据变更. 如果同一个watcher被多次触发,只会被推入到队列中一次. 这种在缓冲时去除重复
 * 数据对于避免不必要的计算和DOM操作是非常重要的, 然后, 在下一个的事件循环 "tick"中, Vue 刷新
 * 队列并执行实际(已去重的)工作. Vue 在内部对异步队列尝试使用原生的 Promise.then, MutationObserver 和
 * setImmediate, 如果执行环境不支持,则会采用 setTimeout(fn,0)代替.
 * 
 * 事件循环的概念,其涉及到JS的运行机制,包括主线程的
 * 执行栈, 异步队列, 异步API, 事件循环 的协作
 */

/**
 * 二, JS运行机制
 * JS执行是单线程的,它是基于 事件循环 的, 事件循环大致分为以下几个步骤:
 * 1.所有同步任务都在主线程上执行,形成一个执行栈(execution context stack).
 * 2.主线程之外,还存在一个 "任务队列" (task queue), 只要异步任务有了运行结果,
 * 就在"任务队列"之中放置一个事件.
 * 3.一旦"执行栈"中的所有同步任务执行完毕,系统就会读取 "任务队列", 看看里面
 * 有哪些事件.  那些对应的异步任务,于是结束等待状态,进入执行栈,开始执行.
 * 4.主线程不断重复上面的第三步.
 */
//以上执行如图0-3

/**
 * 主线程的执行过程就是一个tick,而所有的异步结果都是通过 "任务队列" 来调度,消息队列中
 * 存放的是一个个的任务(task). 规范中规定task分为两大类,分别是 macro task 和 micro task,
 * 并且每个macro task 结束后,都要清空所有的micro task. 执行顺序如下:
 */
`
for (macroTask of macroTaskQueue) {
    // 1. Handle current MACRO-TASK
    handleMacroTask();
      
    // 2. Handle all MICRO-TASK
    for (microTask of microTaskQueue) {
        handleMicroTask(microTask);
    }
}
`
//macro task 和 micro task 概念
//2.1 macro task  宏任务,称为task
/**
 * macro task 作用是为了让浏览器能够从内部获取javascript/dom的内容并确保执行
 * 栈能够顺利进行
 * 
 * macro task调度是随处可见的,例如解析HTML,获得鼠标点击的事件回调等等.
 */

//2.2 micro task  微任务,也称job
/**
 * micro task通常用于在当前正在执行的脚本之后直接发生的事情,比如对一系列的行为
 * 做出反应,或者做出一些异步的任务,而不需要新建一个全新的task.
 * 
 * 只要执行栈没有其他javascript在执行,在每个task结束时,micro task 队列就会
 * 在回调后处理. 在 micro task期间排队的任何其他 micro task将被添加到这个
 * 队列的末尾并进行处理.
 * 
 * 在浏览器环境中,
 * 常见的macro task 有 setTimeout, MessageChannel, postMessage,setImmediate;
 * 常见的micro task 有 MutationObserver 和 Promise.then
 */

/**
 * 如图0-4
 * 根据HTML Standard,在每个task运行完以后,UI都会重渲染,那么在micro task中就完成数据更新,
 * 当前task结束就可以得到最新的UI了,反之如果新建一个task来做数据更新,那么渲染渲染就会进行两次.
 * 
 * micro task的这一特性是做队列控制的最佳选择,vue进行DOM更新内部也是调用nextTick来
 * 做异步队列控制,而当我们自己调用nextTick的时候,它就在更新DOM的那个micro task后
 * 追加了我们自己的回调函数,从而确保我们的代码在DOM更新后执行.
 * 
 * 比如一段时间内,你无意中修改了最初代码片段中的msg多次,其实只要最后一次修改后的值更新到DOM就可以了,
 * 假如是同步更新的,每次msg值发生变化,那么都要触发:
 * setter -> Dep ->Watcher ->update ->patch,这个过程非常消耗性能.
 * 
 * 接下来从源码分析vue中nextTick的实现.
 */

//三, nextTick源码解析及原理
/*@flow */
/*globals MutationObserver */
import { noop } from 'shared/util'
import { handleError } from './error'
import {isIE,isIOS,isNative } from './env'

export let isUsingMicroTask = false
const callbacks = []
let pending = false
/**
 * 对所有callback进行遍历,然后指向 相应的回调函数
 * 使用 callbacks 保证可以在同一个tick内执行多次 nextTick,不会开启多个
 * 异步任务,而把这些异步任务都压成一个同步任务,在下一个 tick 执行完毕.
 */
function flushCallbacks(){
    pending = false
    const copies = callbacks.slice(0)
    callbacks.length = 0
    for(let i = 0; i < copies.length; i++) {
        copies[i]("i")
    }
}
//Here we have async deferring wrappers using microtasks.
//In2.5 we used (macro) tasks (in combination with microtasks).
//However, it has subtle problems when state is changed right before repaint
//(e.g. #6813,out-in transitions).
//Also, using (macro) tasks in event handler would cause some weird behaviors
//that cannot be circumvented[规避] (e.go #7109,#7153,#7546,#7834,#8109).
//So we now use microtasks everywhere, again.
//A major drawback of this tradeoff(这种权衡的主要缺点) is that there are some scenarios
//where microtasks have too high a priority and fire in between supposedly
//sequential events (e.g. #4521,#6690,which have workarounds[解决方法,变通方法])
//or even between bubbling of the same event(#6566).

let timerFunc

//The nextTick behavior leverages the microtask queue,which can be accessed
//via either native Promise.then or MutationObserver.
//MutationObserver has wider support, however it is seriously bugged in
//UIWebView in iOS >= 9.3.3 when triggered in touch event handlers.It
//completely stops working afer triggering a few times... so, if native
//Promise is available, we will use it:
/**istanbul ignore next, $flow-disable-line */

/**
 * timerFunc 实现的就是根据当前环境判断使用哪种方式实现
 * 就是按照 Promise.then 和 MutationObserver以及setImmediate的优先级来判断,
 * 支持哪个就用哪个,如果执行环境不支持,会采用setTimeout(fn,0)代替:
 */
//判断是否支持原生 Promise
if(typeof Promise !== 'undefined' && isNative(Promise)){
    const p = Promise.resolve()
    timerFunc = () => {
        p.then(flushCallbacks)
        //In problematic UIWebViews,Promise.then doesn't completely break,but
        //it can get stuck in a weird state where callbacks are pushed into the 
        //microtask queue but the queue isn't being flushed,until the browser
        //needs to do some other work, e.g. handle a timer. Therefore we can "force"
        //the microtask queue to be flushed by adding an empty timer.
        if(isIOS) setTimeout(noop)
    }
    isUsingMicroTask = true
    //不支持Promise的话,再判断是否原生支持 MutationObserver
}else if(!isIE && typeof MutationObserver !== 'undefined' && (
    isNative(MutationObserver) ||
    //PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]'
)){
    //Use MutationObserver where native Promise is not available,
    //e.g. PhantomJS,iOS7,Android 4.4
    //(#6466 MutationObserver is unreliable in IE11)
    //新建一个 textNode 的DOM对象,使用 MutationObserver 绑定该DOM并传入回调函数,
    //在DOM发生变化的时候触发回调,该回调进入主线程(比任务队列优先执行)
    let counter = 1
    const observer = new MutationObserver(flushCallbacks)
    const textNode = document.createTextNode(String(counter))
    observer.observe(textNode,{
        characterData:true
    })
    timerFunc = () => {
        counter = (counter + 1) % 2
        //此时便会触发回调
        textNode.data = String(counter)
    }
    isUsingMicroTask = true
    //不支持的 MutationObserver的话,再去判断是否原生支持 setImmediate
}else if(typeof setImmediate !== 'undefined' && inNative(setImmediate)){
    //Fallback to setImmediate.
    //Technically it leverages the (macro) task queue.
    //but it is still a better choice than setTimeout.
    timerFunc = () => {
        setImmediate(flushCallbacks)
    }
}else {
    //Promise,MutationObserver,setImmediate 都不支持的话,最后使用setTimeout(fun,0)
    //Fallback to setTimeout.
    timerFunc = () => {
        setTimeout(flushCallbacks,0)
    }
}

//该函数的作用就是延迟 cb 到当前调用栈执行完成之后执行
export function nextTick(cb?:Function,ctx?:Object){
    //传入的回调函数会在callbacks中存起来
    let _resolve
    callbacks.push(() => {
        if(cb){
            try {
                cb.call(ctx)
            }catch(e){
                handleError(e,ctx,'nextTick')
            }
        }else if(_resolve){
            _resolve(ctx)
        }
    })
    //pending 是一个状态标记,保证timerFunc在下一个tick之前只执行一次
    if(!pending){
        pending = true
        /**
         * timerFunc 实现的就是根据当前环境判断使用哪种方式实现
         * 就是按照 Promise.then 和 MutationObserver 以及 setImmediate的
         * 优先级来判断,支持哪个就用哪个,如果执行环境不支持,会采用setTimeout(fn,0)代替:
         */
        timerFunc()
    }
    //当nextTick不传参数的时候,提供一个Promise化的调用
    //$flow-disable-line
    if(!cb && typeof Promise !== 'undefined'){
        return new Promise(resolve => {
            _resolve = resolve
        })
    }
}

/**
 * 先来看 nextTick 函数,传入的回调函数会在 callbacks 中存起来,根据一个状态标记 pending 来判断
 * 当前是否要执行 timerFunc()
 * 
 * timerFunc() 是根据当前环境判断使用哪种方式实现,按照 Promise.then 和 MutationObserver
 * 以及 setImmediate 的优先级来判断, 支持哪个就用哪个,如果执行环境不支持,就会降级为 setTimeout 0,
 * 尽管它有执行延迟,可能造成多次渲染,算是没有办法的办法了, timerFunc() 函数中会执行 flushCallbacks
 * 函数.
 * 
 * flushCallbacks 的逻辑非常简单,对 callbacks 遍历,然后执行相应的回调函数.
 * 
 * Tips: 这里使用callbacks 而不是直接在 nextTick 中执行回调函数的原因是保证在
 * 同一个tick 内多次执行 nextTick, 不会开启多个异步任务,而把这些异步任务都压成
 * 一个同步任务,在下一个tick执行完毕.
 * 
 * 当nextTick不传cb参数是,会提供一个Promise化的调用,比如:
 * nextTick().then(() => {})
 * 这是因为nextTick中有这样的一段逻辑:
 * if(!cb && typeof Promise !== 'undefined){
 *     return new Promise(resolve => { _resolve = resolve })
 * }
 * 当 _resolve 函数执行,就会跳到 then 的逻辑中.
 */

//四,总结
/**
 * 1. vue 用 异步队列 的方式来控制DOM更新和nextTick回调先后执行
 * 2. microtask 因为其高优先级特性,能确保队列中的微任务在一次事件循环前被执行完毕
 * 3. 因为兼容性问题,vue不得不做了 microtask 向 macrotask 的降级方案
 * 
 * 通俗来讲,原理就是使用 宏任务 和 微任务 来完成事件调用的机制,让自己的回调事件在
 * 一个eventloop 的最后执行. 宏任务或微任务根据浏览器情况采取不同的api, 再通俗一点,
 * 可以把nextTick想象成为setTimeout 你就是要把这个事件放到本次事件的循环末尾调用
 * 
 * Vue 是异步更新DOM的,在平常的开发过程中,我们可能会需要基于更新后的DOM状态来做点什么,
 * 比如后端接口数据发生了变化,某些方法是依赖于更新后的DOM变化,这时我们就可以使用 Vue.nextTick(callback)方法.
 */