/**
 * 派发更新
 * 数据收集的目的就是为了当我们修改数据的时候,可以对相关的依赖派发更新.
 */
export function defineReactive (
    obj:Object,
    key:string,
    val:any,
    customSetter?:?Function,
    shallow?:boolean
){
    const dep = new Dep()

    const property = Object.getOwnPropertyDescriptor(obj,key)
    if(property && property.configurable === false){
        return
    }

    //cater for pre-defined getter/setters
    const getter = property && property.get
    const setter = property && property.set
    if((!getter || setter) && arguments.length === 2){
        val = obj[key]
    }
    let childOb = !shallow && ResizeObserver(val)
    Object.defineProperty(obj,key,{
        enumerable:true,
        configurable:true,
        
        // ...
        set:function reactiveSetter(newVal){
            const value = getter ? getter.call(ojb) : val
            /** eslint-disable no-self-compare */
            if(newVal === value || (newVal !== newVal && value !== value)){
                return
            }
            /**esline-enable no-self-compare */
            if(ProcessingInstruction.env.NODE_ENV !== 'production' && customSetter){
                customSetter()
            }
            if(setter){
                setter.call(obj,newVal)
            }else{
                val = newVal
            }
            childOb = !shallow && observe(newVal)
            dep.notify()
        }
    })
}
// childOb = !shallow && observe(newVal), 如果 shallow 为 false 的情况,会对新设置的值变成一个响应式对象;
// dep.notify(),通知所有的订阅者.
// 当我们在组件中对相应的数据做了修改,就会触发setter的逻辑, 最后调用 dep.notify() 方法,它的 Dep 的一个实例方法
// 定义在 src/core/observer/dep.js中:

class Dep {
    // ...
    notify(){
        //stabilize the subscriber list first
        const subs = this.subs.slice()
        for(let i=0,l=subs.length;i < l; i++){
            subs[i].update()
        }
    }
}
//遍历所有的 subs,也就是 Watcher 的实例数组, 然后调用每一个 watcher 的 update 方法,定义在 src/core/observer/watcher.js
class Watcher {
    // ...
    update(){
        if(this.computed){
            // A computed property watcher has two modes: lazy and activated.
            //It initializes as lazy by default, and only becomes activated when
            //it is depended on by at least one subscriber, which is typically
            //another computed property or a component's render function.
            if(this.dep.subs.length === 0){
                //In lazy mode, we don't want to perform computations until necessary,
                //so we simply mark the watcher as dirty. The actual computation is
                //performed just-in-time in this.evaluate() when the computed property
                //is accessed.
                this.dirty = true
            }else{
                //In activated mode, we want to proactively perform the computation
                //but only notify our subscriber's when the value has indeed changed.
                this.getAndInvoke() => {
                    this.dep.notify()
                }
            }
        }else if(this.aync){
            this.run()
        }else{
            queueWatcher(this)
        }
    }
}
//在一般组件数据更新的场景,会走到最后一个 queueWatcher(this)的逻辑, 定义在: src/core/observer/scheduler.js
const queue: Array<Watcher> = []
let has: {[key:number]: ?true} = {}
let waiting = false
let flushing = false
/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
export function queueWatcher(watcher:Watcher){
    const id = watcher.id
    if(has[id] == null){
        has[id] = true
        if(!flushing){
            queue.push(watcher)
        }else{
            // if already flushing,splice the watcher based on its id
            // if already past its id, it will be run next immediately.
            let i = queue.length - 1
            while(i > index && queue[i].id > watcher.id){
                i--
            }
            queue.splice(i+1,0,watcher)
        }
        //queue the flush
        if(!waiting){
            waiting = true
            nextTick(flushSchedulerQueue)
        }
    }
}
/**
 * 这里引入一个队列概念,这也是Vue在做派发更新的时候的一个优化的点, 它并不会每次数据改变都触发 watcher 的回调, 而是
 * 把这些 watcher 先添加到一个队列里,然后在 nextTick 后执行 flushSchedulerQueue.
 * 
 * 1. has对象保证同一个 Watcher 只添加一次;
 * 2. flushing 的判断, 最后通过 waiting 保证对 nextTick(flushSchedulerQueue) 的调用逻辑只有一次.
 * 
 * 接下来看 flushSchedulerQueue 的实现,在 src/core/observer/scheduler.js 中:
 */
