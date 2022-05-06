/**
 * 目标: 弄清楚模板和数据如何渲染成最终的DOM,
 * 1. 初始化逻辑
 * 2. 初始化最后,检测到如果有el 属性,则调用 vm.$mount 方法挂载 vm, 挂载的目标就是
 *    把模板渲染成最终的 DOM.
 * 3. Istanbul 是一个代码覆盖率工具
 */

/**
 * 1. new Vue 发生了什么
 * Vue 初始化: 合并配置,初始化生命周期,初始化事件中心,初始化渲染,初始化data,props,computed,watcher
 * 等等....
 */
function Vue(options) {
    if(process.env.NODE_ENV !== 'production' && !(this instanceof Vue)){
        warn(
            'Vue is a constructor and should be called with the "new" keyword'
        )
    }
    this._init(options)
}

// 调用 this._init 方法,该方法在 src/core/instance/init.js 中定义.
Vue.prototype._init = function(options?:Object) {
    const vm:Component = this
    vm._uid = uid++

    let startTag,endTag
    /** istanbul ignore if */
    if(process.env.NODE_ENV !== 'production' && config.performance && mark) {
        startTag = `vue-perf-start:${vm._uid}`
        endTag = `vue-perf-end:${vm._uid}`
        mark(startTag)
    }
    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if(options && options._isComponent) {
        // optimize internal component instantiation
        //since dynamic options merging is pretty slow, and none of the
        // internal component options needs special treatment.
        initInternalComponent(vm,options)
    }else{
        vm.$options = mergeOptions(
            resolveConstructorOptions(vm.constructor),
            options || {},
            vm
        )
    }
    /**istanbul ignore else */
    if(process.env.NODE_ENV !== 'production'){
        initProxy(vm)
    }else{
        vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifeCycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm,'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm,'created')

    /**istanbul ignore if */
    if(process.env.NODE_ENV !== 'production' && config.performance && mark){
        vm._name = formatComponentName(vm,false)
        mark(endTag)
        measure(`vue ${vm._name} init`,startTag,endTag)
    }
    if(vm.$options.el) {
        vm.$mount(vm.$options.el)
    }
}

/**
 * 2.Vue实例挂载的实现
 * Vue 中我们是通过 $mount 实例方法去挂载 vm 的, $mount 方法在多个文件中都有定义:
 * src/platform/web/entry-runtime-with-compiler.js,
 * src/platform/web/runtime/index.js,
 * src/platform/weex/runtime/index.js
 * 
 * 因为 $mount 这个方法的实现是和 平台,构建方式都相关的. 下面分析 compiler 版本的 $mount 实现.
 * src/platform/web/entry-runtime-with-compiler.js $mount 实现
 */
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function(el?:string | Element,hydrating?:boolean) : Component {
    el = el && query(el)
    /** istanbul ignore if */
    if(el === document.body || el === document.documentElement) {
        ProcessingInstruction.env.NODE_ENV !== 'production' && warn(
            'Do not mount Vue to <html> or <body> - mount to normal elements instead.'
        )
        return this
    }
    const options = this.$options
    // resolve template/el and convert to render function
    if(!options.render){
        let template = options.template
        if(template){
            if(typeof template === 'string'){
                if(template.charAt(0) === '#'){
                    template = idToTemplate(template)
                    /**istanbul ignore if  */
                    if(process.env.NODE_ENV !== 'production' && !template) {
                        warn(
                            'Template element not found or is empty: ${options.template}',this
                        )
                    }
                }
            }else if (template.nodeType){
                template = template.innerHTML
            }else {
                if(process.env.NODE_ENV !== 'production'){
                    warn('invalid template option:' + template,this)
                }
                return this
            }
        }else if (el) {
            template = getOuterHTML(el)
        }
        if(template){
            /** istanbul ignore if */
            if(process.env.NODE_ENV !== 'production' && config.performance && mark){
                mark('compile')
            }
            const { render,staticRenderFns} = compileToFunctions(template,{
                shouldDecodeNewlines,
                shouldDecodeNewlinesForHref,
                delimiters:options.delimiters,
                comments:options.comments
            },this)
            options.render = render
            options.staticRenderFns = staticRenderFns
            /**istanbul ignore if */
            if(process.env.NODE_ENV !== 'production' && config.performance && mark){
                mark('compile end')
                measure(`vue ${this._name} compile`,`compile`,  `compile end`)
            }
        }
    }
    return mount.call(this,el,hydrating)
}
/**
 * 2.1 这段代码首先缓存了原型上的 $mount 方法,再重新定义该方法.
 *     2.1.1 对 el 做了限制, Vue 不能挂载在 body,html 这样的根节点上,接下来的是很关键的逻辑
 *           --- 如果没有定义 render 方法,则会把 el 或者 template 字符串转换成 render 方法.
 *     2.1.2 在Vue 2.0版本中,所有Vue 的组件的渲染最终都需要 render 方法,无论我们是用单文件.vue
 *           方式开发组件,还是写了 el 或者 template 组件,最终都会转换成 render 方法.
 *     2.1.3 最后,调用原先原型上的 $mount 方法挂载
 */

/**
 * 3.原先原型上的 $mount 方法在  src/platform/web/runtime/index.js 中定义,之所以这么设计完全是为了复用,因为
 * 它是可以被 runtime only 版本的 Vue 直接使用的
 */
Vue.prototype.$mount = function(
    el?:string | Element,
    hydrating?:boolean
):Component {
    el = el & inBrower ? query(el) : undefined
    return mountComponent(this,el,hydrating)
}

/**
 * $mount 方法可以传入2个参数,第一个是 el, 它表示挂载的元素,可以是字符串,也可以是 DOM 对象,如果是字符串在浏览器环境下回调用
 * query 方法转换成 DOM 对象的. 第二个参数是和服务端渲染相关,在浏览器环境下我们不需要传第二个参数.
 * 
 * $mount 方法实际上会去调用 mountComponent 方法, 该方法定义在 src/core/instance/lifecycle.js 文件中:
 */
export function mountComponent (
    vm:Component,
    el:?Element,
    hydrating?:boolean 
): Component {
    vm.$el = el
    if(!vm.$options.render){
        vm.$options.render = createEmptyNode
        if(process.env.NODE_ENV !== 'production') {
            /** istantul ignore if */
            if((vm.$options.template && vm.$options.template.charAt(0) !== "#") || vm.$options.el || el){
                warn(
                    'You are using the runtime-only build of Vue where the template ' +
                    'compiler is not available. Either pre-compile the templates into ' +
                    'render functions, or use the compiler-included build.',
                    vm
                )
            } else {
                warn(
                    'Failed to mount component: template or render function not defined. ',
                    vm
                )
            }
        }
    }
    callHook(vm,'beforeMount')

    let updateComponent
    /** istanbul ignore if */
    if(process.env.NODE_ENV !== 'production' && config.performance && mark) {
        updateComponent = () => {
            const name = vm._name
            const id = vm._uid
            const startTag = `vue-perf-start:${id}`
            const endTag = `vue-perf-end:${id}`
            
            mark(startTag)
            const vnode = vm._render()
            mark(endTag)
            measure(`vue ${name} render`,startTag,endTag)
            mark(startTag)
            vm._update(vnode,hydrating)
            mark(endTag)
            measure(`vue ${name} patch`,startTag,endTag)
        }
    } else {
        updateComponent = () => {
            vm._update(vm._render(),hydrating)
        }
    }

    //we set this to vm._watcher inside the watcher's constructor
    //since the watcher's initial patch may call $forceUpdate(e.g. inside child
    //component's mounted hook),which relies on vm._watcher being already defined
    new Watcher(vm,updateComponent,noop,{
        before (){
            if(vm._isMounted){
                callHook(vm,'beforeUpdate')
            }
        }
    },true /**isRenderWatcher */)
    hydrating = false

    //manually mounted instance,call mounted on self
    //mounted is called for render-created child components in its inserted hook
    if(vm.$vnode == null){
        vm._isMounted = true
        callHook(vm,'mounted')
    }
    return vm
}
/**
 * 以上代码: 1. -->mountComponent 核心就是先调用 vm._render 方法先生成虚拟 Node,再实例化一个渲染 Watcher,
 *         在它的回调函数中会调用 updateComponent 方法,最终调用 vm._update 更新 DOM.
 *         2. -->watcher 在这里起到两个作用,一个是初始化的时候会执行回调函数,另一个是当vm 实例中的监测的数据发生变化的
 *         时候执行回调函数.
 *         3. -->函数最后判断为根节点的时候设置 vm._isMounted 为 true, 表示这个实例已经挂载了,同时执行mounted钩子函数.
 *         这里注意 vm.$vnode 表示 Vue 实例的父虚拟 Node, 所以它为null 则表示当前是根 Vue 的实例.
 */
