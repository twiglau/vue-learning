/**
 * Virtual DOM 就是用一个原生的JS对象去描述一个 DOM节点, 在Vue.js中, Virtual DOM 是用 VNode 这么一个Class区描述
 * src/core/vdom/vnode.js 中的.
 */
export default class VNode {
    tag:string | void;
    data: VNodeData | void;
    children: ?Array<VNode>;
    text:string | void;
    elm: Node | void;
    ns: string | void;
    context: Component | void; // rendered in this component's scope
    key: string | number | void;
    componentOptions: VNodeComponentOptions | void;
    componentInstance: Component | void; // component instance
    parent: VNode | void; // component placeholder node

    // strictly internal
    raw: Boolean; // contains raw HTML? (server only)
    isStatic:Boolean; // hoisted static node
    isRootInsert:Boolean; // necessary for enter transition check
    isComment:Boolean; // empty comment placeholder?
    isCloned: Boolean; // is a cloned node?
    isOnce: boolean; // is a v-once node?
    asyncFactory: Function | void; // async component factory function
    asyncMeta: Object | void;
    isAsyncPlaceholder: Boolean;
    ssrContext: Object | void;
    fnContext: Component | void; // real context vm for functional nodes
    fnOptions: ?ComponentOptions; // for SSR caching
    fnScopeId: ?String; // functional scope id support

    constructor (
        tag?:String,
        data?:VNodeData,
        children?:?Array<VNode>,
        text?:string ,
        elm?:Node,
        context?:Component,
        componentOptions?:VNodeComponentOptions,
        asyncFactory?:Function

    ) {
        //....初始化
    }
    //DEPRECATED:alias for componentInstance for backwards compat.
    /** istanbul ignore next */
    get child(): Component | void {
        return this.componentInstance
    }
}
// Virtual DOM 是借鉴了一个开源库 snabbdom 的实现.