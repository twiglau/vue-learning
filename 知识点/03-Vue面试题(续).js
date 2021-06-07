/**
 * 27Vue.mixin的使用场景和原理?
 * 在日常的开发中,我们经常会遇到在不同的组件中经常会需要用到一些相同或者相似的代码,
 * 这些代码的功能相对独立,可以通过Vue的mixin功能抽离公共的业务逻辑,原理类似 "对象的继承",
 * 当组件初始化时会调用mergeOptions方法进行合并,采用策略模式针对不同的属性进行合并.
 * 当组件的混入对象含有同名选项时,这些选项将以恰当的方式进行 "合并".
 * 
 * 相关代码如下:
 */
export default function initMixin(Vue){
    Vue.mixin = function(mixin){
        //合并对象
        this.options = mergeOptions(this.options,mixin)
    };
}

//src/util/index.js
export const LIFECYCLE_HOOKS = [
    "beforeCreate",
    "created",
    "beforeMount",
    "mounted",
    "beforeUpdate",
    "updated",
    "beforeDestroy",
    "destroyed",
];
//合并策略
const strats = {};
//mixin核心方法
export function mergeOptions(parent,child){
    const options = {};
    //遍历父亲
    for(let k in parent){
        mergeFiled(k);
    }
    //父亲没有 儿子有
    for(let k in child){
        if(!parent.hasOwnProperty(k)){
            mergeFiled(k);
        }
    }
}

//真正合并字段方法
function mergeFiled(k){
    if(strats[k]){
        options[k] = strats[k](parent[k],child[k]);
    }else{
        options[k] = child[k] ? child[k] : parent[k];
    }
}

return options;


/**
 * 28 nextTick使用场景和原理?
 * nextTick中的回调是在下次DOM更新循环结束之后执行的延迟回调.在修改数据之后立即使用这个方法,
 * 获取更新后的DOM,主要就是采用微任务优先的方法调用异步方法去执行nextTick包装的方法.
 */

/**
 * 29 keep-alive使用场景和原理?
 * keep-alive是Vue内置的一个组件,可以实现组件缓存,当组件切换时不会当前组件进行卸载.
 * 29.1 常用的两个属性 include/exclude,允许组件有条件的进行缓存.
 * 29.2 两个生命周期activated/deactivated,用来得知当前组件是否处于活跃状态.
 * 29.3 keep-alive的中还运用了LRU(最近最少使用)算法,选择最近最久未使用的组件予以淘汰.
 */
export default {
    name:"keep-alive",
    abstract:true, //抽象组件
    props:{
        include:patternTypes, //要缓存的组件
        exclude:patternTypes, //要删除的组件
        max:[String,Number], //最大缓存数
    },
    created() {
        this.cache = Object.create(null); //缓存对象 {a:vNode,b:vNode}
        this.keys = []; //缓存组件的key集合 [a,b]
    },
    destroyed() {
        for(const key in this.cache){
            pruneCacheEntry(this.cache,key,this.keys);
        }
    },
    mounted() {
        //动态监听include exclude
        this.$watch("include",(val) => {
            pruneCache(this,(name) => matches(val,name));
        });
        this.$watch("exclude",(val) => {
            pruneCache(this,(name) => !matches(val,name));
        })
    },
    render(){
        const slot = this.$slots.default; //获取包裹的插槽默认值
        const vnode:VNode = getFirstComponentChild(slot);//获取第一个子组件
        const componentOptions: ?VNodeComponentOptions =
        vnode && vnode.componentOptions;
        if(componentOptions){
            //check pattern
            const name: ?string = getComponentName(componentOptions);
            const { include, exclude } = this;
            //不走缓存
            if (
                //not included 不包含
                (include && (!name || !matches(include,name))) ||
                //excluded 排除里面
                (exclude && name && matches(exclude,name))
            ){
                //返回虚拟节点
                return vnode;
            }

            const {cache,keys} = this;
            const key: ?string =
            vnode.key == null
              ? // same constructor may get registered as different local components
                // so cid alone is not enough (#3269)
                componentOptions.Ctor.cid + 
                (componentOptions.tag ? `::${componentOptions.tag}` : "")
              : vnode.key;

            if(cache[key]){
                vnode.componentInstance = cache[key].componentInstance;
                //make current key freshest
                remove(keys,key); //通过LRU算法把数组里面的key删掉
                keys.push(key); //把它放在数组末尾
            }else{
                cache[key] = vnode; //没找到就换存下来
                keys.push(key); //把它放在数组末尾
                //prune oldest entry //如果超过最大值就把数组第0项删掉
                if(this.max && keys.length > parseInt(this.max)){
                    pruneCacheEntry(cache,keys[0],keys,this._vnode);
                }
            }
            vnode.data.keepAlive = true; //标记虚拟节点已经被缓存
        }
    }
}

