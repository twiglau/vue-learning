/**
 * 1.入口开始
 * 在web应用下,我们来分析Runtime + Compiler 构建出来的vue.js, 它的入口是
 * src/platforms/web/entry-runtime-with-compiler.js:
 */
import config from 'core/config'
import {warn,cached} from 'core/util/index'
import {mark,measure} from 'core/util/perf'

import Vue from './runtime/index'
import {query} from './util/index'
import {compileToFunctions} from './compiler/index'
import {shouldDecodeNewlines,shouldDecodeNewlinesForHref} from './util/compat'

const idToTemplate = cached(id => {
    const el = query(id)
    return el && el.innerHTML
})

const mount = Vue.prototype.$mount
Vue.prototype.$mount = function(el?:string | Element,hydrating?:boolean):Component {
    el = el && query(el)
    /** isanbul ignore if */
    if(el === document.body || el === document.documentElement) {
        process.env.NODE_ENV !== 'production' && warn(
            `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
        )
        return this
    }

    const options = this.$options
    // resolve template/el add convert to render function
    if(!options.render){
        let template = options.template
        if(template){
            if(typeof template === 'string'){
                if(template.charAt(0) === '#'){
                    template = idToTemplate(template)
                }
                /** istanbul ignore if */
                if(process.env.NODE_ENV !== 'production' && !template){
                    warn(
                        `Template element not found or is empty: ${options.template}`
                    )
                }
            }
        }
        //...........
    }
}

/**
 * 2.Vue的入口
 * src/platforms/web/runtime/index.js中:
 * 1. 这里关键代码是 import Vue from 'core/index'
 * 2. 之后的逻辑都是对 Vue 这个对象做一些扩展
 */
import Vue from 'core/index'
import config from 'core/config'
import {extend,noop} from 'shared/util'
import {mountComponent} from 'core/instance/lifecycle'
import {devtools,inBrowser,isChrome} from 'core/util/index'

import {
    query,
    mustUseProp,
    isReservedTag,
    isReservedAttr,
    getTagNamespace,
    isUnknownElement
} from 'web/util/index'

import {patch} from './patch'
import platformDirectives from './directives/index'
import platformComponents from './components/index'

//install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

//install platform runtime directive & components
extend(Vue.options.directives,platformDirectives)
extend(Vue.options.components,platformComponents)

//install platform patch function
Vue.prototype.__patch__ = inBrowser ? patch : noop
// public mount method
Vue.prototype.$mount = function(el?:string | Element,hydrating?:boolean):Component {
    el = el && inBrowser ? query(el) : undefined
    return mountComponent(this,el,hydrating)
}

/**
 * 3.Vue 真正初始化 Vue 的地方,在 src/core/index.js中:
 * 3.1 初始化全局 Vue API
 */
import Vue from './instance/index'
import {initGlobalAPI} from './global-api/index'
import {isServerRendering} from 'core/util/env'
import {FunctionalRenderContext} from 'core/vdom/create-functional-component'

initGlobalAPI(Vue)
Object.defineProperty(Vue.prototype,'$isServer',{
    get:isServerRendering
})
Object.defineProperty(Vue.prototype,'$ssrContext',{
    get(){
        return this.$vnode && this.$vnode.ssrContext
    }
})
Object.defineProperty(Vue,'FunctionalRenderContext',{
    value:FunctionalRenderContext
})
Vue.version = '__VERSION__'
export default Vue

/**
 * 4.Vue 的定义
 *   import Vue from './instance/index
 */
import { initMixin } from './init'
import {stateMixin } from './state'
import {renderMixin } from './render'
import { eventsMixin} from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue(optons) {
    if(process.env.NODE_ENV !== 'production' && !(this instanceof Vue)){
        warn(
            'Vue is a constructor and should be called with the 'new' keyword'
        )
        this.__init(optons)
    }
}
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
/**
 * Vue 实际上就是一个用Function实现的类,只能通过 new Vue 去实例化它,
 * 为何Vue 不用ES6 的Class 去实现呢?
 * 我们往后看这里有很多 xxxMixin 的函数调用,并把Vue 当参数传入,它们的功能都是给Vue
 * 的prototype上扩展一些方法,Vue按功能把这些扩展分散到多个模块中去实现,而不是在一个模块里实现所有,
 * 这种方式是用Class 难以实现的.
 */

// initGlobalAPI
//Vue.js 在整个初始化过程中,除了给它的原型 prototype 上扩展方法,还会给 Vue 这个对象
// 本身扩展全局的静态方法,它定义在 src/core/global-api/index.js中:
export function initGlobalAPI(Vue:GlobalAPI) {
    // config
    const configDef = {}
    configDef.get = () => config 
    if(process.env.NODE_ENV !== 'production'){
        configDef.set = () => {
            warn(
                'Do not replace the Vue.config object, set individual fields instead'
            )
        }
    }
    Object.defineProperty(Vue,'config',configDef)

    //exposed util methods.
    //NOTE: these are not considered part of the public API -avoid relying on
    //them unless you are aware of the risk.
    Vue.util = {
        warn,
        extend,
        mergeOptions,
        defineReactive
    }
    Vue.set = set
    Vue.delete = del
    Vue.nextTick = nextTick

    Vue.options = Object.create(null)
    ASSET_TYPES.forEach(type => {
        Vue.options[type + 's'] = Object.create(null)
    })

    // this is used to identify the "base" constructor to extend
    // all plain-object components with in Weex's multi-instance scenarios.
    Vue.options._base = Vue

    extend(Vue.options.components,builtInComponents)

    initUse(Vue)
    initMixin(Vue)
    initExtend(Vue)
    initAssetRegisters(Vue)
}
/**
 * 1.1 Object.create(...) 会创建一个新对象(bar)并把它关联到我们指定的对象(foo),
 * 这样我们就可以充分发挥[[prototype]]机制的威力(委托)并且避免不必要的麻烦(比如
 * 用new 的构造函数会生成.prototype 和 .constructor 引用)
 * 
 * Object.create(null)会创建一个拥有空(或null)[[Prototype]]链接的对象,这个对象无法进行委托,
 * 由于这个对象没有原型链,所以 instanceof 操作符无法进行判断,因此总是会返回false,这些特殊的空
 * [[prototype]]对象通常被称作 "字典",它们完全不会受到原型链的干扰,非常适合用来存储数据
 */