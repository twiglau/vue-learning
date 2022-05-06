/**
 * 组件更新
 * 了解到当数据发生变化的时候,会触发渲染 watcher 的回调函数,进而执行组件的更新过程
 */
updateComponent = () =>{
    vm._update(vm._render(),hydrating)
}
new Watcher(vm,updateComponent,noop,{
    before(){
        if(vm._isMounted){
            callHook(vm,'beforeUpdate')
        }
    }
},true /** isRenderWatcher */)
//组件的更新还是调用了 vm._update 方法,该方法定义在 src/core/instance/lifecycle.js 中:
Vue.prototype._update = function(vnode:VNode,hydrating?:boolean){
    const vm: Component = this

    //...
    const prevVnode = vm._vnode
    if(!prevVnode){
        // initial render
        vm.$el = vm.__patch__(vm.$el,vnode,hydrating,false /** removeOnly */)
    } else {
        // updates
        vm.$el = vm.__patch__(prevVnode,vnode)
    }
    // ...
}
//组件更新的过程, 会执行 vm.$el = vm.__patch__(prevVnode,vnode),它仍然会调用 patch 函数,
//在 src/core/vdom/patch.js 中定义:
return function patch(oldVnode,vnode,hydrating,removeOnly){
    if(isUndef(vnode)){
        if(isDef(oldVnode)) invokeDestroyHook(oldVnode)
        return
    }
    let isInitialPatch = false
    const insertedVnodeQueue = []
    //当前情况下, 
    //这里执行 patch 的逻辑和首次渲染是不一样的, 因为 oldVnode 不为空,并且它 和 vnode 都是
    //VNode 类型,接下来会通过 sameVNode(oldVnode,vnode) 判断它们是否是相同的 VNode 来决定
    //走不同的更新逻辑:
    if(isUndef(oldVnode)){
        //empty mount (likely as component), create new root element
        isInitialPatch = true
        createElm(vnode,insertedVnodeQueue)
    }else{
        const isRealElement = isDef(oldVnode.nodeType)
        if(!isRealElement && sameVnode(oldVnode,vnode)){
            // patch existing root node
            patchVnode(oldVnode,vnode,insertedVnodeQueue,removeOnly)
        }else{
            if(isRealElement){
                // ...
            }

            //replacing existing element
            const oldElm = oldVnode.elm
            const parentElm = nodeOps.parentNode(oldElm)

            //create new node
            createElm(
                vnode,
                insertedVnodeQueue,
                // extremely rare edge case: do not insert if old element is in a
                // leaving transition. Only happens when combining transition + keep-alive + HOCs. (#4590)
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
                    }else{
                        registerRef(ancestor)
                    }
                    ancestor = ancestor.parent
                }
            }
            //destroy old node
            if(isDef(parentElm)){
                removeVnodes(parentElm,[oldVnode],0,0)
            }else if(isDef(oldVnode.tag)){
                invokeDestoryHook(oldVnode)
            }
        }
    }
    invokeInsertHook(vnode,insertedVnodeQueue,isInitialPatch)
    return vnode.elm
}

//sameVnode 定义如下:
function sameVnode(a,b) {
    return (
        a.key === b.key && (
            a.tag === b.tag &&
            a.isComment === b.isComment &&
            isDef(a.data) === isDef(b.data) &&
            sameInputType(a,b)
        ) || (
            isTrue(a.isAsyncPlaceholder) &&
            a.asyncFactory === b.asyncFactory &&
            isUndef(b.asyncFactory.error)
        )
    )
}

