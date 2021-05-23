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