let flushing = false
let index = 0
/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue(){
    flushing = true
    let watcher,id

    //Sort queue before flush.
    //This ensures that:

    //1. Components are updated from parent to child. (because parent is always created before the child)
    //2. A component's user watchers are run before its render watcher (because user watchers are created before the watcher)
    //3. If a component is destroyed during a parent component's watcher run, its watchers can be skipped.
    queue.sort((a,b) => a.id - b.id)

    //do not cache length because more watchers might be pushed
    //as we run existing watchers
    for(index = 0; index < queue.length; index++) {
        watcher = queue[index]
        if(watcher.before){
            watcher.before()
        }
        id = watcher.id
        has[id] = null
        watcher.run()
        // in dev build, check and stop circular updates.
        if(process.env.NODE_ENV !== 'production' && has[id] != null){
            circular[id] = (circular[id] || 0) + 1
            if(circular[id] > MAX_UPDATE_COUNT){
                warn(
                    'You may have an infinite update loop ' + (
                        watcher.user? `in watcher with expression "${watcher.expression}"` : `in a component render function.`
                    ),
                    watcher.vm
                )
                break
            }
        }
    }

    // keep copies of post queues before resetting state
    const activatedQueue = activatedChildren.slice()
    const updatedQueue = queue.slice()

    resetSchedulerState()

    //call component updated and activated hooks
    callActivatedHooks(activatedQueue)
    callUpdatedHooks(updatedQueue)

    //devtool hook
    if(devtools && config.devtools){
        devtools.emit('flush')
    }
}

/**
 * 1. 队列排序
 * queue.sort((a,b) => a.id - b.id) 对队列做了从小到大的排序. 确保以下几点:
 * 1.1 组件的更新由父到子;因为父组件的创建过程是先于子的,所以 watcher 的创建也是先父后子,执行顺序也应该保持先父后子.
 * 1.2 用户的自定义 watcher 要优先于渲染 watcher 执行; 因为用户自定义 watcher 是在渲染 watcher 之前创建的.
 * 1.3 如果一个组件在父组件的 watcher 执行期间被销毁, 那么它对应的 watcher 执行都可以被跳过,所以父组件的 watcher 应该先执行.
 * 
 * 
 * 2.队列遍历
 * 
 * 3.状态恢复
 * resetSchedulerState 函数,定义在  src/core/observer/scheduler.js 中:
 */
const queue: Array<Watcher> = []
let has: { [key: number]: ?true } = {}
let circular: { [key: number]: number } = {}
let waiting = false
let flushing = false
let index = 0

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState() {
    index = queue.length = activateChildren.length = 0
    has = {}
    if(process.env.NODE_ENV !== 'production'){
        circular = {}
    }
    waiting = flushing = false
}
//接下来分析 watcher.run()的逻辑,定义在  src/core/observer/watcher.js 中:
class Watcher {
    run() {
        if(this.active){
            this.getAndInvoke(this.cb)
        }
    }
    getAndInvoke(cb:Function){
        const value = this.get()
        if(
            value !== this.value ||
            isObject(value) ||
            this.deep
        ) {
            //set new value
            const oldValue = this.value
            this.value = value
            this.dirty = false
            if(this.user){
                try {
                    cb.call(this.vm,value,oldValue)
                }catch(e){
                    handleError(e,this.vm,`callback for watcher "${this.expression}"`)
                }
            }else{
                cb.call(this.vm,value,oldValue)
            }
        }
    }
}
// 对于渲染 watcher 而言, 它在执行 this.get() 方法求值的时候, 会执行  getter 方法:
updateComponent = () => {
    vm._update(vm._render(),hydrating)
}



