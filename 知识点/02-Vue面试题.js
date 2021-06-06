/**
 * 1.MVC和MVVM区别
 * 
 * MVC
 * MVC全名是Model View Controller, 是模型(model)-视图(view)-控制器(controller)的缩写,
 * 一种软件设计典范
 * 
 * 1.1 Model(模型):是应用程序中用于处理应用程序数据逻辑的部分. 通常模型对象负责在数据库中存取数据
 * 1.2 View(视图):是应用程序中处理数据显示的部分. 通常视图是依据模型数据创建的
 * 1.3 Controller(控制器):是应用程序中处理用户交互的部分. 通常控制器负责从视图读取数据,控制用户
 *     输入,并向模型发送数据
 * 如图:02-1-1
 * 
 * MVC的思想:一句话描述就是 Controller 负责将Model的数据用View显示出来,换句话说就是在Controller
 * 里面把 Model 的数据赋值给 View.
 * 
 * MVVM
 * 
 * MVVM 新增了 VM类
 * 
 * 1.1 ViewModel层:做了两件事达到了数据的双向绑定 一是将[模型]转化成[视图],即将后端传递的数据转化成
 * 所看到的页面. 实现的方式是: 数据绑定. 二是将[视图]转化成 [模型], 即将所看到的页面转化成后端的数据.
 * 实现的方式是: DOM事件监听.
 * 如图:02-1-2
 * 
 * 整体看来,MVVM比MVC精简很多,不仅简化了业务与界面的依赖,还解决了数据频繁更新的问题,不用再用选择器操作
 * DOM元素. 因为在MVVM中, View不知道Model的存在, Model 和 ViewModel 也观察不到 View,这种低耦合模式
 * 提高代码的可重用性.
 */

/**
 * 2.为什么data是一个函数
 * 
 * 组件中的 data 写成一个函数,数据以函数返回值形式定义,这样每复用一次组件,就会返回一份新的data,类似于给
 * 每个组件实例创建一个私有的数据空间,让各个组件实例维护各自的数据. 而单纯的写成对象形式,就使得所有组件实例
 * 共用了一份data,就会造成一个变了然后全部组件会变的结果.
 */

/**
 * 3.Vue组件通讯有哪几种方式
 * 
 * 3.1 props和$emit父组件向子组件传递数据是通过prop传递的,子组件传递数据给父组件是通过$emit触发事件做到的
 * 3.2 $parent,$children获取当前组件的父组件和当前组件的子组件
 * 3.3 $attrs 和 $listeners A ->B ->C. Vue2.4开始提供了 $attrs 和 $listeners 来解决这个问题
 * 3.4 父组件中通过 provide 来提供变量,然后在子组件中通过 inject 来注入变量.(官方不推荐在实际业务中使用,但是写组件库时很常用).
 * 3.5 $refs获取组件实例
 * 3.6 eventBus兄弟组件数据传递 这种情况下可以使用事件总线的方式
 * 3.7 vuex 状态管理
 */

