export function defineReactive (
    obj:Object,
    key:String,
    val:any,
    customSetter?: ?Function,
    shallow?: boolean
) {
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
    let childOb = !shallow && observe(val)
    Object.defineProperty(obj,key,{
        enumerable: true,
        configurable: true,
        get: function reactiveGetter() {
            const value = getter ? getter.call(obj) : val
            if(Dep.target){
                dep.depend()
                if(childOb){
                    childOb.dep.depend()
                    if(Array.isArray(value)){
                        dependArray(value)
                    }
                }
            }
            return value
        },
        // ...
    })
}

/**
 * Dep 是整个 getter 依赖收集的核心, 在 src/core/observer/dep.js 中:
 */
import  Watcher from './watcher'
import { remove } from '../util/index'

let uid = 0

/**
 * A dep is an observalble that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
    static target: ?Watcher;
    id: number,
    subs: Array<Watcher>;

    constructor(){
        this.id = uid++
        this.subs = []
    }

    addSub(sub:Watcher){
        this.subs.push(sub)
    }

    removeSub(sub: Watcher){
        remove(this.subs,sub)
    }

    depend(){
        if(Dep.target){
            Dep.target.addDep(this)
        }
    }
    notify(){
        //stabilize the subscriber list first
        const subs = this.subs.slice()
        for(let i = 0; l = subs.length; i < l; i++){
            subs[i].update()
        }
    }
}


    //the current target watcher being evaluated.
    //this is globally unique because there could be only one
    //watcher being evaluated at any time.
    Dep.target = null
    const targetStack = []

    expoort function pushTarget(_target:?Watcher){
        if(Dep.target) targetStack.push(Dep.target)
        Dep.target = _target
    }
    export function popTarget(){
        Dep.target = targetStack.pop()
    }
    //Dep 是一个Class,它定义了一些属性和方法,这里需要特别注意的是它有一个静态属性 target,
    //这是一个全局的唯一 Watcher
    //在同一时间只能有一个全局的 Watcher 被计算,另外它的自身属性subs 也是 Watcher 的数组.
    //Dep 实际上就是对 Watcher 的一种管理. src/core/observer/watcher.js中:

    //Watcher

    let uid = 0

    /**
     * A watcher parses an expression, collects dependencies, and fires callback when the
     * expression value changes, This is used for both the $watch() api and directives.
     */
    export default class Watcher {
        vm: Component;
        expression:string;
        cb:Function;
        id: Number;
        deep:boolean;
        user:boolean;
        computed:boolean;
        sync:boolean;
        dirty:boolean;
        active:boolean;
        dep:Dep;
        deps: Array<Dep>;
        newDeps:Array<Dep>;
        depIds:SimpleSet;
        newDepIds:SimpleSet;
        before:?Function;
        getter:Function;
        value:any;

        constructor (
            vm: Component,
            expOrFn: string | Function,
            cb: Function,
            optons?: ?Object,
            isRenderWatcher?: boolean
        ) {
            this.vm = vm
            if(isRenderWatcher){
                vm._watcher = this
            }
            vm._watchers.push(this)
            //options
            if(options){
                this.deep = !!options.deep
                this.user = !!options.user
                this.computed = !!options.computed
                this.sync = !!options.sync
                this.before = options.before
            }else{
                this.deep = this.user = this.computed = this.sync = false
            }
            this.cb = cb
            this.id = ++uid // uid for batching
            this.active = true
            this.dirty = this.computed // for computed watchers
            this.deps = []
            this.newDeps = []
            this.depIds = new Set()
            this.newDepIds = new Set()
            this.expression = process.env.NODE_ENV !== 'production'? expOrFn.toString() : ''
            // parse expression for getter
            if(typeof expOrFn === 'function'){
                this.getter = expOrFn
            }else{
                this.getter = parsePath(expOrFn)
                if(!this.getter){
                    this.getter = function(){}
                    process.env.NODE_ENV !== 'production' && warn(
                        'Failed watching path: "${expOrFn}" ' + 
                        'Watcher only accepts simple dot-delimited paths. ' +
                        'For full control, use a function instead.',
                        vm
                    )
                }
            }
            if(this.computed){
                this.value = undefined
                this.dep = new Dep()
            }else{
                this.value = this.get()
            }
        }

        /**
         * Evaluate the getter, and re-collect dependencies.
         */
        get(){
            pushTarget(this)
            let value
            const vm = this.vm
            try {
                value = this.getter.call(vm,vm)
            }catch(e){
                if(this.user){
                    handleError(e,vm,`getter for watcher "${this.expression}"`)
                }else{
                    throw e
                }
            }finally{
                // "touch" every property so they are all tracked as
                // dependencies for deep watching
                if(this.deep){
                    traverse(value)
                }
                popTarget()
                this.cleanupDeps()
            }
            return value
        }
        /**
         * Add a dependency to this directive.
         */
        addDep(dep:Dep){
            const id = dep.id
            if(!this.newDepIds.has(id)){
                this.newDepIds.add(id)
                this.newDeps.push(dep)
                if(!this.depIds.has(id)){
                    dep.addSub(this)
                }
            }
        }
        /**
         * Clean up for dependency collection.
         */
        cleanupDeps() {
            let i = this.deps.length
            while( i-- ){
                const dep = this.deps[i]
                if(!this.newDepIds.has(dep.id)){
                    dep.removeSub(this)
                }
            }
            let tmp = this.depIds
            this.depIds = this.newDepIds
            this.newDepIds = tmp
            this.newDepIds.clear()
            tmp = this.deps
            this.deps = this.newDeps
            this.newDeps = tmp
            this.newDeps.length = 0
        }
        // ...
    }

    //1. 过程分析
    // 对数据对象的访问会触发它们的 getter 方法,那么这些对象什么时候被访问? Vue 的 mount 过程是通过
    // mountComponent 函数

    updateComponent = () => {
        vm._update(vm._render(),hydrating)
    }
    new Watcher(vm,updateComponent,noop,{
        before(){
            if(vm._isMounted){
                callHook(vm,'beforeUpdate')
            }
        }
    },true /** isRenderWatcher */)

    // 当我们去实例化一个渲染 watcher 时,首先进入 watcher 的构造函数逻辑,然后执行它的 this.get() 方法.
    //pushTarget 的定义在 src/core/observer/dep.js 中:
    export function pushTarget(_target:Watcher){
        if(Dep.target) targetStack.push(Dep.target)
        Dep.target = _target
    }
    // 对于 value = this.getter.call(vm,vm) 的解释:
    // this.getter 对应就是 updateComponent 函数,实际上就是在执行:
    vm._update(vm._render(),hydrating)
    // 该方法会先执行 vm._render 方法,该方法会生成渲染 VNode,并且在这个过程中会对 vm 上的数据访问, 这个时候就触发了
    // 数据对象的 getter.

    //那么每个对象值得getter 都持有一个 dep, 在触发getter 的时候会调用 dep.depend()方法,也就会执行 Dep.target.addDep(this).





    
    //Watcher 和 Dep 是一种非常经典的 观察者设计模式的实现
