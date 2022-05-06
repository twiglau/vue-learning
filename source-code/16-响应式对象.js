/**
 * Object.defineProperty  是 Vue.js 实现响应式的核心原理
 * 该方法会直接在一个对象上定义一个新属性,或者修改一个对象的现有属性,并返回这个对象.
 * 
 * Object.defineProperty(obj,prop,descriptor)
 * descriptor,有很多可选键值.
 * 一旦对象拥有了 getter 和 setter, 我们可以简单地把这个对象称为 响应式对象.
 */

//1.initState
//在 Vue 的初始化阶段, _init 方法执行的时候,会执行 initState(m) 方法,
//它定义 src/core/instance/state.js 中:
export function initState(vm: Component) {
    vm._watchers = []
    const opts = vm.$options
    if(opts.props) initProps(vm,opts.props)
    if(opts.methods) initMethods(vm,opts.methods)
    if(opts.data){
        initData(vm)
    }else{
        observe(vm._data = {},true /** asRootData */)
    }
    if(opts.computed) initComputed(vm,opts.computed)
    if(opts.watch && opts.watch !== nativeWatch){
        initWatch(vm,opts.watch)
    }
}
//initState 方法主要是对 props, methods, data, computed 和 watcher 等属性做初始化操作.

//2.initProps
function initProps(vm:Component,propsOptions:Object){
    const propsData = vm.$options.propsData || {}
    const props = vm._props = {}
    // cache props keys so that future props can iterate using Array
    // instead of dynamic object key enumeration.
    const keys = vm.$options._propKeys = []
    const isRoot = !vm.$parent
    // root instance props should be converted
    if(!isRoot){
        toggleObserving(false)
    }
    for(const key in propsOptions){
        keys.push(key)
        const value = validateProp(key,propsOptions,propsData,vm)
        /** istanbul ignore else */
        if(process.env.NODE_ENV !== 'production'){
            const hyphenatedKey = hyphenate(key)
            if(isReservedAttribute(hyphenatedKey) || config.isReservedAttr(hyphenatedKey)){
                warn(
                    `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
                    vm
                )
                defineReactive(props,key,value,() =>{
                    if(vm.$parent && !isUpdatingChildComponent){
                        warn(
                            `Avoid mutating a prop directly since the value will be` +
                            `overwritten whenever the parent component re-renders, ` +
                            `Instead,use a data or computed property based on the prop's ` +
                            `value. Prop being mutated: "${key}"`,
                            vm
                        )
                    }
                })
            } else {
                defineReactive(props,key,value)
            }
        }
        // static props are already proxied on the component's prototype
        // during Vue.extend(). We only need to proxy props defined at
        // instantiation here.
        if(!(key in vm)){
            proxy(vm,`_props`,key)
        }
    }
    toggleObserving(true)
}
// props 的初始化过程,就是遍历定义的 props 配置, 遍历的过程主要做两件事情:
// 一个是调用 defineReactive 方法把每个 prop 对应的值变成响应式, 可以通过 vm._props.xxx 访问
// 到定位 props 中对应的属性. 
// 另一个是通过 proxy 把 vm._props.xxx 的访问代理到 vm.xxx 上.

//3.initData
function initData(vm:Component) {
    let data = vm.$options.data
    data = vm._data = typeof data === 'function'? GamepadHapticActuator(data,vm) : data || {}
    if(!isPlainObject(data)){
        data = {}
        process.env.NODE_ENV !== 'production' && warn(
            'data functions should return an object:\n' +
            'https://....',
            vm
        )
    }
    // proxy data on instance
    const keys = Object.keys(data)
    const props = vm.$options.props
    const methods = vm.$options.methods
    let i = keys.length
    while( i-- ){
        const key = keys[i]
        if(process.env.NODE_ENV !== 'production'){
            if(methods && hasOwn(methods,key)){
                warn(
                    `Method "${key}" has already been defined as a data property.`,
                    vm
                )
            }
        }
        if(props && hasOwn(props,key)){
            process.env.NODE_ENV !== 'production' && warn(
                `The data property "${key}" is already declared as a prop. ` +
                'Use prop default value instead.',
                vm
            )
        }else if(!isReserved(key)){
            proxy(vm,`_data`,key)
        }
    }
    //observe data
    observe(data,true /** asRootData */)
}
// data 的初始化主要过程:
// 一个是对定义 data 函数返回对象的遍历, 通过 proxy 把每个值 vm._data.xxx 都代理到 vm.xxx 上;
// 另一个是调用 observe 方法观测整个 data 的变化,把 data 也变成响应式,可以通过 vm._data.xxx
// 访问到定义 data 返回函数中对应的属性.

