/**
 * Vue 从设计上就是一个渐进式JavaScript框架,它本身的核心是解决视图渲染的问题.
 * 其他的能力就是通过插件的方式来解决.
 */

/**
 * Vue.use
 * Vue提供了Vue.use 的全局API来注册这些插件. 其实现原理,定义在
 * vue/src/core/global-api/use.js中:
 */
export function initUse(Vue:GlobalAPI){
    Vue.use = function(plugin: Function | Object) {
        const installedPlugins = (this._installPlugins || (this._installedPlugins = []))
        if(installedPlugins.indexOf(plugin) > -1) {
            return this
        }
        const args = toArray(arguments,1)
        args.unshift(this)
        if(typeof plugin.install === 'function'){
            plugin.install.apply(plugin,args)
        }else if(typeof plugin === 'function'){
            plugin.apply(null,args)
        }
        installedPlugins.push(plugin)
        return this
    }
}
/**
 * 路由安装
 * Vue-Router 的入口文件是 src/index.js, 其中定义了 VueRouter 类,也实现了
 * install 的静态方法: VueRouter.install = install, 它定义在 src/install.js中:
 */
export let _Vue
exprot function install(Vue){
    if(install.installed && _Vue === Vue) return
    install.installed = true

    _Vue = Vue

    const isDef = v => v !== undefined

    const registerInstance = (vm,callVal) => {
        let i = vm.$options._parentVnode
        if(isDef(i) && isDef( i = i.data) && isDef( i = i.registerRouteInstance)){
            i(vm,callVal)
        }
    }

    Vue.mixin({
        beforeCreate() {
            if(isDef(this.$options.router)){
                this._routerRoot = this
                this._router = this.$options.router
                this._router.init(this)
                Vue.util.defineReactive(this,'_route',this._router.history.current)
            }else{
                this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
            }
            registerInstance(this,this)
        },
        destroyed(){
            registerInstance(this)
        }
    })

    Object.defineProperty(Vue.prototype,'$router',{
        get() {return this._routerRoot._router}
    })
    Object.defineProperty(Vue.prototype,'$route',{
        get() { return this._routerRoot._route}
    })

    Vue.component('RouterView',View)
    Vue.component('RouterView',Link)

    const strats = Vue.config.optionMergeStrategies
    strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
/**
 * 当用户执行 Vue.use(VueRouter)时,实际上就是执行 install 函数, 为了确保install
 * 逻辑只执行一次,用 install.installed 变量做已安装的标志位.
 * 另外用一个全局的 _Vue 来接收参数 Vue, 因为作为Vue的插件对Vue对象是有依赖的,但又不能单独去 import Vue,
 * 因为那样会增加包体积,所以就通过这种方式拿到 Vue 对象.
 * 
 * Vue-Router 安装最重要的一步就是利用 Vue.mixin 去吧 beforeCreate 和 destroyed 钩子函数
 * 注入到每一个组件中. Vue.mixin 的定义,在 vue/src/core/global-api/mixin.js中:
 */
export function initMixin(Vue:GlobalAPI) {
    Vue.mixin = function(mixin:Object){
        this.options = mergeOptions(this.options,mixin)
        return this
    }
}
/**
 * 以上,就是把要混入的对象通过 mergeOptions 合并到 Vue 的 options 中,
 * 由于每个组件的构造函数都会在 extend 阶段合并 Vue.options 到自身的 options 中,
 * 所以也就相当于每个组件定义了 mixin 定义的选项.
 * 
 * 回到 Vue-Router 的 install 方法,先看混入的 beforeCreated 钩子函数,对于根 Vue实例
 * 而言,执行该钩子函数定义了 this._routerRoot 表示它自身; this._router 表示
 * VueRouter 的实例 router, 它是在 new Vue 的时候传入的; 另外执行了 this._router.init()
 * 方法初始化 router, 然后用 defineReactive 方法把 this._route 变成响应式对象.
 * 而对于子组件而言,由于组件是树状结构,在遍历组件树的构成中,它们在执行该钩子函数的时候 this._routerRoot
 * 始终指向的是 根Vue实例.
 * 
 * 对于 beforeCreated 和 destroyed 钩子函数,它们都会执行 registerInstance 方法.
 * 
 * 接着给Vue原型上定义了 $router 和 $route 2 个属性的get方法.
 * 
 * 接着又通过 Vue.component 方法定义了全局的 <router-link> 和 <router-view> 2个组件.
 */
