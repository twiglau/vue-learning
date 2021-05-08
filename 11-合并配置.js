/**
 * 合并配置
 * new Vue 的过程有2种场景: 
 * 1. 主动调用 new Vue(options) 的方式实例化一个对象;
 * 2. 另一种是上节分析的组件过程中内部通过 new Vue(options) 实例化子组件.
 */

import { initInternalComponent } from "./10-patch"

//无论哪种场景,都会执行实例的 _init(options) 方法,它首先会执行一个 merge options 的逻辑
// 相关代码在  src/core/instance/init.js 中:
Vue.prototype._init = function(options?:Object) {
    // merge options
    if(options && options._isComponent) {
        //optimize internal component instantiation
        //since dynamic options merging is pretty slow, and none of the
        //internal component options needs special treatment.
        initInternalComponent(vm,options)
    } else {
        vm.$options = mergeOptions(
            resolveConstructorOptions(vm.constructor),
            options || {},
            vm
        )
    }
    // ...
}
// 可以看到不同场景对于 options 的合并逻辑是不一样的,且传入的 options 值也有非常大的不同,接下来会介绍2种场景的 options合并过程.
import Vue from 'vue'
import { extend } from "vue/types/umd"
let childComp = {
    template:'<div>{{msg}}</div>',
    created(){
        console.log('child created')
    },
    mounted(){
        console.log('child mounted')
    },
    data(){
        return {
            msg:'Hello Vue'
        }
    }
}
Vue.mixin({
    created(){
        console.log('parent created')
    }
})
let app = new Vue({
    el:'#app',
    render: h => h(childComp)
})

//外部调用场景
/**
 * 当执行 new Vue 的时候,在执行 this._init(options) 的时候,就会执行如下逻辑合并 options:
 */
vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
)
//这里通过调用 mergeOptions 方法来合并,它实际上就是把 resolveConstructorOptions(vm.constructor)的
//返回值和options做合并,resolveConstructorOptions 的实现先不考虑,在这个场景下,它还是简单返回 vm.constructor.options,
//相当于 Vue.options, 那么这个值是什么? 在 initGlobalAPI(vue) 的时候定义了这个值,代码在
// src/core/global-api/index.js 中:
export function initGlobalAPI(Vue: GlobalAPI) {
    //...
    Vue.options = Object.create(null)
    ASSET_TYPES.forEach(type => {
        Vue.options[type + 's'] = Object.create(null)
    })

    //this is used to identify the "base" constructor to extend all plain-object
    //components with in Weex's multi-instance scenarios.
    Vue.options._base = Vue
    extend(Vue.options.components,builtInComponents)
    //...
}
//首先通过 Vue.options = Object.create(null) 创建一个空对象,然后遍历 ASSET_TYPES, 其定义在 src/shared/constants.js 中:
export const ASSET_TYPES = [
    'component',
    'directive',
    'filter'
]
//以上遍历 ASSET_TYPES 后的代码相当于:
Vue.options.components = {}
Vue.options.directives = {}
Vue.options.filters = {}

//最后通过 extend(Vue.options.components,builtInComponents) 把一些内置组件扩展到 Vue.options.components 上,
//Vue 的内置组件目前有 <keep-alive> , <transition> 和 <transition-group> 组件,这也就是为什么我们在其他组件中
//使用 <keep-alive> 组件不需要注册的原因.

// mergeOptions 这个函数, 定义在 sre/core/util/options.js 中:
/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
export function mergeOptions (
    parent:Object,
    child:Object,
    vm?:Component
): Object {
    if(process.env.NODE_ENV !== 'production'){
        checkComponents(child)
    }
    if(typeof child === 'function'){
        child = child.options
    }
    normalizeProps(child,vm)
    normalizeInject(child,vm)
    normalizeDirectives(child)
    const extendFrom = child.extends
    if(extendFrom){
        parent = mergeOptions(parent,extendsFrom,vm)
    }
    if(child.mixins){
        for(let i = 0; l = child.mixins.length;i < l; i++) {
            parent = mergeOptions(parent,child.mixins[i],vm)
        }
    }
    const options = {}
    let key
    for (key in parent) {
        mergeField(key)
    }
    for(key in child){
        if(!hasOwn(parent,key)){
            mergeField(key)
        }
    }
    function mergeField(key) {
        const strat = strats[key] || defaultStrat
        options[key] = strat(parent[key],child[key],vm,key)
    }
    return options
}
/**
 * mergeOptions 主要功能就是把 parent 和 child 这两个对象根据一些合并策略,合并成
 * 一个新对象并返回.
 * 核心几步: 先递归把extends 和 mixins 合并到 parent 上,然后遍历 parent, 调用
 * mergeField,然后再遍历 child,如果 key 不在 perent 的自身属性上,则调用 mergeField
 */

//这里有意思的是mergeField函数,它对不同的key有着不同的合并策略.
//距离来说,对于生命周期函数,它的合并策略是这样的:

function mergeHook(
    parentVal: ?Array<Function>,
    childVal: ?Function | ?Array<Function>
): ?Array<Function> {
    return childVal
      ? parentVal
        ? parentVal.concat(childVal)
        : Array.isArray(childVal)
          ? childVal
          : [childVal]
      :parentVal
}

LIFECYCLE_HOOKS.forEach(hook => {
    strats[hook] = mergeHook
})
//其中 LIFECYCLE_HOOKS 定义在 src/shared/constants.js 中:
export const LIFECYCLE_HOOKS = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestroy',
    'destroyed',
    'activated',
    'deactivated',
    'errorCaptured'
]
/**
 * 这里定义了Vue.js 所有的钩子函数名称,所以对于钩子函数,他们的合并策略都是
 * mergeHook 函数.
 * 
 * 执行以上 mergeField 函数,把合并后的结果保存到 options 对象中,最终返回它
 */
// 因此,在我们当前这个 case 下,执行完如下合并后:
vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
)
//vm.$options 的值差不多如下:
vm.$options = {
    components:{},
    created:[
        function created(){
            console.log('parent created')
        }
    ],
    directives:{},
    filters:{},
    _base: function Vue(options){
        // ...
    },
    el:"#app",
    render:function(h) {
        //...
    }
}