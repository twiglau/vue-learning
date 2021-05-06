/**
 * 1. createElement
 * Vue.js 利用 createElement 方法创建 VNode, 它定义在 src/core/vdom/create-element.js 中:
 */
// wrapper function for providing a more flexible interface
// without getting yelled at by flow
export function createElement (
    context:Component,
    tag:any,
    data:any,
    children:any,
    normalizationType:any,
    alwaysNormalize:boolean
):VNode | Array<VNode> {
    if(Array.isArray(data) || isPrimitive(data)) {
        normalizationType = children
        children = data
        data = undefined
    }
    if(isTrue(alwaysNormalize)){
        normalizationType = ALWAYS_NORMALIZE
    }
    return _createElement(context,tag,data,children,normalizationType)
}
// createELement 方法实际上是对 _createElement 方法的封装,它允许传入的参数更加灵活,在处理
// 这些参数后,调用真正创建 VNode 的函数 _createElement:
export function _createElement(
    context:Component,
    tag?:string | Class<Component> | Function | Object,
    data?:VNodeData,
    children?:AnalyserNode,
    normalizationType?:number
):VNode | Array<VNode> {
    if(isDef(data) && isDef((data:any).__ob__)){
        process.env.NODE_ENV !== 'production' && warn(
            `Avoid using observed data object as vnode data:${JSON.stringify(data)}\n` +
            `Always create fresh vnode data objects in each render!`,
            context
        )
        return createEmptyVNode()
    }
    //object syntax in v-bind
    if(isDef(data) && isDef(data.is)){
        tag = data.is
    }
    if(!tag){
        // in case of component :is set to falsy value
        return createEmptyVNode()
    }
    // warn against non-primitive key
    if(process.env.NODE_ENV !== 'production' && isDef(data) && isDef(data.key) && !isPrimitive(data.key)){
        if(!__WEEX__ || !('@binding' in data.key)){
            warn(
                'Avoid using non-primitive value as key, ' +
                'use string/number value instead. ',
                context
            )
        }
    }
    // support single function children as default scoped slot
    if(Array.isArray(children) && typeof children[0] === 'function'){
        data = data || {}
        data.scopedSlots = {default:children[0]}
        children.length = 0
    }
    if(normalizationType === ALWAYS_NORMALIZE){
        children = normalizeChildren(children)
    }else if(normalizationType === SIMPLE_NORMALIZE) {
        children = simpleNormalizeChildren(children)
    }
    let vnode,ns
    if(typeof tag === 'string'){
        let Ctor
        ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
        if(config.isReservedTag(tag)){
            //platform built-in elements
            vnode = new VNode(
                config.parsePlatformTagName(tag),data,children,
                undefined,undefined,context
            )
        }else if(isDef(Ctor = resolveAsset(context.$options,'components',tag))){
            vnode = createComponent(Ctor,data,context,children,tag)
        }else {
            vnode = new VNode(
                tag,data,children,
                undefined,undefined,context
            )
        }
    }else {
        vnode = createComponent(tag,data,context,children)
    }
    if(Array.isArray(vnode)){
        return vnode 
    }else if(isDef(vnode)){
        if(isDef(ns)) applyNS(vnode,ns)
        if(isDef(data)) registerDeepBindings(data)
        return vnode
    }else {
        return createEmptyVNode()
    }
}
/**
 * 2. _createElement 方法有5个参数
 * context --->表示 VNode 的上下文环境,它是 Component 类型;
 * tag --->表示标签,它可以是一个字符串,也可以是一个Component; 
 * data --->表示Vnode 的数据,它是一个 VNodeData 类型,可以在flow/vnode.js 中找到它的定义,这里先不展开解释;
 * children --->表示当前VNode 的子节点,它是任意类型的,它接下来需要被规范为标准的VNode 数组;
 * normalizationType --->表示子节点规范的类型,类型不同规范的方法也就是不一样.
 * 
 * 下面来分析: children 的规范化 以及 VNode 的创建
 */

/**
 * 3. children 的规范化
 * 由于 Virtual DOM 实际上是一个树状结构,每一个 VNode 可能会有若干个子节点,这些子节点应该也是 VNode 的类型.
 * _createElement 接收的第4个参数children是任意类型的,因此我们需要把它们规范成VNode 类型
 * 这里根据 normalizationType 的不同, 调用了 normalizeChildren(children) 和 simpleNormalizeChildren(children)方法,
 * 它们的定义都在 src/core/vdom/helpers/normalzie-children.js 中:
 */
