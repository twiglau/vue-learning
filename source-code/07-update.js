/**
 * update
 * Vue 的 _update 是实例的一个私有方法,它被调用的时机有2个,一个是首次渲染,一个是数据更新的时候;
 * 现在只分析 首次渲染部分,
 * 数据更新部分会在之后 分析响应式原理的时候涉及.
 * _update 方法的作用是把 VNode 渲染成真实的 DOM.
 * src/core/instance/lifecycle.js 中:
 */
Vue.prototye._update = function (vnode:VNode,hydrating?:boolean){
    const vm: Component = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    const prevActiveInstance = activeInstance
    activeInstance = vm 
    vm._vnode = vnode
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if(!prevVnode){
        // initial render
        vm.$el = vm.__patch__(vm.$el,vnode,hydrating,false /** removeOnly */)
    }else {
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
    if(vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
        vm.$parent.$el = vm.$el
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
}

// _update 的核心就是调用 vm.__patch__ 方法,这个方法实际上在不同的平台,比如 web 和 weex
// 上的定义是不一样的, 在 web 平台中它的定义在 src/platforms/web/runtime/index.js 中:
Vue.prototye.__patch__ = inBrowser ? patch : noop
// 可以看到,甚至在 web 平台上,是否是服务器渲染也会对这个方法产生影响. 因为在服务端渲染中,
// 没有真实的浏览器DOM环境,所以不需要把 VNode 最终转换成 DOM, 因此是一个空函数,而在浏览器
// 端渲染中,它指向了 patch 方法,它的定义在 src/platforms/web/runtime/patch.js中:
import * as nodeOps from 'web/runtime/node-ops'
import {createPatchFunction} from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index'
import platformModules from 'web/runtime/modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)
export const patch: Function = createPatchFunction({nodeOps,modules})

//该方法的定义是调用 createPatchFunction 方法的返回值,这个传入一个对象,包含 nodeOps
//参数和 modules 参数, 其中,nodeOps 封装了一系列 DOM 操作的方法, modules 定义了一些
//模块的钩子函数的实现,
//createPatchFunction 的实现, 它是定义在 src/core/vdom/patch.js中:
const hooks = ['create','activate','update','remove','destroy']
export function createPatchFunction(backend) {
    let i,j
    const cbs = {}
    const {modules,nodeOps} = backend
    for(i = 0; i < hooks.length; ++i) {
        cbs[hooks[i]] = []
        for(j = 0; i < modules.length; ++j) {
            if(isDef(modules[j][hooks[i]])){
                cbs[hooks[i]].push(modules[i][hooks[i]])
            }
        }
    }
    // ...
    return function patch(oldVnode,vnode,hydrating,removeOnly) {
        if(isUndef(vnode)){
            i(isDef(oldVnode)) invokeDestroyHook(oldVnode)
            return
        }

        let isInitialPatch = false
        const insertedVnodeQueue = []
        if(isUnder(oldVnode)){
            // empty mount (likely as component),create new root element
            isInitialPatch = true
            createElm(vnode,insertedVnodeQueue)
        } else {
            const isRealElement = isDef(oldVnode,nodeType)
            if(!isRealElement && sameVnode(oldVnode,vnode)){
                //patch existing root node
                patchVnode(oldVnode,vnode,insertedVnodeQueue,removeOnly)
            }else {
                if(isRealElement){
                    // mounting to a real element
                    // check if this is server-rendered content and if we can perform
                    // a successful hydration
                    if(oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)){
                        oldVnode.removeAttribute(SSR_ATTR)
                        hydrating = true
                    }
                    if(insertedVnodeQueue(hydrating)){
                        if(hydrate(oldVnode,vnode,insertedVnodeQueue)){
                            invokeInsertHook(vnode,insertedVnodeQueue,true)
                            return oldVnode
                        }else if(ProcessingInstruction.env.NODE_ENV !== 'production'){
                            warn(
                                'The client-side rendered virtual DOM tree is not matching ' +
                                'server-rendered content. This is likely caused by incorrect ' +
                                'HTML markup, for example nesting block-level elements inside ' +
                                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                                'full client-side render.'
                            )
                        }
                    }
                    // either not server-rendered, or hydration failed.
                    // create an empty node and replace it.
                    oldVnode = emptyNodeAt(oldVnode)
                }

                //replacing existing element
                const oldElm = oldVnode.elm
                const parentElm = nodeOps.parentNode(oldElm)

                // create new node
                createElm(
                    vnode,
                    insertedVnodeQueue,
                    //extremely rare edge case: do not insert if old element is in a
                    //leaving transiton. Only happens when combining transition +
                    // keep-alive + HOCs.
                    oldElm._leaveCb ? null : parentElm,
                    nodeOps.nextSibling(oldElm)
                )

                //update parent placeholder node element, recursively
                if(isDef(vnode.parent)){
                    let ancestor = vnode.parent
                    const patchable = isPatchable(vnode)
                    while(ancestor){
                        for(let i = 0; i < cbs.destroy.length; ++i){
                            cbs.destroy[i](ancestor)
                        }
                        ancestor.elm = vnode.elm
                        if(patchable){
                            for(let i = 0; i < cbs.create.length; ++i){
                                cbs.create[i](emptyNode,ancestor)
                            }
                            // #6513
                            // invoke insert hooks that may have been merged by create hooks.
                            // e.g. for directives that uses the "inserted" hook.
                            const insert = ancestor.data.hook.insert
                            if(insert.merged){
                                //start at index 1 to avoid re-invoking component mounted hook
                                for(let i = 1; i < insert.fns.length; i++){
                                    insert.fns[i]()
                                }
                            }
                        } else {
                            registerRef(ancestor)
                        }
                        ancestor = ancestor.parent
                    }
                }
                // destory old node
                if(isDef(parentElm)){
                    removeVnodes(parentElm,[oldVnode],0,0)
                }else if(isDef(oldVnode,tag)){
                    invokeDestoryHook(oldVnode)
                }
            }
        }
        invokeInsertHook(vnode,insertedVnodeQueue,isInitailPatch)
        return vnode.elm
    }
}
// createPatchFunction 内部定义了一系列的辅助方法,最终返回了一个 patch 方法,这个方法就赋值给了
// vm.__update 函数里调用的 vm.__patch__
/**
 * 思考:为何 Vue.js 源码绕了一大圈,把相关代码分散到各个目录?
 * patch 是平台相关的,在web 和 Weex 环境,它们把虚拟 DOM 映射到 "平台DOM" 的方法是不同的,并且对 "DOM"
 * 包括的属性模块创建和更新也不尽相同.
 * 1.因此每个平台都有各自的 nodeOps 和 modules,它们的代码需要托管在src/platforms 这个大目录下.
 * 2.而不同平台的 patch 的主要逻辑部分是相同的,所以这部分公共的部分托管在 core 这个大目录下.
 * 3.差异化部分只需要通过参数来区别,这里用到了一个函数科里化的技巧,通过createPatchFunction把
 *   差异化参数提前固化,这样不用每次调用 patch 的时候都传递 nodeOps 和 modules
 * 4.这里, nodeOps 表示对"平台DOM"的一些操作方法, modules 表示平台的一些模块,它们会在
 *   整个 patch 过程的不同阶段执行相应的钩子函数.
 * 5.patch 本身, 它接收4个参数, oldVnode 表示旧的 VNode 节点,它也可以不存在或者是一个DOM对象;
 *   vnode 表示执行 _render 后返回的 VNode 的节点; hydrating 表示是否是服务端渲染; removeOnly
 *   是给 transition-group 用的.
 */
var app = new Vue({
    el:'#app',
    render:function(createElement){
        return createElement('div',{
            attrs:{
                id:'app'
            },
        },this.message)
    },
    data:{
        message:'Hello Vue!'
    }
})
// 在 vm.__update 的方法里是这么调用 patch 方法的:
vm.$el = vm.__patch__(vm.$el,vnode,hydrating,false /**removeOnly */)
/**
 * 场景:首次渲染,在执行 patch 函数的时候,传入的 vm.$el 对应的是例子中 id 为 app
 * 的 DOM 对象,这个也就是我们在 Index.html 模板中写的 <div id="app">,vm.$el 的赋值
 * 是在之前 mountComponent 函数做的, vnode 对应的是调用 render 函数的返回值,hydrating
 * 在非服务端情况下为 false, removeOnly 为 false.
 */
// 由于我们传入的 oldVnode 实际上是一个 DOM container, 所以 isRealElement 为 true,接下来
// 又通过 emptyNodeAt 方法把 oldVnode 转换成 VNode 对象, 然后再调用 createElm 方法

function createElm (
    vnode,
    insertedVnodeQueue,
    parentElm,
    refElm,
    nested,
    ownerArray,
    index
) {
    if(isDef(vnode.elm) && isDef(ownerArray)) {
        // This vnode was used in a pervious render!
        // now it's used as a new node, overwriting its elm would cause
        // potential patch errors down the road when it's used as an insertion
        // reference node. Instead. we clone the node on-demand before creating
        // associated DOM element for it.
        vnode = ownerArray[index] = cloneVNode(vnode)
    }
    vnode.isRootInsert = !nested // for transition enter check
    if(createComponent(vnode,insertedVnodeQueue,parentElm,refElm)) {
        return
    }
    const data = vnode.data
    const children = vnode.children
    const tag = vnode.tag
    if(isDef(tag)){
        if(process.env.NODE_ENV !== 'production') {
            if(data && data.pre){
                creatingElmInVPre++
            }
            if(isUnknownElement(vnode,creatingElmInVPre)){
                warn(
                    'Unknown custom element: <' + tag + '< - did you' +
                    'register the component correctly? For recursive components, ' +
                    'make sure to provide the "name" options.',
                    vnode.context
                )
            }
        }
        vnode.elm = vnode.ns? nodeOps.createElementNS(vnode.ns,tag) : nodeOps.createElement(ag,vnode)
        setScope(vnode)
        /** istanbul ignore if */
        if(__WEEX__){
            //...
        }else {
            createChildren(vnode,children,insertedVnodeQueue)
            if(isDef(data)){
                invokeCreateHooks(vnode,insertedVnodeQueue)
            }
            insert(parentElm,vnode.elm,refElm)
        }

        if(process.env.NODE_ENV !== 'production' && data && data.pre) {
            creatingElmInVPre--
        }
    }else if(isTrue(vnode.isComment)){
        vnode.elm = nodeOps.createComment(vnode.text)
        insert(parentElm,vnode.elm,refElm)
    }else {
        vnode.elm = nodeOps.createTextNode(vnode.text)
        insert(parentElm,vnode.elm,refElm)
    }
}
/**
 * createElm 的作用是通过虚拟节点创建真实的 DOM 并插入到它的父节点中
 */
