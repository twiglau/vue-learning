/**
 * event
 * 处理组件间的通讯,原生的交互,都离不开事件.
 * 对于一个组件元素,我们不仅仅可以绑定原生的DOM事件,还可以绑定自定义事件.
 */
let Child = {
    template:'<button @click="clickHandler($event)">' + 
    'click me' +
    '</button>',
    methods: {
        clickHandlers(e){
            console.log('Button clicked!',e)
            this.$emit('select')
        }
    },
}

let vm = new Vue({
    el:'#app',
    template:'<div>' +
    '<child @select="selectHandler" @click.native.prevent="clickHandler"></child>' + '</div>',
    methods: {
        clickHandler(){
            console.log('Child clicked!')
        },
        selectHandler(){
            console.log('Child select!')
        }
    },
    components:{
        Child
    }
})

//编译
//从编译阶段开始,在 parse 阶段,会执行 processAttrs 方法,它的定义在 src/compiler/parser/index.js 中:
export const onRE = /^@|^v-on:/
export const dirRE = /^v-|^@|^:/
export const bindRE = /^:|^v-bind:/

function processAttrs(el){
    const list = el.attrsList
    let i,l,name,rawName,value,modifiers,isProp
    for( i = 0; l = list.length; i < l; i++){
        name = rawName = list[i].name
        value = list[i].value
        if(dirRE.test(name)){
            el.hasBindings = true
            modifiers = parseModifiers(name)
            if(modifiers){
                name = name.replace(modifierRE,'')
            }
            if(bindRE.test(name)){
                // ...
            }else if(onRE.test(name)){
                name = name.replace(onRE,'')
                addHandler(el,name,value,modifiers,false,warn)
            }else{
                // ...
            }
        }else{
            //...
        }
    }
}

function parseModifiers(name:string):Object | void {
    const match = name.match(modifierRE)
    if(match){
        const ret = {}
        match.forEach(m => { ret[m.slice(1)]  = true})
        return ret

    }
}

export function addHandler (
    el:ASTElement,
    name:string,
    value:string,
    modifiers: ?ASTModifiers,
    important?:boolean,
    warn?:Function
){
    modifiers = modifiers || emptyObject
    //warn prevent and passive modifier
    if(process.env.NODE_ENV !== 'production' && warn && modifiers.prevent && modifiers.passive){
        warn(
            'passive and prevent can\'t be used together. ' +
            'Passive handler can\'t prevent default event. '
        )
    }

    //check capture modifier
    //首先根据 modifier 修饰符对事件名 name 做处理,接着根据 modifier.native
    //判断是一个纯原生事件还是普通事件, 分别对应 el.nativeEvents 和 el.events,
    //最后按照 name 对事件做归类,并把回调函数的字符串保留到 对应的事件中.
    if(modifiers.capture){
        delete modifiers.capture
        name = '!' + name // mark the event as captured
    }
    if(modifiers.once){
        delete modifiers.once
        name = '~' + name // mark the event as once
    }
    if(modifiers.passive){
        delete modifiers.passive
        name = '&' + name // mark the event as passive
    }
    /**
     * normalize click.right and click.middle since they don't actually fire this is
     * technically browser-specific, but at least for now browsers are the only target
     * envs that right/middle clicks.
     */
    if(name === 'click'){
        if(modifiers.right){
            name = 'contextmenu'
            delete modifiers.right
        }else if(modifiers.middle){
            name = 'mouseup'
        }
    }

    let events
    if(modifiers.native){
        delete modifiers.native
        events = el.nativeEvents || (el.nativeEvents = {})
    }else{
        events = el.events || (el.events = {})
    }

    const newHandler: any = {
        value: value.trim()
    }
    if(modifiers !== emptyObject){
        newHandler.modifiers = modifiers
    }
    const handlers = events[name]
    if(Array.isArray(handlers)){
        important ? handlers.unshift(newHandler) : handlers.push(newHandler)
    }else if(handlers){
        events[name] = important ? [newHandler,handlers] : [handlers,newHandler]
    }else {
        events[name] = newHandler
    }
    el.plain = false
}

