/**
 * Vuex初始化: 包括安装,Store实例化过程2个方面;
 */

//1.安装
//在通过 import Vuex from 'vuex' 的时候,实际上引用的是一个对象,它的定义在
//src/index.js 中:
export default {
    Store,
    install,
    version:'__VERSION__',
    mapState,
    mapMutations,
    mapGetters,
    mapActions,
    createNamespaceHelpers
}
//和Vue-Router一样,Vuex也同样存在一个静态的 install 方法,定义在src/store.js中:
export function install(_Vue){
    if(Vue && _Vue === Vue){
        if(process.env.NODE_ENV !== 'production'){
            console.error(
                `[vuex] already installed. Vue.use(Vuex) should be called only once.`
            )
        }
        return
    }
    Vue = _Vue
    applyMixin(Vue)
}
//install 的逻辑很简单, 把传入的 _Vue赋值给Vue 并执行了 applyMixin(Vue)方法,
//它的定义在src/mixin.js中:
export default function(Vue){
    const version = Number(Vue.version.split('.')[0])

    if(version >-2){
        Vue.mixin({beforeCreate:vuexInit })
    }else {
        // overside init and inject vuex init procedure
        //for 1.x backwards compatibility.
        const _init = Vue.prototype._init
        Vue.prototype._init = function(options = {}){
            options.init = options.init
              ? [vuexInit].concat(options.init)
              : vuexInit
            _init.call(this,options)
        }
    }
    /**
     * Vuex init hook, injected into each instances init hooks list.
     */
    function vuexInit() {
        const options = this.$options
        //store injection
        if(options.store){
            this.$store = typeof options.store === 'function'
              ? options.store()
              : options.store
        }else if(options.parent && options.parent.$store){
            this.$store = options.parent.$store
        }
    }
}

//applyMixin 就是以上这个 export default function,其实就是全局
//混入了一个 beforeCreated 钩子函数,它的实现非常简单, 就是把 options.store
//保存在所有组件的 this.$store 中, 这个 options.store 就是我们在实例化 Store
//对象的实例.

//2.Store实例化
//在 import Vuex 之后,会实例化其中的 Store 对象,返回 store 实例并传入
// new Vue 的options 中,也就是我们刚才提到的 options.store.
export default new Vuex.Store({
    actions,
    getters,
    state,
    mutations,
    modules
    //...
})
//Store对象的构造函数接收一个对象参数,它包含 actions, getters,state,mutations,
// modules 等Vuex的核心概念,它的定义在 src/store.js中:
export class Store {
    constructor (options = {}){
        //Auto install if it is not done yet and `window` has 'Vue'.
        //To allow users to avoid auto-installation in some case,
        //this code should be placed here. See #731
        if(!Vue && typeof window !== 'undefined' && window.Vue){
            install(window.Vue)
        }
        if(process.env.NODE_ENV !== 'production'){
            assert(Vue,`must call Vue.use(Vuex) before creating a store instance.`)
            assert(typeof Promise !== 'undefined',`vuex requires a Promise polyfill in this browser.`)
            assert(this instanceof Store,`Store must be called with the new operator.`)
        }

        const {
            plugins = [],
            strict = false
        } = options

        //store internal state
        this._committing = false
        this._actions = Object.create(null)
        this._actionsSubscribers = []
        this._mutations = Object.create(null)
        this._wrappedGetters = Object.create(null)
        this._modules = new ModuleCollection(options)
        this._modulesNamespaceMap = Object.create(null)
        this._subscribers = []
        this._watcherVM = new Vue()

        //bind commit and dispatch to self
        const store = this
        const {dispatch,commit } = this
        this.dispatch = function boundDispatch(type,payload) {
            return dispatch.call(store,type,payload)
        }
        this.commit = function boundCommit(type,payload,options){
            return commit.call(store,type,payload,options)
        }

        //strict mode
        this.strict = strict
        const state = this._modules.root.state

        //init root module.
        //this also recursively registers all sub-modules
        //and collects all module getters inside this._wrappedGetters
        installModule(this,state,[],this._modules.root)

        //initialize the store vm, which is responsible for the reactivity
        //(also registers _wrappedGetters as computed properties)
        resetStoreVM(this,state)

        //apply plugins
        plugins.forEach(plugin => plugin(this))
        if(Vue.config.devtools){
            devtoolPlugin(this)
        }
    }
}

