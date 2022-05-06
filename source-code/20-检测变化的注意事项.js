/**
 * 1. 对象添加属性:
 * 对于使用 Object.defineProperty 实现响应式的对象,当我们去给这个对象添加一个新的属性的时候,
 * 是不能够触发它的 setter的.
 */
var vm = new Vue({
    data:{
        a:1
    }
})
//vm.b 是非响应的
vm.b = 2
//但是以上添加新属性的场景我们在平时开发中会经常遇到, Vue 为了解决这个问题,定义了一个全局 API Vue.set 方法
//在  src/core/global-api/index.js 中初始化:
Vue.set = set
//set 方法定义在 src/core/observer/index.js 中:

/**
 * Set a property on an object,Adds the new property and triggers change notification
 * if the property doesn't already exist.
 */
export function set(target: Array<any> | Object,key:any,val:any): Any {
    if(process.env.NODE_ENV !== 'production' && (isUndef(target)) || isPrimitive(target)){
        warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target:any)}`)
    }
    if(Array.isArray(target) && isValidArrayIndex(key)){
        target.length = Math.max(target.length,key)
        target.splice(key,1,val)
        return val
    }
    if(key in target && !(key in Object.prototype)){
        target[key] = val
        return val
    }
    const ob = (target: any).__ob__
    if(target._isVue || (ob && ob.vmCount)){
        process.env.NODE_ENV !== 'production' && warn(
            'Avoid adding reactive properties to a Vue instance or its root $data ' +
            'at runtime - declare it upfront in the data option.'
        )
        return val
    }
    if(!ob){
        target[key] = val
        return val
    }
    defineReactive(ob.value,key,val)
    ob.dep.notify()
    return val
}
/**
 * set 方法接收3个参数, target 可能是数组或者是普通对象, key 代表的是数组的下标或者是对象的键值, val 代表添加的值.
 * 1.如果 target 是数组且key 是一个合法的下标,则之前通过 splice 去添加进数组然后返回
 * 2.注意: splice 其实已经不仅仅是原生数组的 splice 了.
 * 3.然后判断 key 已经存在于 target 中,则直接赋值返回,因为这样的变化是可以观测到了.
 * 4.接着再获取到 target.__ob__ 并赋值给 ob
 * 5.之前分析过它是在 Observer 的构造函数执行的时候初始化的,表示 Observer 的一个实例,如果它不存在,则说明 target不是
 *   一个响应式的对象,则直接赋值并返回.
 * 6.最后通过 defineReactive(ob.value,key,val) 把新添加的属性变成响应式对象, 再通过 ob.dep.notify()手动的触发依赖通知.
 */
export function defineReactive(
    obj:Object,
    key:string,
    val:any,
    customSetter?: ?Function,
    shallow?: boolean
){
    // ...
    let childOb = !shallow && observe(val)
    Object.defineProperty(obj,key,{
        enumerable:true,
        configurable:true,
        get: function reactiveGetter(){
            const value = getter ? getter.call(obj) : val
            if(Dep.target){
                dep.depend()
                if(childOb){
                    childOb.dep.depend()
                    if(Array.isArray(value)){
                        dependArray(value)
                    }
                }
            }
            return value
        },
        // ...
    })
}
// 在 getter 构成中判断了 childOb, 并调用了 childOb.dep.depend() 收集了依赖,这就是为什么执行 Vue.set 的时候通过
// ob.dep.notify() 能够通知到 watcher,从而让添加新的属性到对象也可以检测到变化.
// 这里如果 value 是个数组, 那么就通过 dependArray 把数组每个元素也去做依赖收集.

/**
 * 2. 数组, Vue 也是不能检测到以下变动的数组:
 * 
 * -> 当利用引索值直接设置一个项时,例如: vm.items[indexOfItem] = newValue
 * -> 当修改数组的长度时,例如: vm.items.length = newLength
 * 对于第一种情况,可以使用: Vue.set(example1.items,indexOfItem,newValue);
 * 对于第二种情况,可以使用: vm.items.splice(newLength).
 */

// 刚才分析到, 对于 Vue.set 的实现,当 target 是数组的时候,也是通过 target.splice(key,1,val) 来添加的,那么这个的
// splice 到底做了什么,能让添加的对象变成响应式的呢?
//在通过 observe 方法去观察对象的时候会实例化 Observer, 在它的构造函数中是专门对数组做了处理,在 src/core/observer/index.js中:
export class Observer {
    constructor (value: any){
        this.value = value
        this.dep = new Dep()
        this.vmCount = 0
        def(value,'__ob__',this)
        if(Array.isArray(value)){
            //首先获取 augment, 这里的 hasProto 实际上就是判断对象中是否存在 __proto__,
            //如果存在则 augment 指向 protoAugment,否则指向 copyAugment.
            const augment = hasProto? protoAugment : copyAugment
            augment(value,arrayMethods,arrayKeys)
            this.observeArray(value)
        }else{
            //...
        }
    }
}
//以下是 protoAugment, copyAugment 两个函数的定义:
/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment(target, src:Object,keys:any){
    target.__proto__ = src
}
/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */
function copyAugment(target:Object,src:Object,keys:Array<string>){
    for(let i = 0; l = keys.length; i < l; i++){
        const key = keys[i]
        def(target,key,src[key])
    }
}

/**
 * protoAugment 方法是直接把 target.__proto__ 原型直接修改为 src, 而 copyAugment 方法
 * 是遍历keys, 通过def, 也就是 Object.defineProperty 去定义它自身的属性值.对于大部分
 * 现代浏览器都会走到 protoAugment, 那么它实际上就把 value 的原型指向了 arrayMethods,
 * arrayMethods的定义在 src/core/observer/array.js 中:
 */
import { def } from '../util/index'
const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)
const methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
]
/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method){
    //cache original method
    const original = arrayProto[method]
    def(arrayMethods,method,function mutator (...args) {
        const result = original.apply(this,args)
        const ob = this.__ob__
        let inserted
        switch(method){
            case 'push':
            case 'unshift':
                inserted = args
                break
            case 'splice':
                inserted = args.slice(2)
                break
        }
        if(inserted) ob.observeArray(inserted)
        // notify change
        ob.dep.notify()
        return result
    })
})

