/**
 * patch
 * 1. createComponent 创建了组件 VNode,接下来会走到 vm._update.
 * 2. 执行 vm.__patch__ 去把 VNode 转换成真正的DOM节点.
 * 3. patch 的过程会调用 createElm 创建元素节点, createElm 实现, 定义在 src/core/vdom/patch.js:
 */
function createElm (
    vnode,
    insertedVnodeQueue,
    parentElm,
    refElm,
    nested,
    ownerArray,
    index
) {
    // ...
    if(createComponent(vnode,insertedVnodeQueue,parentElm,refElm)) {
        return
    }
    // ...
}
/**
 * createComponent
 * 删掉多余的代码,只保留关键的逻辑,判断 createComponent(vnode,insertedVnodeQueue,parentElm,refElm) 的返回值
 */
function createComponent(vnode,insertedVnodeQueue,parentElm,refElm){
    let i = vnode.data
    if(isDef(i)){
        const isReactivated = isDef(vnode.componentInstance) && i.keepAlive
        if(isDef(i = i.hook) && isDef(i = i.init)){
            i(vnode,false /** hydrating */)
        }
        //after calling the init hook, if the vnode is a child component
        //it should've created a child instance and mounted it. the child
        //component also has set the placeholder vnode's elm.
        //in that case we can just return the element and be done.
        if(isDef(vnode.componentInstance)){
            initComponent(vnode,insertedVnodeQueue)
            insert(parentElm,vnode.elm,refElm)
            if(isTrue(isReactivated)){
                reactivateComponent(vnode,insertedVnodeQueue,parentElm,refElm)
            }
            return true
        }
    }
}
//createComponent 函数中,首先对 vnode.data 做了一些判断:
let i = vnode.data
if(isDef(i)){
    // ...
    if(isDef( i = i.hook) && isDef( i = i.init)){
        i(vnode,false /** hydrating */)
        // ...
    }
    // ...
}
// 如果 vnode 是一个组件 VNode,那么条件会满足,并且得到 i 就是 init 钩子函数,
// 上节在创建组件 VNode 的时候合并钩子函数中就包含 init 钩子函数,定义在
// src/core/vdom/create-component.js 中:
init(vnode:VNodeWithData,hydrating:boolean):?boolean {
    if(
        vnode.componentInstance &&
        !vnode.componentInstance._isDestroyed &&
        vnode.data.keepAlive
    ) {
        // kept-alive components, treat as a patch
        const mountedNode: any = vnode // work around flow
        componentVNodeHooks.prepatch(mountedNode,mountedNode)
    }else {
        const child = vnode.componentInstance = createComponentInstanceForVnode(vnode,activeInstance)
        child.$mount(hydrating ? vnode.elm : undefined,hydrating)
    }
}
// init 钩子函数 它是通过 createComponentInstanceForVnode 创建一个 Vue 的实例,然后调用
// $mount 方法挂载子组件
export function createComponentInstanceForVnode(
    vnode:any, // we know it's MountedComponentVNode but flow doesn't
    parent:any, // activeInstance in lifecycle state
): Component {
    const options:InternalComponentOptions = {
        _isComponent:true,
        _parentVnode:vnode,
        parent
    }
    // check inline-template render functions
    const inlineTemplate = vnode.data.inlineTemplate
    if(isDef(inlineTemplate)){
        options.render = inlineTemplate.render
        options.staticRenderFns = inlineTemplate.staticRenderFns
    }
    return new vnode.componentOptions.Ctor(options)
}
//createComponentInstanceForVnode 函数构造的一个内部组件的参数,然后执行 new vnode.componentOptions.Ctor(options).
//这里的 vnode.componentOptions.Ctor 对应的就是子组件的构造函数
//我们上一节分析了 它实际上是继承于Vue 的一个构造器 Sub,相当于 new Sub(options)
//其中 _isComponent 为 true, 表示它是一个组件,
//    parent 表示当前激活的组件实例