//2.初始化模块,对于Vuex的意义:
//由于使用单一状态树,应用的所有状态会集中到一个比较大的对象,当应用变得非常
//复杂时,store对象就有可能变得相当臃肿.为了解决以上问题,Vuex允许我们将store
//分割成模块(module). 每个模块拥有自己的 state, mutation, action, getter, 
//甚至是嵌套子模块 ---- 从上到下进行同样方式的分割:
const moduleA = {
    state:{},
    mutations:{},
    actions:{},
    getters:{}
}
const moduleB = {
    state:{},
    mutations:{},
    actions:{},
    getters:{},
}   
const store = new Vuex.Store({
    modules:{
        a:moduleA,
        b:moduleB
    }
})

store.state.a // -> moduleA 的状态
store.state.b // -> moduleB 的状态

//从数据结构上来看,模块的设计就是一个树型结构, store本身可以理解为一个root
//module, 它下面的 modules 就是子模块, Vuex 需要完成这颗树的构建,构建过程的入口就是:
this._modules = new ModuleCollection(options)
//ModuleCollection 的定义在 src/module/module-collection.js 中:
export default class ModuleCollection {
    constructor(rawRootModule){
        //register root module(Vuex.Store options)
        this.register([],rawRootModule,false)
    }

    get(path){
        return path.reduce((module,key) =>{
             return module.getChild(key)
        },this.root)
    }
    getNamespace(path){
        let module = this.root
        return path.reduce((namespace,key) => {
            module = module.getChild(key)
            return namespace + (module.namespaced ? key + '/' : '')
        },'')
    }
    update(rawRootModule){
        update([],this.root,rawRootModule)
    }
    register(path,rawModule,runtime = true){
        if(process.env.NODE_ENV !== 'production'){
            assertRawModule(path,rawModule)
        }
        const newModule = new Module(rawModule,runtime)
        if(path.length === 0){
            this.root = newModule
        }else{
            const parent = this.get(path.slice(0,-1))
            parent.addChild(path[path.length - 1],newModule)
        }

        //register nested modules
        if(rawModule.modules){
            forEachValue(rawModule.modules,(rawChildModule,key) => {
                this.register(path.concat(key),rawChildModule,runtime)
            })
        }
    }
    unregister(path){
        const parent = this.get(path.slice(0,-1))
        const key = path[path.length -1]
        if(!parent.getChild(key).runtime) return

        parent.removeChild(key)
    }
}
//register 方法首先通过 const newModule = new Module(rawModule,runtime) 创建了一个
//Module 的实例, Module 是用来描述单个模块的类,它的定义在 src/module/module.js中:
export default class Module {
    constructor(rawModule,runtime){
        this.runtime = runtime
        //Store some children item
        this._children = Object.create(null)
        //Store the origin module object which passed by programmer
        this._rawModule = rawModule
        const rawState = rawModule.state

        //Store the origin module's state
        this.state = (typeof rawState === 'function' ? rawState() : rawState) || {}
    }

    get namespaced() {
        return !!this._rawModule.namespaced
    }
    addChild(key,module){
        this._children[key] = module
    }
    removeChild(key){
        delete this._children[key]
    }
    getChild(key){
        return this._children[key]
    }
    update(rawModule){
        this._rawModule.namespaced = rawModule.namespaced
        if(rawModule.actions){
            this._rawModule.actions = rawModule.actions
        }
        if(rawModule.mutations){
            this._rawModule.mutations = rawModule.mutations
        }
        if(rawModule.getters){
            this._rawModule.getters = rawModule.getters
        }
    }
    forEachChild(fn){
        forEachValue(this._children,fn)
    }
    forEachGetter(fn){
        if(this._rawModule.getters){
            forEachValue(this._rawModule.getters,fn)
        }
    }
    forEachAction(fn){
        if(this._rawModule.actions){
            forEachValue(this._rawModule.actions,fn)
        }
    }
    forEachMutation(fn){
        if(this._rawModule.mutations){
            forEachValue(this._rawModule.mutations,fn)
        }
    }
}

