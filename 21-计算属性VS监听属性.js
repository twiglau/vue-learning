/**
 * 计算属性 VS 监听属性
 */
//1 . computed
//计算属性的初始化是发生在 Vue 实例初始化阶段的 initState 函数中,执行了
//if(opts.computed) initComputed(vm,opts.computed), initComputed 的
//定义在src/core/instance/state.js中:
const computedWatcherOptions = { computed:true }
function initComputed(vm: Component, computed: Object){
    //1.1 首先创建 vm._computedWatchers 为一个空对象.
    const watchers = vm._computedWatchers = Object.create(null)
    
    const isSSR = isServerRendering()
    //1.2 对computed对象做遍历.
    for(const key in computed){
        //拿到计算属性的每一个userDef
        const userDef = computed[key]
        //然后尝试获取这个 userDef 对应的 getter 函数,
        const getter = typeof userDef === 'function' ? userDef : userDef.get
        //拿不到情况下,则在开发环境下报警告.
        if(process.env.NODE_ENV !== 'production' && getter == null){
            warn(
                `Getter is missing for computed property "${key}" .` ,
                vm
            )
        }
        //接下来为每一个 getter 创建一个 watcher,
        //这个 watcher 和 渲染 watcher 有一点很大的不同,它是一个 computed watcher,
        //因为 const computedWatcherOptions = {computed:true}
        if(!isSSR){
            // create internal watcher for the computed property.
            watchers[key] = new Watcher(
                vm,
                getter || noop,
                noop,
                computedWatcherOptions
            )
        }

        // component-defined computed properties are already defined on the
        // component prototype. We only need to define computed properties defined
        // at instantiation here.
        // 最后对判断如果key 不是 vm 的属性,则调用 defineComputed(vm,key,userDef),
        // 否则判断计算属性对于的 key 是否已经被 data 或者 prop 所占用,如果是的话则在开发环境
        // 报相应的警告.
        if(!(key in vm )){
            defineComputed(vm,key,userDef)
        }else if(process.env.NODE_ENV !== 'production'){
            if(key in vm.$data){
                warn(
                    `The computed property "${key}" is already defined in data. `,
                    vm
                )
            }else if(vm.$options.props && key in vm.$options.props){
                warn(`The computed property "${key}" is already defined as a prop. `,vm)
            }
        }
    }
}

//defineComputed 的实现:
export function defineComputed(
    target:any,
    key:string,
    userDef:Object | Function
){
    const shouldCache = !isServerRendering()
    if(typeof userDef === 'function'){
        sharedPropertyDefinition.get = shouldCache? createComputedGetter(key) : userDef
        sharedPropertyDefinition.set = noop
    } else {
        sharedPropertyDefinition.get = userDef.get
           ? shouldCache && userDef.cache !== false
             ? createComputedGetter(key)
             : userDef.get
           : noop
        sharedPropertyDefinition.set = userDef.set
           ? userDef.set
           : noop
    }
    if(process.env.NODE_ENV !== 'production' && sharedPropertyDefinition.set === noop){
        sharedPropertyDefinition.set = function(){
            warn(
                `Computed property "${key}" was assigned to but it has no setter. `,
                this
            )
        }
    }
    Object.defineProperty(target,key,sharedPropertyDefinition)
}
/**
 * 就是利用 Object.defineProperty 给计算属性对应的 key 值添加 getter 和 setter,
 * setter 通常是计算属性是一个对象, 并且拥有 set 方法的时候才有,否则是一个空函数.
 * 关注 createComputedGetter(key)的返回值.
 */
function createComputedGetter (key) {
    return function computedGetter (){
        const watcher = this._computedWatchers && this._computedWatchers[key]
        if(watcher){
            watcher.depend()
            return watcher.evaluate()
        }
    }
}
/**
 * 计算属性是一个 computed watcher, 它和普通的 watcher 有什么区别?
 */
var vm = new Vue({
    data:{
        firstName: 'Foo',
        lastName:'Bar'
    },
    computed:{
        fullName: function() {
            return this.firstName + ' ' + this.lastName
        }
    }
})
//当初始化这个 computed watcher 实例的时候,构造函数部分逻辑稍有不同:
constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
){
    // computed watcher 并不会立刻求值,同时持有一个 dep 实例.
    if(this.computed){
        this.value = undefined
        this.dep = new Dep()
    }else{
        this.value = this.get()
    }
}
//当我们的 render 函数执行访问到 this.fullName 的时候, 就触发了计算属性的 getter, 它会拿到计算属性对应的 watcher,
//然后执行 watcher.depend()
/**
 * Depend on this watcher. Only for computed property watchers.
 */
