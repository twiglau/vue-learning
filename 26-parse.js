/**
 * 编译过程首先就是对模板做解析,生成 AST, 它是一种抽象语法树,
 * 是对源代码的抽象语法结构的树状变现形式.
 * 在很多编译技术中,如 babel 编译 ES6 的代码都会先生成 AST.
 */

`
<ul :class="bindCls" class="list" v-if="isShow">
    <li v-for="(item,index) in data" @click="clickItem(index)">{{item}} : {{index}}</li>
</ul>
`
//经过 parse 过程后,生成的 AST 如下:
`
ast = {
    'type':1,
    'tag':'ul',
    'attrsList':[],
    'attrsMap':{
        ':class':'bindCls',
        'class':'list',
        'v-if':'isShow'
    },
    'if':'isShow',
    'ifConditions':[{
        'exp':'isShow',
        'block': // ul ast element,
    }],
    'parent':undefined,
    'plain':false,
    'staticClass':'list',
    'classBinding':'bindCls',
    'children':[{
        'type':1,
        'tag':'li',
        'attrsList':[{
            'name':'@click',
            'value':'clickItem(index)'
        }],
        'attrsMap':{
            '@click':'clickItem(index)',
            'v-for':'(item,index) in data'
        },
        'parent':// ul ast element,
        'plain':false,
        'events':{
            'click':{
                'value':'clickItem(index)'
            }
        },
        'hasBindings':true,
        'for':'data',
        'alias':'item',
        'iterator1':'index',
        'children':[
            'type': 2,
            'expression': '_s(item)+":"+_s(index)',
            'text': '{{item}} : {{index}}',
            'tokens':[
                {'@binding':'item'},
                ':',
                {'@binding':'index'}
            ]
        ]
    }]
}
`

//整体流程 parse 定义,在 src/compiler/parser/index.js 中:
export function parse(
    template:string,
    options:CompilerOptions
): ASTElement | void {
    getFnsAndConfigFromOptions(options)

    parseHTML(template,{
        // options ...
        start(tag,attrs,unary){
            let element = createASTElement(tag,attrs)
            processElement(element)
            treeManagement()
        },
        end(){
            treeManagement()
            closeElement()
        },
        chars(text:string){
            handleText()
            createChildrenASTOfText()
        },
        comment(text: string){
            createChildrenASTOfComment()
        }
    })
    return astRootElement
}
