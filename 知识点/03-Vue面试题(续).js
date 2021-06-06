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
 * 31 Vue.extend作用的原理?
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