/**
 * 4.Vue的声明周期方法有哪些, 一般在哪一步发请求
 * 
 * 4.1 beforeCreate在实例初始化之后,数据观测(data observer) 和 event/watcher 事件配置之前被调用.
 *     在当前阶段 data, methods, computed以及watch上的数据和方法都不能被访问
 * 4.2 created实例已经创建完成之后被调用.在这一步,实例已完成以下的配置: 数据观测(data observer),属性和
 *     方法的运算, watch/event 事件回调. 这里没有 $el, 如果非要想与Dom进行交互,可以通过 vm.$nextTick 来访问Dom
 * 4.3 beforeMount在挂载开始之前被调用: 相关的render函数首次被调用.
 * 4.4 mounted在挂载完成后发生,在当前阶段,真实的Dom挂载完毕,数据完成双向绑定,可以访问到Dom节点
 * 4.5 beforeUpdate数据更新时调用,发生在虚拟DOM重新渲染和打补丁(patch)之前. 可以在这个钩子中进一步地更改状态,
 *     这不会触发附加的重渲染过程
 * 4.6 updated发生在更新完成之后,当前阶段组件Dom已完成更新.要注意的是避免在此期间更改数据,因为这可能会导致无限循环
 *     的更新,该钩子在服务器渲染期间不被调用.
 * 4.7 beforeDestroy实例销毁之前调用.在这一步,实例仍然完全可用.我们可以在这时进行善后收尾工作,比如清除计时器.
 * 4.8 destroyed Vue实例销毁后调用. 调用后, Vue实例指示的所有东西都会解除绑定,所有的时间监听器会被移除,所有的子实例也会被销毁.
 *     该钩子在服务器渲染期间不被调用.
 * 4.9 activated keep-alive专属,组件被激活时调用
 * 4.10 deactivated keep-alive专属, 组件被销毁时调用
 * 
 * 异步请求在哪一步发起?
 * 可以在钩子函数 created, beforeMount, mounted 中进行异步请求,因为在这三个钩子函数中,data已经创建,可以将服务端返回的数据
 * 进行赋值.
 * 如果异步请求不需要依赖Dom推荐在created钩子函数中调用异步请求,因为在created钩子函数中调用异步请求有以下优点:
 * 能更快获取到服务器数据,减少页面Loading时间;
 * ssr不支持beforeMount,mounted钩子函数,所以放在created中有助于一致性;
 */

/**
 * 5 v-if 和 v-show 的区别
 * 5.1 v-if 在编译过程中会被转化成三元表达式,条件不满足时不渲染此节点.
 * 5.2 v-show会被编译成指令,条件不满足时控制样式将对应节点隐藏(display:none)
 * 
 * 使用场景
 * v-if适用于在运行时很少改变条件,不需要频繁切换条件的场景
 * v-show适用于需要非常频繁切换条件的场景
 * 
 * 扩展补充: display:none, visibility:hidden 和 opacity:0之间的区别?
 * 三者共同点都是隐藏.不同点:
 * 5.3 是否占据空间
 * display:none,隐藏之后不占位置; visibility:hidden, opacity:0,隐藏后任然占据位置.
 * 5.4 子元素是否继承
 * display:none -- 不会被子元素继承,父元素都不存在了,子元素也不会显示出.
 * visibility:hidden -- 会被子元素继承,通过设置子元素visibility:visible来显示子元素.
 * opacity:0 -- 会被子元素继承,但是不能设置子元素opacity:0来重新显示.
 * 5.5 时间绑定
 * display:none的元素都已经不再页面存在了,因此无法触发它绑定的事件
 * visibility:hidden不会触发它上面绑定的事件
 * opacity:0元素上面绑定的事件是可以触发的.
 * 5.6 过渡动画
 * transition对于display是无效的
 * transition对于visibility是无效的
 * transition对于opacity是有效
 */

/**
 * 6 说说vue内置指令
 * 如图02-6-1
 */

/**
 * 7 怎样理解Vue的单向数据流
 * 数据总是从父组件传到子组件,子组件没有权利修改父组件传过来的数据,只能请求父组件对原始数据进行修改.
 * 这样会防止从子组件意外改变父级组件的状态,从而导致你的应用的数据流向难以理解.
 * 注意:
 * 子组件直接用v-model绑定父组件传过来的prop这样是不规范的写法,开发环境会报警告
 * 
 * 如果实在要改变父组件的prop值,可以再data里面定义一个变量并用 prop的值初始化它之后用 $emit 通知父组件去修改
 */

/**
 * 8 computed 和 watch 的区别和运用的场景
 * computed是计算属性,依赖其他属性计算值,并且computed的值有缓存,只有当计算值变化才会返回内容,它可以设置getter和setter.
 * 
 * watch监听到值的变化就会执行回调,在回调中可以进行一些逻辑操作.
 * 
 * 计算属性一般用在模板渲染中,某个值是依赖了其他的响应式对象甚至是计算属性计算而来; 而侦听属性适用于观测某个值的变化去完成一段
 * 复杂的业务逻辑.
 */