//所以子组件的实例化 实际上就是在这个实际执行的,并且它会执行实例的 _init 方法,这个过程有些不同
//  src/core/instance/init.js 中:
Vue.prototype._init = function(options?:Object) {
    const vm: Component = this
    // merge options
    if(options && options._isComponent){
        // optimize internal component instantiation
        // since dynamic options merging is pretty slow, and none of the
        // internal component options needs special treatment.
        initInternalComponent(vm,options)
    } else {
        vm.$options = mergeOptions(
            resolveConstructorOptions(vm.constructor),
            options || {},
            vm
        )
    }
    // ...
    if(vm.$options.el) {
        vm.$mount(vm.$options.el)
    }
}
//这里首先是合并 options 的过程有变化, _isComponent 为 true, 使用 initInternalComponent:
export function initInternalComponent(vm:Component,options:InternalComponentOptions) {
    const opts = vm.$options = Object.create(vm.constructor.options)
    //doing this because it's faster than dynamic enumeration.
    const parentVnode = options._parentVnode
    opts.parent = options.parent
    opts._parentVnode = parentVnode

    const vnodeComponentOptions = parentVnode.componentOptions
    opts.propsData = vnodeComponentOptions.propsData
    opts._parentListeners = vnodeComponentOptions.listeners
    opts._renderChildren = vnodeComponentOptions.children
    opts._componentTag = vnodeComponentOptions.tag

    if(options.render){
        opts.render = options.render
        opts.staticRenderFns = options.staticRenderFns
    }
}
//几个点: opts.parent = options.parent, opts._parentVnode = parentVnode,
//       它们是把之前我们通过 createComponentInstanceForVnode 函数传入的几个
//       参数合并到内部的选项 $options 里了.

//再来看下 _init 函数最后执行的代码:
if(vm.$options.el){
    vm.$mount(vm.$options.el)
}
// 组件初始化的时候是不传el的, 因此组件是自己接管了 $mount 的过程.
// componentVNodeHooks 的 init 钩子函数,在完成实例化的 _init后,接着会执行 child.$mount(hydrating? vnode.elm : undefined, hydrating).
// 这里 hydrating 为 true 一般是服务端渲染的情况,我们只考虑客户端渲染,所以这里 $mount 相当于执行 child.$mount(undefined,false),
// 它最终会调用 mountComponent 方法, 进而执行 vm._render() 方法:
Vue.prototype._render = function (): VNode {
    const vm: Component = this
    const { render,_parentVnode } = vm.$options

    //set parent vnode. this allows render functions to have access
    //to the data on the placeholder node.
    vm.$vnode = _parentVnode
    // render self
    let vnode
    try {
        vnode = render.call(vm._renderProxy,vm.$createElement)
    }catch(e){
        // ...
    }
    // set parent
    vnode.parent = _parentVnode
    return vnode
}
// 这里的 _parentVnode 就是当前组件的父 VNode,而 render 函数生成的 vnode 当前组件的渲染 vnode, vnode 的
// parent 指向了 _parentVnode,也就是 vm.$vnode,它们之间是父子的关系.