depend(){
    if(this.dep && Dep.target){
        this.dep.depend()
    }
}
//注意,这时候的 Dep.target 是渲染 watcher, 所以 this.dep.depend() 相当于渲染 watcher 订阅了这个 computed watcher 的变化.
//然后在执行 watcher.evaluate() 去求值:
/**
 * Evaluate and return the value of the watcher.
 * This only gets called for computed property watchers.
 */
evaluate() {
    if(this.dirty){
        this.value = this.get()
        this.dirty = false
    }
    return this.value
}
//由于 this.firstName 和 this.lastName 都是响应式对象,这里会触发它们的 getter,它们会把自身持有的 dep
//添加到当前正在计算的 watcher 中, 这个时候 Dep.target 就是这个 computed watcher.

//一旦我们对计算属性依赖的数据做修改,则会触发 setter 过程,通知所有订阅它变化的 watcher 更新, 执行 watcher.update()
//方法:
if(this.computed){
    if(this.dep.subs.length === 0){
        this.dirty = true
    }else{
        this.getAndInvoke( () => {
            this.dep.notify()
        })
    }
}else if(this.sync){
    this.run()
}else{
    queueWatcher(this)
}
//对于计算属性这样的 computed watcher, 它实际上是有2种模式, lazy 和 active.
//如果 this.dep.subs.length === 0 成立, 则说明没有人去订阅这个 computed watcher 的变化.
//仅仅把 this.dirty = true, 只有当下次再访问这个计算属性的时候才会重新求值.
//在我们场景下, 渲染 watcher 订阅了这个 computed watcher 的变化.

this.getAndInvoke( () =>{
    this.dep.notify()
})
getAndInvoke(cb: Function){
    const value = this.get()
    if(value !== this.value ||
        //Deep watchers and watchers on Object/Arrays should fire even
        //when the value is the same, because the value may have mutated.
        isObject(value) ||
        this.deep
    ){
        //set new value
        const oldValue = this.value
        this.value = value
        this.dirty = false
        if(this.user){
            try {
                cb.call(this.vm,value,oldValue)
            }catch (e) {
                handleError(e,this.vm,`callback for watcher "${this.expression}"`)
            }
        }else{
            cb.call(this.vm,value,oldValue)
        }
    }
}
// getAndInvoke 函数会重新计算,然后对比新旧值,如果变化了则执行回调函数,那么这里这个回调函数是 this.dep.notify(),
// 在我们这个场景下就是触发了渲染 watcher 重新渲染.

// 计算属性本质就是一个 computed watcher

// 2 .watch
// 监听属性的初始化也是发生在 Vue 的实例初始化阶段的 initState 函数中, 在 computed 初始化之后:
if(opts.watch && opts.watch !== nativeWatch){
    initWatch(vm,opts.watch)
}
//来看下 initWatch 的实现,定义在 src/core/instance/state.js中:
function initWatch(vm:Component,watch:Object){
    for(const key in watch){
        const handler = watch[key]
        if(Array.isArray(handler)){
            for(let i = 0; i < handler.length; i++){
                createWatcher(vm,key,handler[i])
            }
        }else{
            createWatcher(vm,key,handler)
        }
    }
}
//createWatcher
function createWatcher (
    vm:Component,
    expOrFn: string | Function,
    handler:any,
    options?:Object
){
    if(isPlainObject(handler)){
        options = handler
        handler = handler.handler
    }
    if(typeof handler === 'string'){
        handler = vm[handler]
    }
    return vm.$watch(expOrFn,handler,options)
}
//$watch 是Vue原型上的方法,它是在执行 stateMixin 时候定义:
Vue.prototype.$watch = function(
    expOrFn:string | Function,
    cb:any,
    options?: Object
): Function {
    const vm:Component = this
    if(isPlainObject(cb)){
        return createWatcher(vm,expOrFn,cb,options)
    }
    options = options || {}
    options.user = true
    const watcher == new Watcher(vm,expOrFn,cb,options)
    if(options.immediate){
        cb.call(vm,watcher.value)
    }
    return function unwatchFn (){
        watcher.teardown()
    }
}
//也就是说,监听属性 watch 属性最终会调用 $watch 方法,这个方法首先判断 cb 如果是一个对象,则调用 createWatcher 方法.
//接着执行 const watcher = new Watcher(vm,expOrFn,cb,options) 实例化了一个 watcher,

