import Vue from "vue"
import { config } from "vue/types/umd"

/**
 * createElement实现,它最终会调用 _createElement 方法,
 * 其中有对参数 tag 的判断,
 * 如是一个普通的html标签,如一个普通的 div,就会实例化一个普通VNode节点.
 * 否则通过 createComponent 方法创建一个组件 VNode.
 */
if(typeof tag === 'string'){
    let Ctor
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
    if(config.isReservedTag(tag)){
        // platform built-in elements
        vnode = new VNode(
            config.parsePlatformTagName(tag),data,children,
            undefined,undefined,context
        )
    } else if (isDef(Ctor = resolveAsset(context.$options,'components',tag))){
        // component
        vnode = createComponent(Ctor,data,context,children,tag)
    } else {
        // unknown or unlisted namespaced elements
        // check at runtime because it may get assigned a namespace when its
        // parent normalizes children
        vnode = new VNode(
            tag,data,children,
            undefined,undefined,context
        )
    }
} else {
    // direct component options / constructor
    vnode = createComponent(tag,data,context,children)
}

/**
 * 这一章传入的是一个 App 对象, 它本质是一个 Component 类型, 那么它直接通过 createComponent 方法来创建 vnode.
 * createComponent 方法 --> src/core/vdom/create-component.js 文件:
 */
