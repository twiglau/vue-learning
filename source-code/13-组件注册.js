/**
 * 组件注册
 * 
 * 在Vue.js中,除了它内置的组件如 keep-alive, component, transition, transition-group 等, 其他用户自定义组件在
 * 使用前必须注册.
 * Vue.js 提供了2种组件的注册方式,全局注册和局部注册.从源码角度分析这两种注册方式.
 */

/**
 * 1. 全局注册
 */
Vue.component('my-component',{
    // 选项
})
//1.1 Vue.component 函数是什么时候定义的? 定义过程发生在最开始初始化 Vue 的全局函数.
// 代码在  src/core/global-api/assets.js 中:
import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject,validateComponentName } from '../util/index'

export function initAssetRegisters(Vue: GlobalAPI) {
    /**
     * Create asset registration methods.
     */
    ASSET_TYPES.forEach(type => {
        Vue[type] = function(id:string,definition:Function | Object) : Function | Object | void {
            if(!definition) {
                return this.options[type + 's'][id]
            }else{
                /**istanbul ignore if */
                if(process.env.NODE_ENV !== 'production' && type === 'component'){
                    validateComponentName(id)
                }
                if(type === 'component' && isPlainObject(definition)){
                    definition.name = definition.name || id
                    definition = this.options._base.extend(definition)
                }
                if(type === 'directive' && typeof definition === 'function'){
                    definition = {bind:definition, update:definition}
                }
                this.options[type + 's'][id] = definition
                return definition
            }
        }
    })
}
//函数首选遍历 ASSET_TYPES, 得到 type 后挂载到 Vue 上. ASSET_TYPES 的定义在 src/shared/constants.js中:
export const ASSET_TYPES = [
    'component',
    'directive',
    'filter'
]

/**
 * 所以实际上 Vue 是初始化了 3 个全局函数,并且如果 type 是 component 且 definition 是一个
 * 对象的话, 通过 this.options._base.extend,相当于 Vue.extend 把这个对象转换成一个继承
 * 于 Vue 的构造函数,最后通过 this.options[type + 's][id] = definition 把它挂载到
 * Vue.options.components 上.
 */

//由于每个组件的创建都是通过 Vue.extend 继承而来,我们之前分析过在继承的过程中有这么一段逻辑:
Sub.options = mergeOptions(
    Super.options,
    extendOptions
)
//也就是说它会把 Vue.options 合并到 Sub.options, 也就是组件的 options 上,然后在组件
//的实例化阶段,会执行 merge options 逻辑,把 Sup.options.components 合并到 
//vm.$options.components 上.

//在创建 vnode 的过程中,会执行 _createElement 方法,我们再来回顾下这部分逻辑
//它的定义在  src/core/vdom/create-element.js 中:
export function _createdElement (
    context:Component,
    tag?:string | Class<Component> | Function | Object,
    data?:VNodeData,
    children?:any,
    normalizationType?:number
):VNode | Array<VNode> {
    // ...
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
            // component
            vnode = createComponent(Ctor,data,context,children,tag)
        }else{
            //unknown or unlisted namespaced elements
            //check at runtime because it may get assigned a namespace when its 
            //parent normalizes children
            vnode = new VNode(
                tag,data,children,
                undefined,undefined,context
            )
        }
    }else{
        //direct component options / constructor
        vnode = createComponent(tag,data,context,children)
    }
    // ...
}
//逻辑判断 isDef(Ctor = resolveAsset(context.$options,'components',tag)),先来看下 resolveAsset 定义:
//在  src/core/utils/options.js 中:

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
export function resolveAsset (
    options:Object,
    type:string,
    id: string,
    warnMissing?: boolean
): any {
    /** istanbul ignore if */
    if(typeof id !== 'string'){
        return
    }
    const assets = options[type]
    //check local registration variations first
    if(hasOwn(assets,id)) return assets[id]
    const camelizedId = camelize(id)
    if(hasOwn(assets,camelizedId)) return assets[camelizedId]
    const PascalCaseId = capitalize(camelizedId)
    if(hasOwn(assets,PascalCaseId)) return assets[PascalCaseId]
    //fallback to prototype chain
    const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
    if(process.env.NODE_ENV !== 'production' && warnMissing && !res){
        warn(
            'Failed to resolve' + type.slice(0,-1) + ': ' + id,
            options
        )
    }
    return res
}
// 先通过 const assets = options[type] 拿到  assets, 然后再尝试拿到 assets[id],
// 这里有个顺序,先直接使用id 拿, 如果不存在,则把 id 变成驼峰的形式再拿,如果仍然不存在驼峰的基础上
// 把首字母再变成大写的形式再拿,如果仍然拿不到则报错,这样说明了我们在使用 Vue.component(id,definition)
// 全局注册组件的时候,id 可以是连字符,驼峰 或 首字母大写的形式.

// 回到我们的调用 resolveAsset(context.$options,'components',tag),即为 vm.$options.components[tag],
// 这样我们就可以在 resolveAsset 的时候拿到这个组件的构造函数,并作为 createComponent 的钩子的参数.


//2. 局部注册
