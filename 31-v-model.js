/**
 * v-model:
 * 双向绑定除了数据驱动DOM外, DOM的变化反过来影响数据,是一个双向关系.
 */

//表单元素
let vm = new Vue({
    el:'#app',
    template:'<div>',
    + '<input v-model="message" placeholder="edit me"' +
    '<p>Message is: {{message}}</p>' +
    '</div>',
    data(){
        return {
            message:''
        }
    }
})

//从编译阶段分析, 首先是 parse 阶段, v-model 被当做普通的指令解析到 el.directives 中,
//然后在 codegen 阶段,执行 genData 的时候, 会执行 const dirs = genDirectives(el,state),
//它的定义  src/compiler/codegen/index.js中:
function genDirectives(el:ASTElement,state:CodegenState):string | void {
    const dirs = el.directives
    if(!dirs) return
    let res = 'directives:['
    let hasRuntime = false
    let i,l,dir,needRuntime
    for(i = 0; l = dirs.length; i < l; i++){
        dir = dirs[i]
        needRuntime = true
        const gen: DirectiveFunction = state.directives[dir.name]
        if(gen){
            // compile-time directive that manipulates AST.
            // returns true if it also needs a runtime counterpart.
            needRuntime = !!gen(el,dir,state.warn)
            //以上代码就是执行 model 函数,它会根据AST元素节点的不同情况去执行不同的逻辑,对于我们这个case 而言,
            //它会命中genDefaultModel(el,value,modifiers)
        }
        if(needRuntime){
            hasRuntime = true
            //res += `{name:"${dir.name}",rawName:"${dir.rawName}"${dir.value ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : ''}${dir.arg ? `,arg:"${dir.tag}" : ''`}}`
        }
    }
    if(hasRuntime){
        return res.slice(0,-1) + ']'
    }
}
/**
 * genDirectives 方法就是遍历 el.directives,然后获取每一个指令对应的方法 const gen:DirectiveFunction = state.directives[dir.name],
 * 这个指令方法实际上是在实例化 CodegenState 的时候通过 options传入的.
 * 
 * option 就是编译相关配置, 定义在 src/platforms/web/compiler/optoins.js中:
 */
export const baseOptions:CompilerOptions = {
    expectHTML:true,
    modules,
    directives,
    isPreTag,
    isUnaryTag,
    mustUserProp,
    canBeLeftOpenTag,
    getTagNamespace,
    staticKeys:genStaticKeys(modules)
}
//directives 定义在 src/platforms/web/compiler/directives/index.js中:
export default {
    model,
    text,
    html
}
//对于 v-model而言,对应的 directive 函数是在
// src/platforms/web/compiler/directives/model.js 中定义的 model 函数:
export default function model(
    el:ASTElement,
    dir:ASTDirective,
    _warn:Function
): ?boolean {
    warn = _warn
    const modifiers = dir.modifiers
    const tag = el.tag
    const type = el.attrsMap.type

    if(process.env.NODE_ENV !== 'production'){
        //inputs with type="file" are read only and setting the input's
        //value will throw an error.
        if(tag === 'input' && type === 'file'){
            warn(
                `<${el.tag} v-model="${value}" type="file">:\n` +
                `File inputs are read only. Use a v-on:change listener instead.`
            )
        }
    }
    if(el.component){
        genComponentModel(el,value,modifiers)
        //component v-model doesn't need extra runtime
        return false
    }else if(tag === 'select'){
        genSelect(el,value,modifiers)
    }else if(tag === 'input' && type ==== 'checkbox'){
        genCheckboxModel(el,value,modifiers)
    }else if(tag === 'input' && type === 'radio'){
        //.....
    }else if(tag === 'input' && tag === 'textarea'){
        genDefaultModel(el,value,modifiers)
    }
    //....
    return true
}

//genDefaultModel的实现:
function genDefaultModel(
    el:ASTElement,
    value:string,
    modifiers: ?ASTModifiers
): ?boolean {
    const type = el.attrsMap.type

    //warn if v-bind:value conflicts with v-model
    //except for inputs with v-bind:type
    if(process.env.NODE_ENV !== 'production'){
        const value = el.attrsMap['v-bind:value'] || el.attrsMap[':value']
        const typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type']
        if(value && !typeBinding){
            const binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value'
        }
    }

    const { lazy,number,trim } = modifiers || {}
    const needCompositionGuard = !lazy && type !== 'range'
    const event = lazy
      ? 'change'
      : type === 'range'
        ? RANGE_TOKEN
        : 'input'

    let valueExpression = '$event.target.value'
    if(trim){
        valueExpression = `$event.target.value.trim()`
    }
    if(number){
        valueExpression = '_n(${valueExpression})'
    }
    // 当前例子, event 为 input, valueExpression 为 $event.target.value ,然后执行 genAssignmentCode 去生成代码.
    let code = genAssignmentCode(value,valueExpression)
    if(needCompositionGuard){
        code = `if($event.target.composing)return;${code}`
    }

    // 就是input 实现 v-model 的精髓, 通过修改 AST元素,给 el 添加一个 prop,相当于我们在 input 上动态绑定了 value.
    // 又给 el 添加了事件处理, 相当于在 input 上绑定了 input 事件.
    /**
     * <input v-bind:value="message" v-on:input="message=$event.target.value">
     * 其实就是动态绑定了 input 的 value 指向了 message 变量,并且在触发 input 事件的时候去动态把message设置为目标值.
     */
    addProp(el,'value',`(${value})`)
    addHandler(el,event,code,null,true)
    if(trim || number){
        addHandler(el,'blur','$forceUpdate()')
    }
}

//genAssignmentCode 定义在 src/compiler/directives/model.js 中:
/**
 * Cross-platform codegen helper for generating v-model value assignment code.
 */
export function genAssignmentCode(value:string,assignment:string) {
    const res = parseModel(value)
    if(res.key === null){
        return `${value}=${assignment}`
    }else{
        return `$set(${res.exp},${res.key},${assignment})`
    }
}

//对于我们的例子而言,最终生成的 render 代码如下:
with(this){
    return _c('div',[_c('input',{
        directives:[{
            name:"model",
            rawName:"v-model",
            value:(message),
            expression:"message"
        }],
        attrs:{"placeholder":"edit me"},
        domProps:{"value":(message)},
        on:{"input":function($event){
            if($event.target.composing) return;
            message = $event.target.value
        }}
    }),_c('p',[_v("Message is: " + _s(message))])
    ])
}