//在我们的例子中,父组件的 child 节点生成的 el.events 和 el.nativeEvents 如下:

`
el.events = {
    select: {
        value: 'selectHandler'
    }
}
el.nativeEvents = {
    click: {
        value:'clickHandler',
        modifiers:{
            prevent:true
        }
    }
}
`
//子组件的 button 节点生成的 el.events 如下:

`
el.events = {
    click: {
        value:'clickHandler($event)'
    }
}
`
//然后在 codegen 的阶段, 会在 genData 函数中根据 AST 元素节点上的 events 和 nativeEvents 生成 data 数据,定义在 src/compiler/codegen/index.js:
export function genData(el:ASTElement,state:CodegenState): string {
    let data = '{'
    // ...
    if(el.events){
        data += `${genHandlers(el.events,false,state.warn)}, `
    }
    if(el.nativeEvents){
        data += `${genHandlers(el.nativeEvents,true,state,warn)}, `
    }
    // ...
    return data
}
//对于这两个属性,会调用 genHandlers 函数,定义在 src/compiler/codegen/events.js 中:
export function getHandlers(
    events:ASTElementHandlers,
    isNative:boolean,
    warn: Function
): string {
    //genhandlers 方法遍历时间对象events.对同一个事件名称的时间调用 genHandler(name,events[name])方法.
    let res = isNative ? 'nativeOn:{' : 'on:{'
    for(const name in events){
        res += `"${name}":${genHandler(name,events[name])}, `
    }
    return res.slice(0,-1) + '}'
}

const fnExpRE
const simplePathRE
function genHandler(
    name:string,
    handler:ASTElementHandler | Array<ASTElementHandler>
): string {
    if(!handler){
        return 'function(){}'
    }
    if(Array.isArray(handler)){
        return `[${handler.map(handler => genHandler(name,handler)).join(',')}]`
    }
    const isMethodPath = simplePathRE.test(handler.value)
    const isFunctionExpression = fnExpRE.test(handler.value)
    if(!handler.modifiers){
        if(isMethodPath || isFunctionExpression){
            return handler.value
        }
        if(__WEEX__ && handler.params){
            return genWeexHandler(handler.params,handler.value)
        }
        return `function($event){${handler.value}}` //inline statement
    }else{
        let code = ''
        let genModifierCode = ''
        const keys = []
        for(const key in handler.modifiers){
            if(modifierCode[key]){
                genModifierCode += modifierCode[key]
                //left/right
                if(keyCodes[key]){
                    keys.push(key)
                }
            }else if(key === 'exact'){
                const modifiers: ASTModifiers = (handler.modifiers: any)
                genModifierCode += genGuard(
                    ['ctrl','shift','alt','meta']
                    .filter(keyModifier => !modifiers[keyModifier])
                    .map(keyModifier => `$event.${keyModifier}Key`)
                    .join('||')
                )
            }else{
                keys.push(key)
            }
        }
        if(keys.length){
            code += genKeyFilter(keys)
        }
        //Make sure modifiers like prevent and stop get executed after key filtering
        if(genModifierCode){
            code += genModifierCode
        }
        const handlerCode = isMethodPath
          ? 'return ${handler.value}($event)'
          : isFunctionExpression
            ? `return (${handler.value}($event))`
            : handler.value
        if(__WEEX__ && handler.params){
            return genWeexHandler(handler.params,code + handlerCode)
        }
        return `function($event){${code}${$handleCode}}`
    }
}
/**
 * Vue的事件有2种,一种是原生DOM事件,一种是用户自定义事件.
 * DOM事件
 * 在patch的时候执行各种 module 的钩子函数,DOM元素相关的属性,样式,事件等都是通过这些 module 的钩子函数完成设置
 * 所有和web相关的 module 都定义在 src/platforms/web/runtime/modules目录下, 我们关注目录下的 events.js即可.
 */

