/**
 * 当我们使用 Runtime+Compiler的Vue.js
 * 它的入口是 src/platforms/web/entry-runtime-with-compiler.js
 * 看下对 $mount 函数定义:
 */
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function(
    el?:string | Element,
    hydrating?:boolean
): Component {
    el = el && query(el)

    if(el === document.body || el === document.documentElement){
        process.env.NODE_ENV !== 'production' && warn(
            'Do not mount Vue to <html> or <body> - mount to normal elements instead.'
        )
        return this
    }

    const options = this.$options
    //resolve template/el and convert to render function
    if(!options.render){
        let template = options.template
        if(template){
            if(typeof template === 'string'){
                if(template.charAt(0) === '#'){
                    template = idToTemplate(template)
                    if(process.env.NODE_ENV !== 'production' && !template){
                        warn(
                            `Template element not found or is empty: ${options.template}`,
                            this
                        )
                    }
                }
            }else if(template.nodeType){
                template = template.innerHTML
            }else{
                if(process.env.NODE_ENV !== 'production'){
                    warn('invalid template option:' + template,this)
                }
                return this
            }
        }else if(el){
            template = getOuterHTML(el)
        }
        if(template){
            if(process.env.NODE_ENV !== 'production' && config.performance && mark){
                mark('compile')
            }
            //这段函数逻辑之前分析过, 关于编译的入口就是在这里:
            //compileToFunctions 方法就是把模板 template 编译生成 render 以及 staticRenderFns.
            //它的定义在 src/platforms/web/compiler/index.js 中:
            /**
             * import { baseOptions } from './options'
             * import { createCompiler } from 'compiler/index'
             * import { compile,compileToFunctions } = createCompiler(baseOptions)
             * export { compile, compileToFunctions }
             * 可以看到 compileToFunctions 方法实际上是 createCompiler 方法的返回值.
             */
            const {render,staticRenderFns } = compileToFunctions(template,{
                shouldDecodeNewlines,
                shouldDecodeNewlinesForHref,
                delimiters:options.delimiters,
                comments:options.comments
            }, this)
            options.render = render
            options.staticRenderFns = staticRenderFns

            if(process.env.NODE_ENV !== 'production' && config.performance && mark){
                mark('compile end')
                MediaSource(`vue ${this._name} compile`,'compile','compile end')
            }
        }
    }
    return mount.call(this,el,hydrating)
}

// createCompiler 方法的定义,在 src/compiler/index.js中:

// 'createCompilerCreater' allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile(
    template:string,
    options:CompilerOptions
):CompiledResult {
    // 解析模板字符串生层 AST
    const ast = parse(template.trim(),options)
    if(options.optimize !== false){
        //优化语法树
        optimize(ast,options)
    }
    //生成代码
    const code = generate(ast,options)
    return {
        ast,
        render:code.render,
        staticRenderFns:code.staticRenderFns
    }
})
//createCompiler 方法实际上是通过调用createCompilerCreator 方法返回的,
//该方法传入的参数是一个函数,真正的编译过程都在这个 baseCompile 函数里执行,
//那么 createCompilerCreator 是什么? 定义在 src/compiler/create-compiler.js中:
export function createCompilerCreator(baseCompile:Function):Function {
    return function createCompiler(baseOptions:CompilerOptions){
        function compile(
            template:string,
            options?:CompilerOptions
        ): CompiledResult {
            const finalOptions = Object.create(baseOptions)
            const errors = []
            const tips = []
            finalOptions.warn = (msg,tip) =>{
                (tip ? tips : errors).push(msg)
            }

            if(options){
                //merge custom modules
                if(options.modules){
                    finalOptions.modules = (baseOptions.modules || []).concat(options.modules)
                }
                // merge custom directives
                if(options.directives){
                    finalOptions.directives = extend(
                        Object.create(baseOptions,directives || null),
                        options.directives
                    )
                }

                //copy other options
                for(const key in options){
                    if(key !== 'modules' && key !== 'directives'){
                        finalOptions[key] = options[key]
                    }
                }
            }

            const compiled = baseCompile(template,finalOptions)
            if(process.env.NODE_ENV !== 'production'){
                errors.push.apply(errors,detectErrors(compiled.ast))
            }
            compiled.errors = errors
            compiled.tips = tips
            return compiled
        }
        return {
            compile,
            compileToFunctions:createCompileToFunctionFn(compile)
        }
    }
}