/**
 * 30 Vue.set方法原理
 * 了解Vue响应式原理的同学都知道在两种情况下修改数据Vue是不会触发视图更新的
 * 1.在实例创建之后添加新的属性到实例上(给响应式对象新增属性)
 * 2.直接更改数组下标来修改数组的值
 * 
 * Vue.set或者说是$set原理如下
 * 因为响应式数据 我们给对象和数组本身都增加了 __ob__属性,代表的是Observer实例,当给对象新增不存在的属性
 * 首先会把新的属性进行响应式的跟踪,然后会触发对象__ob__的dep收集到的watcher去更新,当修改数组索引时我们调用
 * 数组本身的splice方法去更新数组
 * 
 * 相关代码如下:
 */
export function set(target:Array | Object,key:AnalyserNode,val:any):any {
    //如果是数组,调用重写的splice方法(这样可以更新视图)
    if(Array.isArray(target) && isValidArrayIndex(key)){
        target.length = Math.max(target.length,key);
        target.splice(key,1,val);
        return val;
    }
    //如果是对象本身的属性,则直接添加即可
    if(key in target && !(key in Object.prototype)) {
        target[key] = val;
        return val;
    }
    cosnt ob = (target: any).__ob__;

    //如果不是响应式的也不需要将其定义成响应式属性
    if(!ob){
        target[key] = val;
        return val;
    }
    //将属性定义成响应式的
    defineReactive(ob.value,key,val);
    //通知视图更新
    ob.dep.notify();
    return val;
}