// 执行完 vm._render 生成 VNode 后,接下来就要执行 vm._update 去渲染 VNode 了,
// vm._update 定义在 src/core/instance/lifecycle.js 中:
export let activeInstance:any = null
Vue.prototype._update = function (vnode:VNode,hydrating?:boolean){
    const vm: Component = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    const prevActiveInstance = activeInstance
    activeInstance = vm 
    vm._vnode = vnode
    //Vue.prototype.__patch__ is injected in entry points
    //based on the rendering backend used.
    //这里 activeInstance 作用就是保持当前上下文的Vue实例,它是在 lifecycle 模块的全局变量,定义是
    //export let activeInstance: any = null, 并且在之前我们调用 createComponentInstanceForVnode
    //方法的时候从 lifecycle 模块获取,并且作为参数传入的,
    //因为实际上 JavaScript 是一个单线程, Vue 整个初始化是一个深度遍历的过程,在实例化子组件的过程中,
    //它需要知道当前上下文的 Vue 实例是什么,并把它作为子组件的父 Vue 实例. 之前我们提到过对子组件
    //的实例化过程先会调用 initInternalComponent(vm,options) 合并 options, 把 parent 存储在
    //vm.$options 中,在 $mount 之前会调用 initLifecycle(vm)方法
    if(!prevVnode){
        vm.$el = vm.__patch__(vm.$el,vnode,hydrating,false /** removeOnly */)
    }else {
        //updates
        vm.$el = vm.__patch__(prevVnode,vnode)
    }
    activeInstance = prevActiveInstance
    // update __vue__ reference
    if(prevEl){
        prevEl.__vue__ = null
    }
    if(vm.$el){
        vm.$el.__vue__ = vm
    }
    // if parent is an HOC, update its $el as well
    if(vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode){
        vm.$parent.$el = vm.$el
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
}
/**
 * _update 过程中有几个关键的代码,首先 vm._vnode = vnode 的逻辑,这个vnode 是通过
 * vm._render() 返回的组件渲染VNode,vm._vnode 和 vm.$vnode 的关系就是一种父子关系,
 * 用代码表达式就是 vm._vnode.parent === vm.$vnode.
 */

export function initLifecycle(vm:Component){
    const options = vm.$options

    //locate first non-abstract parent
    let parent = options.parent
    if(parent && !options.abstract) {
        while (parent.$options.abstract && parent.$parent) {
            parent = parent.$parent
        }
        parent.$children.push(vm)
    }

    vm.$parent = parent
    // ...
}
//可以看到 vm.$parent 就是用来保留当前 vm 的父实例, 并且通过 parent.$children.push(vm)来把当前的vm
//存储到父实例的 $children 中.

/**
 * 在 vm._update 的过程中, 把当前的 vm 赋值给 activeInstance, 同时通过 const 
 * prevActiveInstance = activeInstance 用 prevActiveInstance 保留上一次的 activeInstance.
 * 实际上, prevActiveInstance 和 当前的 vm 是一个父子关系,当一个 vm 实例完成它的所有子树的 patch 或者 update
 * 过程后, activeInstance 会回到它的父实例,这样就完美地保证了 createComponentInstanceForVnode 整个深度遍历
 * 过程中,
 * 
 * 我们在实例化子组件的时候能传入当前子组件的父Vue实例,并在 _init 的过程中, 通过 vm.$parent 把这个父子关系保留.
 */

//回到 _update,最后就是调用 __patch__ 渲染 VNode 了
vm.$el = vm.__patch__(vm.$el,vnode,hydrating,false /** removeOnly */)
function patch(oldVnode,vnode,hydrating,removeOnly) {
    // ...
    let isInitialPatch = false
    const insertedVnodeQueue = []

    if(isUndef(oldVnode)){
        //empty mount (likely as component), create new root element
        isInitialPatch = true
        createElm(vnode,insertedVnodeQueue)
    }else {
        // ...
    }
    // ...
}

//这里又回到了本节开始的过程, 负责渲染成 DOM 的函数是 createElm, 注意这里我们只传入2个参数: parentElm 是 undefined.
function createElm (
    vnode,
    insertedVnodeQueue,
    parentElm,
    refElm,
    nested,
    ownerArray,
    index
) {
    // ...
    if(createComponent(vnode,insertedVnodeQueue,parentElm,refElm)){
        return
    }
    const data = vnode.data
    const children = vnode.children
    const tag = vnode.tag
    if(isDef(tag)){
        // ...

        vnode.elm = vnode.ns ? nodeOps.createElementNS(vnode.ns,tag) : nodeOps.createElement(tag,vnode)
        setScope(vnode)

        /**istanbul ignore if */
        if(__WEEX__){
            //...
        }else {
            createChildren(vnode,children,insertedVnodeQueue)
            if(isDef(data)){
                invokeCreateHooks(vnode,insertedVnodeQueue)
            }
            insert(parentElm,vnode.elm,refElm)
        }
        //...
    }else if(isTrue(vnode.isComment)){
        vnode.elm = nodeOps.createComment(vnode.text)
        insert(parentElm,vnode.elm,refElm)
    }else {
        vnode.elm = nodeOps.createTextNode(vnode.text)
        insert(parentElm,vnode.elm,refElm)
    }
}
//注意: 这里我们传入的 vnode 是组件渲染的 vnode,就是之前说的 vm._vnode,如果组件的根节点是个普通元素,那么
// vm._vnode 也是普通的 vnode, 这里 createComponent(vnode,insertedVnodeQueue,parentElm,refElm) 的返回值是 false.
// 接下来过程和上一章一样, 先创建一个父节点占位符,然后再遍历所有子 VNode 递归调用 createElm,在遍历过程中,
// 如果遇到子 VNode 是一个组件的VNode,则重复本节开始的过程,这样通过一个递归的方式就可以完整地构建了整个组件树.

// 由于我们这个时候传入的 parentElm 是空, 所以对组件的插入, 在 createComponent 有这么一段逻辑:
function createComponent(vnode,insertedVnodeQueue,parentElm,refElm) {
    let i = vnode.data
    if(isDef(i)){
        // ...
        if(isDef( i = i.hook ) && isDef( i = i.init )){
            i(vnode,false /**hydrating */)
        }
        // ...
        if(isDef(vnode.componentInstance)){
            initComponent(vnode,insertedVnodeQueue)
            insert(parentElm,vnode.elm,refElm)
            if(isTrue(isReactivated)){
                reactivateComponent(vnode,insertedVnodeQueue,parentElm,refElm)
            }
            return true
        }
    }
}
//在完成组件的整个 patch 过程后, 最后执行 insert(parentElm,vnode.elm,refElm) 完成组件的 DOM 插入,
//如果组件 patch 过程中又创建了子组件, 那么 DOM 的插入顺序是先子后父.

/**
 * 一个组件的VNode是如何创建,初始化,渲染的过程.在对组件化的实现有一个大概了解后,会了解其中的一些细节
 * 编写一个组件实际上是编写一个 JavaScript对象,对象的描述就是各种配置,之前我们提到在 _init 的最初阶段执行的就是
 * merge options 的逻辑.
 */