export function createComponent(
    Ctor:Class<Component> | Function | Object | void,
    data:?VNodeData,
    context:Component,
    children:?Array<VNode>,
    tag?:string
): VNode | Array<VNode> | void {
    if(isUndef(Ctor)){
        return
    }
    const baseCtor = context.$options._base

    //plain options object: turn it into a constructor
    if(isObject(Ctor)){
        Ctor = baseCtor.extend(Ctor)
    }

    //if at this stage it's not a constructor or an async component factory,
    //reject.
    if(typeof Ctor !== 'function'){
        if(ProcessingInstruction.env.NODE_ENV !== 'production'){
            warn(`Invalid Component definition: ${String(Ctor)}`,context)
        }
        return
    }

    //async component
    let asyncFactory
    if(isUndef(Ctor.cid)){
        asyncFactory = Ctor
        Ctor = resolveAsyncComponent(asyncFactory,baseCtor,context)
        if(Ctor === undefined){
            //return a placeholder node for async component, which is rendered as a
            //comment node but preserves all the raw information for the node.
            //the information will be used for async server-rendering and hydration.
            return createAsyncPlaceholder(
                asyncFactory,
                data,
                context,
                children,
                tag
            )
        }
    }
    data = data || {}

    //resolve constructor options in case global mixins are applied after
    // component constructor creation
    resolveConstructorOptions(Ctor)

    //transform component v-model data into props & events
    if(isDef(data.model)){
        transformModel(Ctor.options,data)
    }

    //extract props
    const propsData = extractPropsFromVNodeData(data,Ctor,tag)

    //functional component
    if(isTrue(Ctor.options.functional)){
       return createFunctionalComponent(Ctor,propsData,data,context,children)
    }

    //extract listeners, since these needs to be treated as child component
    //listeners instead of DOM listeners
    const listeners = data.on
    //replace with listeners with .native modifier so it gets processed
    //during parent component patch.
    data.on = data.nativeOn

    if(isTrue(Ctor.options.abstract)){
        // abstract components do not keep anything
        // other than props & listeners & slot

        // work around flow
        const slot = data.slot
        data = {}
        if(slot){
            data.slot = slot
        }
    }
    // install component management hooks noto the placeholder node
    installComponentHooks(data)
    // return a placeholder vnode
    const name = Ctor.options.name || tag
    const vnode = new VNode(
        `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
        data,undefined,undefined,undefined,context,{Ctor,propsData,listeners,tag,children},
        asyncFactory
    )
}

/**
 * 分析源码比较推荐的是 只分析 核心流程.
 * 1 .构造子类构造函数,安装组件钩子函数和实例化 vnode.
 */
const baseCtor = context.$options._base
// plain options object: turn it into a constructor
if(isObject(Ctor)){
    Ctor = baseCtor.extend(Ctor)
}
//在编写一个组件的时候,通常都是创建一个普通对象,如下:
import HelloWorld from './components/HelloWord'
export default {
    name:'app',
    components: {
        HelloWorld
    }
}
// 这里 export 的是一个对象, 所以 createComponent 里的代码逻辑会执行到 baseCtor.extend(Ctor),
// 在这里 baseCtor 实际上就是 Vue, 这个的定义是在最开始初始化 Vue 的阶段,在 src/core/global-api/index.js 中
// 的initGlobalAPI 函数有这么:

// this is used to identify the "base" constructor to extend all plain-object
// components with in Weex's multi-instance scenarios.
Vue.options._base = Vue
// 这里定义的是 Vue.option, 而我们的 createComponent 取的是 context.$options,实际上在 src/core/instance/init.js
// 里 Vue 原型上的 _init 函数中有这:
vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
)
// 以上就把Vue上的一些 option 扩展到了 vm.$option 上,所以也就能通过 vm.$options._base 拿到 Vue 这个构造函数了.
// Vue.extend 函数的定义,在 src/core/global-api/extend.js 中

/**
 * 1. Class inheritance
 */
Vue.extend = function(extendOptions:Object):Function {
    extendOptions = extendOptions || {}
    const Super = this
    const SuperId = Super.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if(cachedCtors[SuperId]){
        return cachedCtors[SuperId]
    }
    const name = extendOptions.name || Super.options.name
    if(process.env.NODE_ENV !== 'production' && name){
        validateComponentName(name)
    }
    const Sub = function VueComponent(options){
        this._init(options)
    }
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    Sub.options = mergeOptions(
        Super.options,
        extendOptions
    )
    Sub['super'] = Super

    //For props and computed properties,we define the proxy getters on the vue
    //instances at extension time, on the extended prototype. This
    //avoids object.defineProperty calls for each instance created.
    if(Sub.options.props){
        initProps(Sub)
    }
    if(Sub.options.computed){
        initComputed(Sub)
    }

    //allow further extension/mixin/plugin usage
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    //create asset registers, so extended classes
    //can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
        Sub[type] = Super[type]
    })
    //enable recursive self-lookup
    if(name){
        Sub.options.components[name] = Sub
    }
    
    //keep a reference to the super options at extension time.
    //later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({},Sub.options)

    //cache constructor
    cachedCtors[SuperId] = Sub
    return Sub
}

/**
 * Vue.extend 的作用就是构造一个 Vue 的子类, 它使用一种非常经典的原型继承的方式把一个 纯对象 转换一个继承于 Vue 的构造器
 * Sub 并返回,然后对 Sub 这个对象本身扩展了一些属性,如扩展 options, 添加全局API等; 并且对配置中的 props 和 computed
 * 做了初始化工作;最后对于这个 Sub 构造函数做了缓存, 避免多次执行 Vue.extend 的时候对同一个子组件重复构造.
 * 
 * 当我们去实例化 Sub 的时候,就会执行 this._init 逻辑再次走到了 Vue 实例的初始化逻辑.
 */
const Sub = function VueComponent(options) {
    this._init(options)
}

//2. 安装组件钩子函数
installComponentHooks(data)
//Vue.js 使用的 Virtual DOM 参考的是开源库snabbdom, 它的一个特点是在VNode 的patch流程 中对外暴露了各种
//时机的钩子函数,方便我们做一些额外的事情.Vue.js也是充分利用这一点.
//在初始化一个Component类型的VNode 的过程中实现了几个钩子函数:
const componentVNodeHooks = {
    init(vnode:VNodeWithData,hydrating:boolean): ?boolean {
        if(
            vnode.componentInstance &&
            !vnode.componentInstance._isDestroyed &&
            vnode.data.keepAlive
        ){
            // kept-alive components,treat as a patch
            const mountedNode: any = vnode // work around flow
            componentVNodeHooks.prepatch(mountedNode,mountedNode)
        }else {
            const child = vnode.componentInstance = createComponentInstanceForVnode(
                vnode,
                activeInstance
            )
            child.$mount(hydrating ? vnode.elm : undefined,hydrating)
        }
    },
    prepatch(oldVnode:MountedComponentVNode,vnode:MountedComponentVNode) {
        const options = vnode.componentOptions
        const child = vnode.componentInstance = oldVnode.componentInstance
        updateChildComponent(
            child,
            options.propsData, // updated props
            options.listeners, // updated listeners
            vnode, // new parent vnode
            options.children // new children
        )
    },
    insert(vnode: MountedComponentVNode) {
        const { context,componentInstance} = vnode
        if(!componentInstance._isMounted) {
            componentInstance._isMounted = true
            callHook(componentInstance,'mounted')
        }
        if(vnode.data.keepAlive) {
            if(context._isMounted){
                // vue-router#1212
                // During updates, a kept-alive component's child components may
                // change,so directly walking the tree here may call activated hooks
                // on incorrect children. Instead we push them into a queue which will
                // be processed after the whole patch process ended.
                queueActivatedComponent(componentInstance)
            } else {
                activateChildComponent(componentInstance,true /** direct */)
            }
        }
    },
    destory(vnode:MountedComponentVNode) {
        const { componentInstance } = vnode
        if(!componentInstance._isMounted) {
            if(!vnode.data.keepAlive) {
                componentInstance.$destroy()
            } else {
                deactivateChildComponent(componentInstance,true /** direct */)
            }
        }
    }
}

const hooksToMerge = Object.keys(componentVNodeHooks)
function installComponentHooks(data: VNodeData) {
    const hooks = data.hook || (data.hook = {})
    for(let i = 0; i < hooksToMerge.length; i++) {
        const key = hooksToMerge[i]
        const existing = hooks[key]
        const toMerge = componentVNodeHooks[key]
        if(existing !== toMerge && !(existing && existing._merged)){
            hooks[key] = existing ? mergeHook(toMerge,existing) : toMerge
        }
    }
}
function mergeHook(f1:any,f2:any):Function {
    const merged = (a,b) => {
        // flow complains about extra args which is why we use any
        f1(a,b)
        f2(a,b)
    }
    merged._merged = true
    return merged
}
// 整个 installComponentHooks 的过程就是把 componentVNodeHooks 的钩子函数合并到 data.hook 中,在VNode
// 执行 patch 的过程中执行相关的钩子函数, 注意这里的合并策略:
// 在合并过程中,如果某个实际的钩子已经存在 data.hook 中,那么通过执行 mergeHook 函数做合并.这个逻辑很简单,
// 就是在最终执行的时候, 依次执行这两个钩子函数即可.
const name = Ctor.options.name || tag
const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}`:''}`,
    data,undefined,undefined,undefined,context,
    {Ctor,propsData,listeners,tag,children},
    asyncFactory
)
return vnode
// 通过 new VNode 实例化一个 vnode 并返回,需要注意的是和普通元素节点的 vnode 不同,组件的 vnode 
// 是没有 children 的.