/**
 * 9 v-if 与 V-for 为什么不建议一起使用
 * v-for和v-if不要在同一个标签中使用,因为解析时先解析v-for再解析v-if,如果遇到需要同时使用时可以考虑写成计算属性的方式.
 */

/**
 * 中等 <<<<<<<<<<<<<============================>>>>>>>>>>>>>
 */

/**
 * 10 Vue2.0响应式数据的原理
 * 整体思路是数据劫持+观察者模式
 * 
 * 对象内部通过defineReactive方法,使用Object.defineProperty将属性进行劫持(只会劫持已经存在的属性),数组则是通过重写数组方法
 * 来实现. 当页面使用对应属性时,每个属性都拥有自己的dep属性,存放他所依赖的watcher(依赖收集),当属性变化后会通过自己对象的watcher去
 * 更新(派发更新).
 */

//相关代码如下.
class Observer {
    //观测值
    constructor(value){
        this.walk(value);
    }
    walk(data){
        //对象上的所有属性依次进行观测
        let keys = Object.keys(data);
        for(let i = 0; i < keys.length; i++){
            let key = keys[i];
            let value = data[key];
            defineReactive(data,key,value);
        }
    }
}
//Object.defineProperty数据劫持核心,兼容性在ie9以及以上
function defineReactive(data,key,value){
    observe(value);//递归关键
    // ---如果value还是一个对象会继续走一遍defineReactive层层遍历一直到value不是对象才停止
    //思考? 如果Vue数据嵌套层级过深 >>性能会受影响
    Object.defineProperty(data,key,{
        get(){
            console.log("获取值");
            //需要做依赖收集过程,这里代码没写出来
            return value;
        },
        set(newValue){
            if(newValue === value) return;
            console.log("设置值");
            //需要做派发更新过程,这里代码没写出来
            value = newValue;
        },
    });
}
export function observe(value){
    //如果传过来的是对象或者数组 进行属性劫持
    if(
        Object.prototype.toString.call(value) === "[object Object]" ||
        Array.isArray(value)
    ){
        return new Observer(value);
    }
}

/**
 * 11 Vue如何检测数组变化
 * 
 * 数组考虑性能原因没有用 defineProperty 对数组的每一项进行拦截,而是选择对7种数组
 * (push,shift,pop,splice,unshift,sort,reverse) 方法进行重写 (AOP切片思想)
 * 
 * 所以在Vue中修改数组的索引和长度是无法监控到的.需要通过以上7种变异方法修改数组才会
 * 触发数组对应的watcher进行更新
 * 
 * 相关代码如下
 */

//src/obserber/array.js
//先保留数组原型
const arrayProto = Array.prototype;
//然后将arrayMethods继承自数组原型
//这里是面向切片编程思想(AOP) ---不破坏
export const arrayMethods = Object.create(arrayProto);
let methodsToPatch = [
    "push",
    "pop",
    "shift",
    "unshift",
    "splice",
    "reverse",
    "sort",
];
methodsToPatch.forEach((method) => {
    arrayMethods[method] = function (...args){
        //这里保留原型方法的执行结果
        const result = arrayProto[method].apply(this,args);
        //这句话是关键
        //this代表的就是数据本身,比如数据是{a:[1,2,3]} 那么我们使用a.push(4)
        //this就是a,  ob就是 a.__ob__ 这个属性就是上段代码增加的, 代表的是该数据已经被响应式
        //观察过了指向Observer实例
        const ob = this.__ob__;

        //这里的标志就是代表数组有新增操作
        let inserted;
        switch(method){
            case "push":
            case "unshift":
                inserted = args;
                break;
            case "splice":
                inserted = args.slice(2);
            default:
                break;
        }
        //如果有新增的元素 inserted是一个数组 调用Observer实例的observeArray对数组每一项进行观测
        if(inserted) ob.observeArray(inserted);
        //之后咱们还可以在这里检测到数组改变了之后从而触发视图更新的操作
        return result;
    }
})