//新旧节点不同
//如果新旧 vnode 不同,那么更新的逻辑非常简单,它本质上是要替换已存在的节点,大致分为 3步:
//1. 创建新节点
const oldElm = oldVnode.elm
const parentElm = nodeOps.parentNode(oldElm)
//create new node
createElm(
    vnode,
    insertedVnodeQueue,
    //extremely rate edge case: do not insert if old element is in a
    //leaving transition. Only happens when combining transition +
    //keep-alive + HOCs. (#4590)
    oldElm._leaveCb ? null : parentElm,
    nodeOps.nextSibling(oldElm)
)
//以当前旧节点为参考节点,创建新的节点,并插入到DOM中, createElm 中:
// *更新父的占位符节点 update parent placeholder node element, recursively
if(isDef(vnode.parent)){
    let ancestor = vnode.parent
    const patchable = isPatchable(vnode)
    while(ancestor){
        for(let i = 0; i < cbs.destory.length; ++i){
            cbs.destory[i](ancestor)
        }
        ancestor.elm = vnode.elm
        if(patchable){
            for(let i = 0; i < cbs.create.length; ++i){
                cbs.create[i](emptyNode,ancestor)
            }
            // #6513
            // invoke insert hooks that may have been merged by create hooks.
            // e.g. for directives that uses th "inserted" hook.
            const insert = ancestor.data.hook.insert
            if(insert.merged){
                //start at index 1 to avoid re-invoking component mounted hook
                for( let i = 1; i < insert.fns.length; i++) {
                    insert.fns[i]()
                }
            }
        }else{
            registerRef(ancestor)
        }
        ancestor = ancestor.parent
    }
}
//找到当前 vnode 的父的占位符节点,先执行各个 module 的 destory 的钩子函数,
// 如果当前占位符是一个可挂载的节点,则执行 module 的 create 钩子函数.