/**
 * 31 Vue.extend作用的原理? ---Vue组件原理
 * 官方解释: Vue.extend使用基础Vue构造器,创建一个"子类",参数是一个包含组件选项的对象.
 * 
 * 其实就是一个子类构造器,是Vue组件的核心api实现思路就是使用原型继承的方法返回了Vue的子类,并且
 * 利用mergeOptions把传入组件的options和父类的options进行了合并
 * 
 * 相关代码如下:
  */
 export default function initExtend(Vue){
     let cid = 0;//组件的唯一标识
     //创建子类继承Vue父类,便于属性扩展
     Vue.extend = function(extendOptions){
         //创建子类的构造函数,并且调用初始化方法
         const Sub = function VueComponent(options){
             this._init(options);//调用Vue初始化方法
         };
     }
     Sub.cid = cid++;
     Sub.prototype = Object.create(this.prototype); //子类原型指向父类
     Sub.prototype.constructor = Sub; //constructor指向自己
     Sub.options = mergeOptions(this.options,extendOptions);
     //合并自己的options和父类的options
     return Sub;
 }

 /**
  * 32写过自定义指令?原理是什么?
  * 指令本质上是装饰器,是vue对HTML元素的扩展,给HTML元素增加自定义功能.vue编译DOM时,
  * 会找到指令对象,执行指令的相关方法.
  * 
  * 自定义指令有五个声明周期(也叫钩子函数),分别是bind,inserted,update,componentUpdated,unbind
  * 
  * 32.1 bind:只调用一次,指令第一次绑定到元素时调用.在这里可以进行一次性的初始化设置.
  * 32.2 inserted:被绑定元素插入父节点时调用(仅保证父节点存在,但不一定已被插入文档中).
  * 32.3 update:被绑定与元素所在的模板更新时调用,而无论绑定值是否变化.通过比较更新前后
  * 的绑定值,可以忽略不必要的模板
  * 32.4 componentUpdated: 被绑定元素在模板完成一次更新周期时调用.
  * 32.5 unbind:只调用一次,指令与元素解绑时调用.
  * 
  * 原理:
  * 1. 在生成ast语法树时,遇到指令会给当前元素添加 directives属性
  * 2. 通过genDirectives生成指令代码
  * 3. 在pathc前将指令的钩子提取到cbs中,在patch过程中调用对应的钩子
  * 4. 当执行指令对应钩子函数时,调用对应指令定义的方法
  */

 /**
  * 33 Vue修饰符有哪些?
  * 
  * 33.1 事件修饰符
  * .stop 阻止事件继续传播
  * .prevent 阻止标签默认行为
  * .capture 使用事件捕获模式,即元素自身触发的事件先在此处处理,然后才交由内部元素进行处理
  * .self 只当在evnet.target是当前元素自身时触发处理函数
  * .once 事件将只会触发一次
  * .passive 告诉浏览器你不想阻止事件的默认行为.
  * 
  * 33.2 v-model的修饰符
  * .lazy 通过这个修饰符,转变为change事件再同步
  * .number 自动将用户的输入值转化为数值类型.
  * .trim 自动过滤用户输入的首尾空格.
  * 
  * 33.3 键盘事件的修饰符
  * .enter .tab .delete .esc .space .up .down .left .right
  * 
  * 33.4 系统修饰键
  * .ctrl .alt .shift .meta
  * 
  * 33.5 鼠标按钮修饰符
  * .left .right .middle 
  */

 /**
  * 34 Vue 模板编译原理
  * Vue 的编译过程就是将 template 转化为 render 函数的过程,分为三步
  * 第一步是将 模板字符串 转换成 element ASTs (解析器)
  * 第二步是对 AST 进行静态节点标记, 主要用来做虚拟DOM的渲染优化 (优化器)
  * 第三步使用 element ASTs 生成 render 函数代码字符串 (代码生成器)
  * 
  * 相关代码如下:
  */
 export function compileToFunctions(template){
     //我们需要把html字符串称为render函数
     //1.把html代码转成ast语法树, ast用来描述代码本身形成树结构 不仅可以描述html 也能描述css以及js语法
     //很多库都运用到了ast , 比如 webpack babel eslint等等
     let ast = parse(template);
     //2.优化静态节点
     //if(options.optimize !== false){
     //   optimize(ast,options);
     //}

     //3.通过ast 重新生成代码
     //我们最后生成的代码需要和render函数一样
     //类似_c('div',{id:'app'},_c('div',undefined,_v("hello"+_s(name)),_c('span',undefined,_v("world"))))
     //_c 代表创建元素 _v代表创建文本 _s代表文本Json.stringify --把对象解析成文本
     let code = generate(ast);
     //使用width语法改变作用域为this, 之后调用render函数可以使用call改变this,方便code里面的变量取值
     let renderFn = new Function(`with(this){return ${code}}`);
     return renderFn;
 }

 /**
  * 35 声明周期钩子是如何实现的
  * Vue的声明周期钩子核心实现是利用发布订阅模式先把用户传入的声明周期钩子订阅好
  * (内部采用数组的方式存储),然后在创建组件实例的过程中会一次执行对应的钩子方法(发布)
  * 
  * 相关代码如下:
  */
 export function callHook(vm,hook){
     //依次执行声明周期对应的方法
     const handlers = vm.$options[hook];
     if(handlers){
         for(let i = 0; i < handlers.length; i++){
             handlers[i].call(vm); //生命周期里面的this指向当前实例
         }
     }
 }

 //调用的时候
 Vue.prototype._init = function(options){
     const vm = this;
     vm.$options = mergeOptions(vm.constructor.options,options);
     callHook(vm,"beforeCreate"); //初始化数据之前
     //初始化状态
     initState(vm);
     callHook(vm,"created");//初始化数据之后
     if(vm.$options.el){
         vm.$mount(vm.$options.el);
     }
 };


 /**
  * 36 函数式组件使用场景和原理
  * 函数式组件与普通组件的区别
  * 1.函数式组件要在声明组件是指定 functional:true
  * 2.不需要实例化,所以没有this,this通过render函数的第二个参数context来代替
  * 3.没有生命周期钩子函数,不能使用计算属性,watch
  * 4.不能通过$emit对外暴露事件,调用事件只能通过context.listeners.click的方式调用
  *   外部传入的事件
  * 5.因为函数式组件是没有实例化的,所以在外部通过ref去引用组件时,实际引用的是HTMLElement
  * 6.函数式组件的props可以不用显示声明,所以没有在props里面声明的属性都会被自动隐式解析为prop,
  *   而普通组件所有生命的属性都解析到$attrs里面,并自动挂载到组件跟元素上面(可以通过inheritAttrs属性禁止)
  * 
  * 优点:
  * 1.由于函数式组件不需要实例化,无状态,没有声明周期,所以渲染性能要好于普通组件
  * 2.函数式组件结构比较简单,代码结构更清晰
  * 
  * 使用场景:
  * 一个简单的展示组件,作为容器组件使用,比如 router-view 就是一个函数式组件
  * "高阶组件" --- 用于接收一个组件作为函数,返回一个被包装过的组件
  * 
  * 相关代码如下:
  */
 if(isTrue(Ctor.options.functional)){
     //带有functional的属性的就是函数式组件
     return createFunctionalComponent(Ctor,propsData,data,context,children);
 }
 const listeners = data.on;
 data.on = data.nativeOn;
 installComponentHooks(data); //安装组件相关钩子
 //函数是组件没有调用此方法,从而性能高于普通组件


 /**
  * 37 能说下vue-router中常用的路由模式实现原理吗?
  * 
  * hash模式
  * 1. location.hash 的值实际就是 URL 中 # 后面的东西,它的特点在于: hash虽然出现URL中,
  * 但不会被包含在HTTP请求中,对后端完全没有影响,因此改变hash不会重新加载页面.
  * 2. 可以为hash的改变添加监听事件
  * window.addEventListener("hashchange",funcRef,false);
  * 
  * 每一次改变hash (window.location.hash),都会在浏览器的访问历史中增加一个记录,利用hash
  * 的以上特点,就可以来实现前端路由 "更新视图但不重新请求页面" 的功能了.
  * 
  * history模式
  * 利用了 HTML5 History Interface 中新增的 pushState() 和 replaceState() 方法.
  * 这两个方法应用于浏览器的历史记录站,在当前已有的back, forward, go 的基础之上,它们
  * 提供了对历史记录进行修改的功能. 这两个方法有个共同的特点: 当调用他们修改浏览器历史
  * 记录栈后,虽然当前URL改变了,但浏览器不会刷新页面, 这就为单页应用前端路由 "更新视图但不重新请求页面"
  * 提供了基础.
  */

 /**
  * 38 diff算法?
  * 03-38-1图
  */


 