/**
 * 12 Vue3.0用过吗? 了解多少?
 * 
 * 12.1 响应式原理的改变Vue3.x使用Proxy取代Vue2.x版本的Object.defineProperty
 * 12.2 组件选项声明方式Vue3.x使用Composition API setup 是 Vue3.x新增的一个选项,他是组件使用
 *      Composition API的入口.
 * 12.3 模板语法变化slot具名插槽语法 自定义指令v-model升级
 * 12.4 其他方面的更改 Suspense 支持 Fragment (多个根节点) 和 Protal (在 dom 其他部分渲染组件内容)组件,
 *      针对一些特殊的场景做了处理. 基于treeshaking优化, 提供了更多的内置功能.
 */

/**
 * 13 Vue3.0和2.0的响应式原理区别
 * 
 * Vue3.x改用Proxy替代Object.defineProperty,因为 Proxy 可以直接监听对象和数组的变化,并且有多大13种拦截方法.
 */
//相关代码如下
import { mutableHandlers} from './baseHandlers'; //代理相关逻辑
import { isObject } from './util'; //工具方法
export function reactive(target){
    //根据不同参数创建不同响应式的对象
    return createReactiveObject(target,mutableHandlers);
}
function createReactiveObject(target,baseHandlers){
    if(!isObject(target)){
        return target;
    }
    const observed = new Proxy(target,baseHandler);
    return observed;
}
function createGetter(){
    return function get(target,key,receiver){
        //对获取的值进行映射
        const res = Reflect.get(target,key,receiver);
        console.log("属性获取",key);
        if(isObject(res)){
            //如果获取的值是对象类型,则返回当前对象的代理对象
            return reactive(res);
        }
        return res;
    };
}
function createSetter(){
    return function set(target,key,value,receiver){
        const oldValue = target[key];
        const hadKey = hasOwn(target,key);
        const result = Reflect.set(target,key,value,receiver);
        if(!hadKey){
            console.log("属性新增",key,value);
        }else if(hasChanged(value,oldValue)){
            console.log("属性值被修改",key,value);
        }
        return result;
    };
}
export const mutableHandlers = {
    get, //当获取属性时调用此方法
    set, //当修改属性时调用此方法
}

/**
 * 14. Vue的父子组件生命周期钩子函数执行顺序
 * 14.1 加载渲染过程
 * 父 beforeCreate ->父created ->父beforeMount ->子beforeCreate
 * ->子beforeMount ->子mounted ->父mounted
 * 
 * 14.2 子组件更新过程
 * 父beforeUpdate ->子beforeUpdate ->子updated ->父updated
 * 
 * 14.3 父组件更新过程
 * 父beforeUpdate ->父updated
 * 
 * 14.4 销毁过程
 * 父beforeDestroy ->子beforeDestroy ->子destroyed ->父destroyed
 */

/**
 * 15 虚拟DOM是什么? 有什么优缺点?
 * 由于在浏览器中操作DOM是昂贵的.频繁的操作DOM,会产生一定的性能问题.这就是虚拟Dom的产生原因.
 * Vue2的Virtual DOM借鉴了开源库snabbdom的实现. Virtual DOM本质就是用一个原生的JS对象去
 * 描述一个DOM节点,是对真实DOM的议程抽象.
 * 
 * 优点:
 * 1,保证性能下限: 框架的虚拟DOM需要适配任何上层APi可能产生的操作,它的一些DOM操作的实现必须是
 * 普适的,所以它的性能并不是最优的; 但是比起粗暴的DOM操作性能要好很多,因此框架的虚拟DOM至少可以
 * 保证在你不需要手动优化的情况下,依然可以提供还不错的性能,即保证性能的下限;
 * 2.无需手动操作DOM: 我们不再需要手动去操作DOM;只需要写好 View-Model 的代码逻辑,框架会根据虚拟DOM
 * 和数据双向绑定,帮我们以可预期的方式更新视图,极大提高我们的开发效率;
 * 3.跨平台:虚拟DOM本质上是 JavaScropt对象,而DOM与平台强相关,相比之下虚拟DOM可以进行更方便地跨平台
 * 操作,例如服务器渲染, weex开发等等.
 * 
 * 缺点:
 * 1.无法进行极致优化:虽然虚拟DOM+合理的优化,足以应对绝大部分应用的性能需求,但在一些性能要求极高的应用
 * 中虚拟DOM无法进行针对性的极致优化.
 * 2.首次渲染大量DOM时,由于多了一层虚拟DOM的计算,会比innerHTML插入慢.
 * 
 */

