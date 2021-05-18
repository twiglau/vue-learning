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
        if(isDef(i) && isDef( i = i.data) && isDef( i = i.registerRouteInstance))
    }
}