// The template compiler attempts to minimize the need for normalization by
// statically analyzing the template at compile time.

// For plain HTML markup, normalization can be completely skipped because the
// generated render function is guaranteed to return Array<VNode>. There are
// two cases where extra normalization is needed!

// 1. When the children contains components - because a functional component
// may return an Array instead of a single root. In this case, just a simple
// normalization is needed - if any child is an Array, we flatten the whole
// thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
// because functional components already normalize their own children.
export function simpleNormalizeChildren(children:any) {
    for(let i = 0; i < children.length; i++) {
        if(Array.isArray(children[i])){
            return Array.prototype.concat.apply([],children)
        }
    }
    return children
}

//2. When the children contains constructs that always generated nested Arrays,
// e.g. <template>,<slot>,v-for,or when the children is provided by user
// with hand-written render functions / JSX. In such cases a full normalization
// is needed to cater to all possible types of children values.
export function normalizeChildren(children: any): ?Array<VNode> {
    return isPrimitive(children) ? [createTextVNode(children)] : Array.isArray(children)? normalizeArrayChildren(children) : undefined
}

//simpleNormalizeChildren 方法调用场景是 render 函数当函数是编译生成的. 在理论上编译生成的
//children 都已经是VNode 类型的,但这里有一个例外,就是 functional component 函数式组件返回的是一个数组而不是一个根节点,所以
//会通过 Array.prototype.concat 方法把整个children数组打平,让它的深度只有一层.

//normalizeChildren 方法的调用场景有2种,一个场景是 render 函数是用户手写的,当children 只有一个节点的时候, Vue.js 从
//接口层面允许用户把 children 写成基础类型用来创建单个简单的文本节点,这种情况会调用 createTextVNode 创建一个文本节点的VNode;
//另一个场景是当编译 slot, v-for 的时候会产生嵌套数组的情况,会调用 normalizeArrayChildren 方法
function normalizeArrayChildren(children:any,nestedIndex?:string):Array<VNode> {
    const res = []
    let i,c,lastIndex,last
    for(i = 0; i < children.length; i++) {
        c = children[i]
        if(isUndef(c) || typeof c === 'boolean') continue
        lastIndex = res.length - 1
        last = res[lastIndex]
        // nested
        if(Array.isArray(c)){
            if(c.length > 0){
                c = normalizeArrayChildren(c,`${nestedIndex || ''}_${i}`)
                // merge adjacent text nodes
                if(isTextNode(c[0]) && isTextNode(last)){
                    res[lastIndex] = createTextVNode(last.text + (c[0] : any).text)
                    c.shift()
                }
                res.push.apply(res,c)
            }
        }else if(isPrimitive(c)){
            if(isTextNode(last)){
                // merge adjacent text nodes
                // this is necessary for SSR hydration because text nodes are
                // essentially merged when rendered to HTML strings
                res[lastIndex] = createTextVNode(last.text + c)
            }else if(c !== ''){
                // convert primitive to vnode
                res.push(createTextVNode(c))
            }
        }else {
            if(isTextNode(c) && isTextNode(last)){
                // merge adjacent text nodes
                res[lastIndex] = createTextVNode(last.text + c.text)
            }else {
                // defalut key for nested array children (likely generated by v-for)
                if(isTrue(children._isVList)
                && isDef(c.tag)
                && isUndef(c.key)
                && isDef(nestedIndex)
                ) {
                    c.key = `__vlist${nestedIndex}__${i}__`
                }
                res.push(c)
            }
        }
    }
    return res
}

/**
 * normalizeArrayChildren 接收2个参数,children 表示要规范的子节点, nestedIndex 表示
 * 嵌套的索引,因为单个 child 可能是一个数组类型. normalizeArrayChildren 主要的逻辑
 * 就是遍历children,获得单个节点 c, 然后对 c 的类型判断,如果是一个数组类型,则递归调用
 * normalizeArrayChildren; 如果 children 是一个列表并且列表还存在嵌套的情况,则根据
 * nestedIndex 去更新它的key.
 * 
 * 经过对 children 的规范化, children 变成了一个类型为 VNode 的 Array.
 */