/**
 * 16 v-model原理
 * 
 * v-model是一个语法糖
 * v-model在内部为不同的输入元素使用不同的property并抛出不同的事件.
 * 
 * 16.1 text和textarea元素使用value property 和 input事件;
 * 16.2 checkbox 和 radio 使用checked property 和 change事件;
 * 16.3 select字段将value作为prop并将change作为事件.
 * 
 * 注意:对于需要使用输入法(如中文,日,韩文等)的语言,会发现v-model不会在输入法组合文字过程中得到更新.
 */
//在普通标签上
`
<input v-model="sth"/>
<input v-bind:value="sth" v-on:input="sth = $event.target.value"></input>

`

//在组件上
`
<currency-input v-model="pirce"></currency-input>
<currency-input :value="price" @input="price = arguments[0]"></currency-input>
`
//子组件定义
Vue.component('currency-input',{
    template:`
    <span>
    <input
     ref = 'input'
     :value = "value"
     @input = "$emit('input',$event.target.value)"
    </span>
    `,
    props:['value'],
})

/**
 * 17 v-for为什么要加key?
 * 如果不使用Key, Vue会使用一种最大限度减少动态元素并且尽可能的尝试就地 修改/复用 相同类型元素的算法.
 * key 是为Vue中 vnode 的唯一标记, 通过这个key, 我们的diff操作可以更准确,更快速
 * 
 * 更准确: 因为带key就不是就地复用了,在sameNode 函数 a.key === b.key 对比中可以避免就地复用的情况,
 *        所以会更加准确.
 * 
 * 更快速: 利用key的唯一性生成map对象来获取对应节点,比遍历方式更快.
 */

//相关代码如下

//判断两个vnode的标签和key是否相同,如果相同,就可以认为是同一节点就地复用
function isSameVnode(oldVnode,newVnode){
    return oldVnode.tag === newVnode.tag && oldVnode.key === newVnode.key;
}

//根据key来创建老的儿子的index映射表,类似 {'a':0,'b':1} 代表为 'a'的节点
//在第一个位置 key 为 'b' 的节点在第二个位置
function makeIndexByKey(children){
    let map = {};
    children.forEach((item,index) => {
        map[item.key] = index;
    });
    return map;
}
//生成的映射表
let map = makeIndexByKey(oldCh);

/**
 * 18 Vue时间绑定原理
 * 原生事件绑定是通过 addEventListener绑定给真实元素的, 组件事件绑定是通过Vue自定义的 $on
 * 实现的, 如果要在组件上使用原生事件,需要加上.native修饰符,这样就相当于在父组件中把子组件当做
 * 普通html标签,然后加上原生事件.
 * 
 * $on,$emit是基于发布订阅模式的,维护一个事件中心, on的时候将事件按名称存在事件中心里,称之为
 * 订阅者,然后emit将对应的时间进行发布,去执行事件中心里的对应的监听器.
 */

/**
 * 19 vue-router路由钩子函数是什么? 执行顺序是?
 * 路由钩子的执行流程,钩子函数种类有: 全局守卫,路由守卫,组件守卫
 * 
 * 完整的导航解析流程:
 * 19.1 导航被触发
 * 19.2 在失活的组件里调用 beforeRouteLeave守卫
 * 19.3 调用全局的beforeEach守卫
 * 19.4 在重用的组件里调用 beforeRouteUpdate守卫(2.2+版本).
 */