// 在patch过程中的创建阶段和更新阶段都会执行 updateDOMListeners:
let target: any
function updateDOMListeners(oldVnode:VNodeWithData,vnode:VNodeWithData) {
    if(isUndef(oldVnode.data.on) && isUndef(vnode.data.on)){
        return
    }
    //获取 vnode.data.on,这就是我们之前的生成的 data 中对应的事件对象
    const on = vnode.data.on || {}
    const oldOn = oldVnode.data.on || {}
    //target 是当前 vnode 对于的DOM对象
    target = vnode.elm
    //normalizeEvents 主要是对 v-model 相关的处理.
    normalizeEvents(on)
    updateListeners(on,oldOn,add,remove,vnode.context)
    target = undefined
}

//定义在 src/core/vdom/helpers/update-listeners.js中:
export function updateListeners(
    on:Object,
    oldOn:Object,
    add:Function,
    remove:Function,
    vm:Component
){
    let name,def,cur,old,event
    for(name in on){
        def = cur = on[name]
        old = oldOn[name]
        event = normalizeEvent(name)
        if(__WEEX__ && isPlainObject(def)){
            cur = def.handler
            event.params = def.params
        }
        if(isUndef(cur)){
            process.env.NODE_ENV !== 'production' && warn(
                `Invalid handler for event "${event.name}": got ` + String(cur),
                vm
            )
        }else if(isUndef(old)){
            if(isUndef(cur.fns)){
                cur = on[name] = createFnInvoker(cur)
            }
            add(event.name,cur,event.once,event.capture,event.passive,event.params)
        }else if(cur !== old){
            old.fns = cur
            on[name] = old
        }
    }
    for(name in oldOn){
        if(isUndef(on[name])){
            event = normalizeEvent(name)
            remove(event.name,oldOn[name],event.capture)
        }
    }
}
/**
 * updateListeners 的逻辑很简单,遍历on去添加事件监听,遍历oldOn去移除事件监听,关于监听和移除事件的方法
 * 都是外部传入的,因为它既处理原生DOM事件的添加删除,也处理自定义事件的添加删除.
 */
//对于 on 的遍历, 首先获得每个事件名, 然后做 normalizeEvent 的处理:
const normalizeEvent = cached(name:string):{
    name:string,
    once:boolean,
    capture:boolean,
    passive:boolean,
    handler?:Function,
    params?:Array<any>
} => {
    const passive = name.charAt(0) === '&'
    name = passive ? name.slice(1) : name
    const once = name.charAt(0) === '~' //Prefixed last, checked first
    name = once ? name.slice(1) : name
    const capture = name.charAt(0) === '!'
    name = capture ? name.slice(1) : name
    return {
        name,
        once,
        capture,
        passive
    }
}

//自定义事件
//除了原生DOM事件,Vue还支持了自定义事件,并且自定义事件只能作用在组件上,如果在组件上使用原生事件,需要加 .native 修饰符.
//在render阶段,如果是一个组件节点,则通过 createComponent 创建一个组件 vnode,在 src/core/vdom/create-component.js
export function createComponent(
    Ctor:Class<Component> | Function | Object | void,
    data:?VnodeData,
    context:Component,
    children:?Array<VNode>
    tag?:string
): VNode | Array<VNode> | void {
    // ...
    const listeners = data.on
    data.on = data.nativeOn

    // ....</VNode></VNode>
    const name = Ctor.options.name || tag
    const vnode = new VNode(
        'vue-component-${Ctor.cid}${name ? `-${name}` : ''}',
        data,undefined,undefined,undefined,context,
        {Ctor,propsData,listeners,tag,children},
        asyncFactory
    )
    return vnode
}