//删除旧节点 destory old node
if(isDef(parentElm)){
    removeVnodes(parentElm,[oldVnode],0,0)
}else if(isDef(oldVnode.tag)){
    invokeDestoryHook(oldVnode)
}
//把 oldVnode 从当前DOM树中删除, 如果父节点存在, 则执行 removeVnodes 方法:
function removeVnodes(parentElm,vnodes,startIdx,endIdx){
    for(; startIdx <= endIdx; ++startIdx){
        const ch = vnodes[startIdx]
        if(isDef(ch)){
            if(isDef(ch.tag)){
                removeAndInvokeRemoveHook(ch)
                invokeDestroyHook(ch)
            }else{ // Text node
                removeNode(ch.elm)
            }
        }
    }
}
function removeAndInvokeRemoveHook(vnode,rm){
    if(isDef(rm) || isDef(vnode.data)){
        let i
        const listeners = cbs.remove.length + 1
        if(isDef(rm)){
            //we have a recursively passed down rm callback
            //increase the listeners count
            rm.listeners += listeners
        }else{
            //directly removing
            rm = createRmCb(vnode.elm,listeners)
        }
        // recursively invoke hooks on child component root node
        if(isDef( i = vnode.componentInstance) && isDef( i = i._vnode) && isDef(i.data)){
            removeAndInvokeRemoveHook(i,rm)
        }
        for(i = 0; i < cbs.remove.length; ++i){
            cbs.remove[i](vnode,rm)
        }
        if(isDef(i = vnode.data.hook) && isDef( i = i.remove)){
            i(vnode,rm)
        }else{
            rm()
        }
    }else{
        removeNode(vnode.elm)
    }
}
function invokeDestroyHook(vnode){
    let i, j
    const data = vnode.data
    if(isDef(data)){
        if(isDef(i = data.hook) && isDef(i = i.destory)) i(vnode)
        for(i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode)
    }
    if(isDef(i = vnode.children)){
        for(j = 0; i < vnode.children.length; ++j){
            invokeDestoryHook(vnode.children[j])
        }
    }
}
//新旧节点相同
//对于新旧节点不同的情况,这种创建新节点->更新占位符节点->删除旧节点的逻辑是很容易理解
//还有一种组件vnode 的更新情况是新旧节点相同,它会调用 patchVNode 方法,定义在 src/core/vdom/patch.js:
function patchVnode(oldVnode,vnode,insertedVnodeQueue,removeOnly){
    if(oldVnode === vnode){
        return
    }
    const elm = vnode.elm = oldVnode.elm
    if(isTrue(oldVnode.isAsyncPlaceholder)){
        if(isDef(vnode.asyncFactory.resolved)){
            hydrate(oldVnode.elm,vnode,insertedVnodeQueue)
        }else{
            vnode.isAsyncPlaceholder = true
        }
        return
    }

    //reuse element for static trees.
    //note we only do this if the vnode is cloned -
    //if the new node is not cloned it means the render functions have been
    //reset by the hot-reload-api and we need to do a proper re-render.
    if(
        isTrue(vnode.isStatic) &&
        isTrue(oldVnode.isStatic) &&
        vnode.key === oldVnode.key &&
        (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
    ){
        vnode.componentInstance = oldVnode.componentInstance
        return
    }
    //1. 执行 prepatch 钩子函数
    //当更新的 vnode 是一个组件 vnode 的时候, 会执行 prepatch 的方法, 定义在: src/core/vdom/create-component.js 中:
    /**
     * const componentVNodeHooks = {
     *   prepatch (oldVnode: MountedComponentVNode, vnode: MountedComponentVNode) {
     *       const options = vnode.componentOptions
     *       cosnt child = vnode.componentInstance = oldVnode.componentInstance
     *       updateChildComponent(
     *          child,
     *          options.propsData, // updated props
     *          options.listeners, // updated listerners
     *          vnode, // new parent vnode
     *          options.children // new children
     *       )
     *   }
     * }
     */
    let i
    const data = vnode.data
    // 执行prepatch 钩子函数
    if(isDef(data) && isDef( i = data.hook) && isDef( i = i.prepatch)){
        i(oldVnode,vnode)
    }

    const oldCh = oldVnode.children
    const ch = vnode.children
    // 1. 执行 update 钩子函数
    // 回到 patchVNode 函数, 在执行完新的 vnode 的 prepatch 钩子函数,会执行所有 module 的
    // update 钩子函数以及用户自定义 update 钩子函数, 对于 module 的钩子函数
    if(isDef(data) && isPatchable(vnode)){
        for(i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode,vnode)
        if(isDef( i = data.hook) && isDef( i = i.update)) i(oldVnode,vnode)
    }

    // 2.完成 patch 过程
    if(isUndef(vnode.text)){
        //如果不是文本节点,则判断它们的子节点
        if(isDef(oldCh) && isDef(ch)){
            //2.1. oldCh 与 ch 都存在且不相同时,使用updateChildren 函数来更新子节点
            if(oldCh !== ch) updateChildren(elm,oldCh,ch,insertedVnodeQueue,removeOnly)
        }else if(isDef(ch)){
            //2.2.如果只有ch存在,表示旧节点不需要了,如果旧的节点是文本节点则先将节点的文本清除,
            //然后通过 addVnodes 将 ch 批量插入到新节点 elm 下.
            if(isDef(oldVnode.text)) nodeOps.setTextContent(elm,'')
            addVnodes(elm,null,ch,0,ch.length - 1, insertedVnodeQueue)
        }else if(isDef(oldCh)){
            //2.3.如果只有 oldCh 存在, 表示更新的是空节点,则需要将旧的节点通过 removeVnodes 全部清除.
            removeVnodes(elm,oldCh,0,oldCh.length - 1)
        }else if(isDef(oldVnode.text)){
            //2.4.当只有旧节点是文本节点的时候,则清除其节点文本内容.
            nodeOps.setTextContent(elm,vnode.text)
        }
    }else if (oldVnode.text !== vnode.text){
        //如果vnode 是个文本节点且新新旧文本不相同,则直接替换文本内容.
        nodeOps.setTextContent(elm,vnode.text)
    }
    //3.执行postpatch 钩子函数,在执行完 patch 过程后,会执行 postpatch 钩子函数,它是组件自定义的钩子函数
    if(isDef(data)){
        if(isDef( i = data.hook) && isDef( i = i.postpatch)) i(oldVnode,vnode)
    }
}

//prepatch 方法就是拿到新的 vnode 的组件配置以及组件实例,去
//执行 updateChildComponent 方法, 定义在 src/core/instance/lifecycle.js 中:
export function updateChildComponent(
    vm: Component,
    propsData:?Object,
    listeners:?Object,
    parentVnode:MountedComponentVNode,
    renderChildren: ?Array<VNode>
){
    if(process.env.NODE_ENV !== 'production'){
        isUpdatingChildComponent = true
    }

    //determine whether component has slot children
    //we need to do this before overwriting $options._renderChildren.
    const hadChildren = !!{
        renderChildren ||                   // has new static slots
        vm.$options._renderChildren  ||     // has old static slots
        parentVnode.data.scopedSlots ||     // has new scoped slots
        vm.$scopedSlots !== emptyObject     // has old scoped slots
    }
    vm.$options._parentVnode = parentVnode
    vm.$vnode = parentVnode // update vm's placeholder node without re-render

    if(vm._vnode){
        // update child tree's parent
        vm._vnode.parent = parentVnode
    }
    vm.$options._renderChildren = renderChildren

    //update $attrs and $listeners hash
    //these are also reactive so they may trigger child update if the child
    //used them during render
    vm.$attrs = parentVnode.data.attrs || emptyObject
    vm.$listeners = listeners || emptyObject

    //update props
    if(propsData && vm.$options.props){
        toggleObserving(false)
        const props = vm._props
        const propKeys = vm.$options._propKeys || []
        for(let i = 0; i < propKeys.length; i++){
            const key = propKeys[i]
            const propOptions: any = vm.$options.props // wtf flow?
            props[key] = validateProp(key,propOptions,propsData,vm)
        }
        toggleObserving(true)
        //keep a copy of raw propsData
        vm.$options.propsData = propsData
    }

    //update listeners
    listeners = listeners || emptyObject
    const oldListeners = vm.$options._parentListeners
    vm.$options._parentListeners = listeners
    updateComponentListeners(vm,listeners,oldListeners)

    //resolve slots + force update if has children
    if(hasChildren){
        vm.$slots = resolveSlots(renderChildren,parentVnode.context)
        vm.$forceUpdate()
    }
    if(process.env.NODE_ENV !== 'production'){
        isUpdatingChildComponent = false
    }
}
/**
 * updateChildComponent 的逻辑也非常简单,由于更新了 vnode, 那么 vnode 对应的实例 vm 的一系列属性也会发生变化,
 * 包括占位符 vm.$vnode 的更新, slot 的更新, listeners 的更新, props 的更新等等.
 */

//updateChildren 函数
function updateChildren(parentElm,oldCh,newCh,insertedVnodeQueue,removeOnly){
    let oldStartIdx = 0
    let newStartIdx = 0
    let oldEndIdx = oldCh.length - 1
    let oldStartVnode = oldCh[0]
    let oldEndVnode = oldCh[oldEndIdx]
    let newEndIdx = newCh.length - 1
    let newStartVnode = newCh[0]
    let newEndVnode = newCh[newEndIdx]
    let oldKeyToIdx,idxInOld,vnodeToMove,refElm

    //removeOnly is a special flag used only by <transition-group>
    //to ensure removed elements stay in correct relative positions
    //during leaving transitions
    const canMove = !removeOnly
    if(process.env.NODE_ENV !== 'production'){
        checkDuplicateKeys(newCh)
    }

    while(oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx){
        if(isUndef(oldStartVnode)){
            oldStartVnode = oldCh[++oldStartIdx] // Vnode has been moved left
        }else if(isUndef(oldEndVnode)){
            oldEndVnode = oldCh[--oldEndIdx]
        }else if(sameVnode(oldStartVnode,newStartVnode)){
            patchVnode(oldStartVnode,newStartVnode,insertedVnodeQueue)
            oldStartVnode = oldCh[++oldStartIdx]
            newStartVnode = newCh[++newStartIdx]
        }else if (sameVnode(oldEndVnode,newEndVnode)){
            patchVnode(oldEndVnode,newEndVnode,insertedVnodeQueue)
            oldEndVnode = oldCh[--oldEndIdx]
            newEndVnode = newCh[--newEndIdx]
        }else if(sameVnode(oldStartVnode,newEndVnode)){ // Vnode moved right
            patchVnode(oldStartVnode,newEndVnode,insertedVnodeQueue)
            canMove && nodeOps.insertBefore(parentElm,oldStartVnode.elm,nodeOps.nextSibling(oldEndVnode.elm))
            oldStartVnode = oldCh[++oldStartIdx]
            newEndVnode = newCh[--newEndIdx]
        }else if(sameVnode(oldEndVnode,newStartVnode)){//Vnode moved left
            
        }
    }
}