//createCompileToFunctionFn 方法,它的定义在 src/compiler/to-function/js 中:
//compile 函数在执行 createCompileToFunctionFn 的时候作为参数传入,它是 createCompiler
//函数中定义的 compile 函数
export function createCompileToFunctionFn(compile:Function): Function {
    const cache = Object.create(null)

    // 1.编译模板 template
    // 2.编译配置 options
    // 3.Vue实例 vm.
    return function compileToFunctions (
        template:string,
        options?:CompilerOptions,
        vm?:Component
    ): CompiledFunctionResult {
        options = extend({},options)
        const warn = options.warn || baseWarn
        delete options.warn

        if(process.env.NODE_ENV !== 'production'){
            try {
                new Function('return 1')
            }catch( e ){
                if(e.toString().match(/unsafe-eval|CSP/)){
                    warn(
                        'It seems you are using the standalone build of Vue.js in an ' +
                        'environment with Content Security Policy that prohibits unsafe-eval. '

                        'The template compiler cannot work in this environment. Consider ' +
                        'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
                        'templates into render functions. '
                    )
                }
            }
        }

        // check cache
        const key = options.delimiters ? String(options.delimiters) + template : template
        if(cache[key]){
            return cache[key]
        }

        // compile --> 核心的编译过程:
        const compiled = compile(template,options)
        // check compilation errors/tips
        if(process.env.NODE_ENV !== 'production'){
            if(compiled.errors && compiled.errors.length){
                warn(
                    `Error compiling template:\n\n${template}\n\n` +
                    compiled.errors.map(e => ` - ${e}`).join('\n') + '\n',
                    vm
                )
            }
        }
        if(compiled.tips && compiled.tips.length){
            compiled.tips.forEach(msg => tip(msg,vm))
        }

        //turn code into functions
        const res = {}
        const fnGenErrors = []
        res.render = createFunction(compiled.render,fnGenErrors)
        res.staticRenderFns = compiled.staticRenderFns.map(code => {
            return createFunction(code,fnGenErrors)
        })

        // check function generation errors.
        // this should only happen if there is a bug in the compiler itself.
        // mostly for codegen development use
        if(process.env.NODE_ENV !== 'production'){
            if((!compiled.errors || !compiled.errors.length) && fnGenErrors.length){
                warn(
                    `Failed to generate render function:\n\n` +
                    fnGenErrors.map(({ err, code }) => `${err.toString()} in\n\n${code}\n`.join('\n')),
                    vm
                )
            }
        }
        return (cache[key] = res)
    }
}

//compile 函数在执行 createCompileToFunctionFn 的时候作为参数传入,它是 createCompiler
//函数中定义的 compile 函数:
function compile(
    template:string,
    options?:CompilerOptions
): CompiledResult {
    const finalOptions = Object.create(baseOptions)
    const errors = []
    const tips = []
    finalOptions.warn = (msg,tip) => {
        (tip ? tips : errors).push(msg)
    }
    if(options){
        //merge custom modules
        if(options.modules){
            finalOptions.modules = (baseOptions.modules || []).concat(options.modules)
        }
        //merge custom directives
        if(options.directives){
            finalOptions.directives = extend(
                Object.create(baseOptions.directives || null),
                options.directives
            )
        }
        // copy other options
        for(const key in options ){
            if(key !== 'modules' && key !== 'directives'){
                finalOptions[key] = options[key]
            }
        }
    }

    const compiled = baseCompile(template,finalOptions)
    if(process.env.NODE_ENV !== 'production'){
        errors.push.apply(errors,detectErrors(compiled.ast))
    }
    compiled.errors = errors
    compiled.tips = tips
    return compiled
}

/**
 * 编译入口逻辑 -- 编译过程中的依赖配置 baseOptions 会有所不同.
 * 编译过程会多次执行,但这同一个平台下每一次的编译过程配置又是相同的.
 * 为了不让这些配置在每次编译过程都通过参数传入, Vue.js 利用了函数柯里化的技巧
 * 很好的实现了 baseOptions 的参数保留.同样, Vue.js 也是利用函数柯里化技巧把基础的编译过程
 * 函数抽出来,通过 createCompilerCreator(baseCompile) 的方式把真正编译的过程和其他逻辑
 * 如对编译配置处理, 缓存处理等剥离开.
 */