// 本质上监听属性也是基于 Watcher 实现的, 它是一个 user watcher.

//Watcher options
//Watcher 的构造函数对 options 做了处理:
if(options){
    this.deep = !!options.deep
    this.user = !!options.user
    this.computed = !!options.computed
    this.sync = !!options.sync
    // ...
} else {
    this.deep = this.user = this.computed = this.sync = false
}
// 2.1 deep watcher
// 对对象做深度观测的时候,需要设置这个属性为 true.
var vm = new Vue({
    data() {
        a: {
            b: 1
        }
    },
    watch: {
        a: {
            handler(newVal){
                console.log(newVal)
            }
        }
    }
})
vm.a.b = 2
//这个时候是不会log任何数据的,因为我们是 watch了 a 对象,只触发了 a 的getter,并没有触发 a.b 的 getter,
//所以并没有订阅它的变化,导致我们对 vm.a.b = 2 赋值的时候,虽然触发了 setter, 但没有可通知的对象,
//所以也并不会触发watch的回调函数.

//而我们只需要对代码稍稍修改,就可以观测到这个变化了
watch:{
    a:{
        deep:true,
        handler(newVal){
            console.log(newVal)
        }
    }
}
//这样就创建了一个 deep watcher 了, 在 watcher 执行 get 求值的过程中有一段逻辑:
get(){
    let value = this.getter.call(vm,vm)
    // ...
    if(this.deep){
        traverse(value)
    }
}
//在对watch的表达式或者函数求值后, 会调用 traverse 函数,定义在: src/core/observer/traverse.js中:
import { _Set as Set,isObject } from '../util/index'
import { SimpleSet } from '../util/index'
import VNode from '../vdom/vnode'

const seenObjects = new Set()
/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
export function traverse(val:any){
    _traverse(val,seenObjects)
    seenObjects.clear()
}
function _traverse(val:any,seen:SimpleSet) {
    let i,keys
    const isA = Array.isArray(val)
    if((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode){
        return
    }
    if(val.__ob__){
        const depId = val.__ob__.dep.id
        if(seen.has(depId)){
            return
        }
        seen.add(depId)
    }
    if(isA){
        i = val.length
        while( i-- ) _traverse(val[i],seen)
    }else{
        keys = Object.keys(val)
        i = keys.length
        while( i-- ) _traverse(val[keys[i]],seen)
    }
}

//2.2 user watcher
//通过 vm.$watch 创建的 watcher 是一个 user watcher, 如下:
get(){
    if(this.user){
        handleError(e,vm,`getter for watcher "${this.expression}"`)
    }else{
        throw e
    }
},
getAndInvoke(){
    // ...
    if(this.user){
        try {
            this.cb.call(this.vm,value,oldValue)
        }catch( e ){
            handleError(e,this.vm,`callback for watcher "${this.expression}"`)
        }
    }else{
        this.cb.call(this.vm,value,oldValue)
    }
}

//2.3 computed watcher

//2.4 sync watcher
//对 setter 的分析过程知道,当响应式数据发送变化后,触发了 watcher.update(),
//只是把这个 watcher 推送到一个队列中, 在 nextTick 后才会真正执行 watcher 的回调函数.
//而一旦我们设置了 sync, 就可以在当前 Tick 中同步执行 watcher 的回调函数.
update(){
    if(this.computed){
        //...
    }else if(this.sync){
        this.run()
    }else {
        queueWatcher(this)
    }
}

/**
 * 计算属性本质上是 computed watcher, 而侦听属性本质上是 user watcher. 
 * 就应用场景而言:
 * 1 -> 计算属性适合用在模板渲染中,某个值是依赖了其他的响应式对象甚至是计算属性而来;
 * 2 -> 侦听属性使用于观测某个值得变化,然后去完成一段复杂的业务逻辑.
 */