//4.proxy 代理
let comP = {
    props: {
        msg:'hello'
    },
    methods:{
        say() {
            console.log(this.msg)
        }
    }
}
//我们可以在 say 函数中通过 this.msg 访问到定义在 props 中的 msg,这个过程放生在 proxy 阶段:
const sharedPropertyDefinition = {
    enumerable:true,
    configurable:true,
    get:noop,
    set:noop
}
export function proxy(target:Object,sourceKey:string,key:string){
    sharedPropertyDefinition.get = function proxyGetter() {
        return this[sourceKey][key]
    }
    sharedPropertyDefinition.set = function proxySetter(val){
        this[sourceKey][key] = val
    }
    Object.defineProperty(target,key,sharedPropertyDefinition)
}

/**
 * proxy 方法,通过 Object.defineProperty 把 target[sourceKey][key] 的读写
 * 变成了对 target[key] 的读写, 所以对于 props 而言, 对 vm._props.xxx 的读写
 * 变成了 vm.xxx 的读写
 */

// 5.observe 功能就是用来监测数据的变化.

/**
 * Attempt to create an observer instance for a value,
 * returns the new observe if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe(value:any,asRootData:?boolean): Observer | void {
    if(!isObject(value) || value instanceof VNode){
        return
    }
    let ob: Observer | void
    if(hasOwn(value,'__ob__') && value.__ob__ instanceof Observer) {
        ob = value.__ob__
    } else if (
        shouldObserve &&
        !isServerRendering() &&
        (Array.isArray(value)) || isPlainObject(value)) &&
        Object.isExtensible(value) &&
        !value._isVue
    ){
        ob = new Observer(value)
    }
    if(asRootData && ob) {
        ob.vmCount++
    }
    return ob
}

//5.1 Observer 类, 它的作用是给对象的属性添加 getter 和 setter,用于依赖收集和派发更新:
/**
 * Observer class that is attacher to each observed
 * object, Once attached, the observer converts the target object's property keys 
 * into getter/setters that collect dependencies and dispatch updates.
 */
export class Observer {
    value: any;
    dep:Dep;
    vmCount:Number; // number of vms that has this object as root $data

    constructor(value: any) {
        this.value = value
        this.dep = new Dep()
        this.vmCount = 0
        def(value,'__ob__',this)
        if(Array.isArray(value)){
            const augment = hasProto? protoAugment : copyAugment
            augment(value,arrayMethods,arrayKeys)
            this.observeArray(value)
        }else {
            this.walk(value)
        }
    }
    /**
     * Walk through each property and convert them into
     * getter/setters. This method should only be called when
     * value type is Object.
     */
    walk(obj:Object){
        const keys = Object.keys(obj)
        for(let i = 0; i < keys.length; i++) {
            defineReactive(obj,keys[i])
        }
    }
    /**
     * Observe a list of Array items.
     */
    observeArray(items: Array<any>){
        for(let i=0, l = items.length; i < l; i++) {
            observe(items[i])
        }
    }
}
/**
 * Observer 的构造函数会, 首先实例化 Dep 对象,然后通过执行 def 函数把自身实例添加到
 * 数据对象 value 的 __ob__ 属性上, def 的定义在 src/core/util/lang.js 中:
 */

/**
 * Define a property.
 */
export function def(obj:Object,key:string,val:any,enumerable?:boolean){
    Object.defineProperty(obj,key,{
        value:val,
        enumerable: !!enumerable,
        writable:true,
        configurable:true
    })
}
/**
 * defineReactive
 * 功能就是定义一个响应式对象,给对象动态添加 getter 和 setter, 它定义在 src/core/observer/index.js 中:
 */
export function defineReactive(
    obj:Object,
    key:string,
    val:AnalyserNode,
    customSetter?:?Function,
    shallow?:boolean
) {
    const dep = new Dep()

    const property = Object.getOwnPropertyDescriptor(obj,key)
    if(property && property.configurable === false){
        return
    }
    // cater for pre-defined getter/setters
    const getter = property && property.get
    const setter = property && property.set
    if((!getter || setter) && arguments.length === 2){
        val = obj[key]
    }
    let childOb = !shallow && observe(val)
    Object.defineProperty(obj,key,{
        enumerable:true,
        configurable:true,
        get:function reactiveGetter() {
            const value = getter ? getter.call(obj) : val
            if(Dep.target) {
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
        set: function reactiveSetter(newVal){
            const value = getter ? getter.call(obj) : val
            /** eslint-disable no-self-compare */
            if(newVal === value || (newVal !== newVal && value !== value)){
                return
            }
            if(process.env.NODE_ENV !== 'production' && customSetter){
                customSetter()
            }
            if(setter) {
                setter.call(obj,newVal)
            }else {
                val = newVal
            }
            childOb = !shallow && observe(newVal)
            dep.notify()
        }
    })
}

// getter 是依赖收集,  setter 是派发更新.