//安装模块
//初始化模块后,执行安装模块的相关逻辑,它的目标就是对模块中
//state, getters, mutations, actions 做初始化工作,它的入口代码是:
const state = this._modules.root.state
installModule(this,state,[],this._modules.root)

//来看下 installModule 的定义:
function installModule(store,rootState,path,module,hot){
    const isRoot = !path.length
    const namespace = store._modules.getNamespace(path)

    //register in namespace map
    if(module.namespaced){
        store._modulesNamespaceMap[namespace] = module
    }
    //set state
    if(!isRoot && !hot){
        const parentState = getNestedState(rootState,path.slice(0,-1))
        const moduleName = path[path.length -1]
        store.withCommit(() => {
            Vue.set(parentState,moduleName,module.state)
        })
    }
    const local = module.context = makeLocalContext(store,namespace,path)
    module.forEachMutation((mutation,key) => {
        const namespacedType = namespace + key
        registerMutation(store,namespacedType,mutation,local)
    })
    module.forEachAction((action,key) => {
        const type = action.root ? key : namespace + key
        const handler = action.handler || action
        registerAction(store,type,handler,local)
    })
    module.forEachGetter((getter,key) => {
        const namespacedType = namespace + key
        registerGetter(store,namespacedType,getter,local)
    })
    module.forEachChild((child,key) => {
        installModule(store,rootState,path.concat(key),child,hot)
    })
}

//命名空间的概念
//回到 installModule 方法,会先根据 path 获取 namespace:
const namespace = store._modules.getNamespace(path)

//getNamespace 的定义在 src/module/module-collection.js中:
getNamespace(path){
    let module = this.root
    return path.reduce((namespace,key) => {
        module = module.getChild(key)
        return namespace + (module.namespaced ? key + '/' : '')
    },'')
}

//本地上下恩环境:
const local = module.context = makeLocalContext(store,namespace,path)
//看下 makeLocalContext 实现:
function makeLocalContext(store,namespace,path) {
    const noNamespace = namespace === ''

    const local = {
        dispatch:noNamespace? store.dispatch : (_type,_payload,_options) => {
            const args = unifyObjectStyle(_type,_payload,_options)
            const {payload,options} = args
            let { type } = args

            if(!options || !options.root){
                type = namespace + type
                if(process.env.NODE_ENV !== 'production' && !store._actions[type]){
                    console.error('')
                    return
                }
            }
            return store.dispatch(type,payload)
        },
        commit:noNamespace ? store.commit : (_type,_payload,_options) => {
            const args = unifyObjectStyle(_type,_payload,_options)
            const { payload, options } = args
            let { type } = args

            if(!options || !options.root) {
                type = namespace + type
                if(process.env.NODE_ENV !== 'production' && !store._mutations[type]){
                    console.error('')
                    return
                }
            }
            store.commit(type,payload,options)
        }
    }

    //getters and state object must be gotten lazily
    //because they will be changed by vm update
    Object.defineProperties(local,{
        getters: {
            get: noNamespace
              ? () => store.getters
              : () => makeLocalGetters(store,namespace)
        }
        state: {
            get: () => getNestedState(store.state,path)
        }
    })
    return local
}

/**
 * makeLocalContext 支持3个参数相关, store 表示 root store; namespace
 * 表示模块的命名空间, path 表示模块的 path .
 * 
 * 该方法定义了 local 对象, 对于 dispatch 和 commit 方法, 如果没有 namespace,它们就
 * 直接指向了 root store 的 dispatch 和 commit 方法, 否则会创建方法, 把 type 自动拼接上 
 * namespace, 然后执行 store 上对应的方法.
 * 
 * 对于getters 而言, 如果没有 namespace, 则直接返回 root store 的 getters,
 * 否则返回 makeLocalGetters(store,namespace) 的返回值:
 */
function makeLocalGetters(store,namespace){
    const getterProxy = {}
    const splitPos = namespace.length
    Object.keys(store.getters).forEach(type => {
        //skip if the target getter is not match this namespace
        if(type.slice(0,splitPos) !== namespace) return

        //extract local getter type
        const localType = type.slice(splitPos)

        //Add a port to the getters proxy.
        //Define as getter property because
        //we do not want to evaluate the getters in this time.
        Object.defineProperty(gettersProxy,localType,{
            get:() => store.getters[type],
            enumerable:true
        })
    })
    return gettersProxy
}