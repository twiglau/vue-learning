let Vue;
const forEach = (obj, cb) => { 
    //迭代对象的
    Object.keys(obj).forEach(key => {
        cb(key, obj[key]);
    })
}
const installModule = (store, rootState, path, rootModule)=>{
    if(path.length > 0){
        // 儿子要找到爸爸, 将自己的状态 放到上面
        let parent = path.slice(0,-1).reduce((root, current)=>{
            return root[current]
        }, rootState);
        // 问题: vue 不能在对象上增加不存在的属性, 否则不会导致视图更新
        Vue.set(parent, path[path.length-1], rootModule.state);
        
    }
    let getters = rootModule._rawModule.getters;
    if(getters){
        forEach(getters, (getterName, fn)=>{
            Object.defineProperty(store.getters, getterName, {
                get(){
                    // 让getter执行当前自己的状态, 传入
                    return fn(rootModule.state);// 让对应的函数执行
                }
            })
        })
    }
    let mutations = rootModule._rawModule.mutations;
    if(mutations){
        forEach(mutations, (mutationName, fn)=>{
            let mutations = store.mutations[mutationName] || []
            mutations.push((payload)=>{
                fn(rootModule.state, payload);
                // 发布, 让所有订阅一次执行
                store._subscribes.forEach(fn=>fn({type:mutationName,payload}, rootState));
            })
            store.mutations[mutationName] = mutations;
        })
    }
    let actions = rootModule._rawModule.actions;
    if(actions){
        forEach(actions, (actionName, fn)=>{
            let actions = store.actions[actionName] || []
            actions.push((payload)=>{
                fn(store, payload);
            })
            store.actions[actionName] = actions;
        })
    }

    // 挂载儿子
    forEach(rootModule._children, (moduleName,module)=>{
        installModule(store, rootState, path.concat(moduleName), module)
    })
}
class ModuleCollection {
    constructor(options){
        this.register([], options); // 注册模块, 将模块注册成 树模块
    }
    register(path, rootModule){
        let module = { // 将模块格式化
            _rawModule: rootModule,
            _children: {},
            state: rootModule.state
        }
        if(path.length == 0){
            // 如果是根模块, 将这个模块
            this.root = module
        }else{
            // 递归都用 reduce 方法 [a]
            let parent = path.slice(0,-1).reduce((root,current)=>{
                return root._children[current]
            },this.root)
            parent._children[path[path.length-1]] = module
        }
        // 看当前模块 是否有 modules
        if(rootModule.modules){
            // 如果有 modules 开始重新再次注册
            forEach(rootModule.modules, (moduleName, module)=>{
                this.register(path.concat(moduleName),module)
            })
        }

    }
}
// new Vuex.Store
// $store.state.age
class Store {
    constructor(options = {}){
        // 将用户的状态放到了 store 中
        this.s = new Vue({ // Vuex 的核心: 定义了响应式变化, 数据更新,视图就会更新
            data(){
                return { state: options.state}
            }
        })
        this.getters = {};
        this.mutations = {};
        this.actions = {};
        this._modules = new ModuleCollection(options);
        this._subscribes = [];
        // 递归将结构进行分类
        // this 整个 store
        // this.state 当前的根状态
        // [] 为了递归来创建的
        // this._modules.root 从根模块开始安装
        installModule(this, this.state, [], this._modules.root);
        // let getters = options.getters;
        // // 计算属性
        // forEach(getters,(getterName,fn)=>{
        //     Object.defineProperty(this.getters,getterName,{
        //         get:()=>{
        //             return fn(this.state)
        //         }
        //     })
        // });
        // let mutations = options.mutations; // 获取所有的同步的更新操作方法
        
        // forEach(mutations,(mutationName,fn)=>{
        //     this.mutations[mutationName] = (payload)=>{
        //         // 内部的第一个参数是 状态
        //         fn(this.state, payload)
        //     }
        // })
        // let actions = options.actions;
        // forEach(actions, (actionName, fn)=>{
        //     this.actions[actionName] = (payload)=>{
        //         fn(this, payload);
        //     }
        // })
        // 把数据 格式化成一个想要的树 结构
        options.plugins.forEach(plugin=>plugin(this));
    }
    subscribe(fn){
        this._subscribes.push(fn);
    }
    // 提交更改 会在当前的 store 上, 找到对应的函数执行
    commit = (mutationName, payload) =>{ // 保证 this 指向
        this.mutations[mutationName].forEach(fn => fn(payload))
        // this.mutations[mutationName](payload)
    }
    dispatch = (actionName, payload)=>{
        // 源码里有一个变量
        // 来控制是否是通过 mutation 来更新状态的
        this.actions[actionName].forEach(fn => fn(payload))
    }

    get state(){// 类的属性访问器
        return this.s.state
    }
}
const install = (_Vue)=>{
    Vue = _Vue; // vue 的构造函数
    // vue的组件渲染顺序
    Vue.mixin({
        //创建之前会被执行
        beforeCreate() {
            //注意: 没有将 $store 放在原型上
            console.log('mixin beforeCreate')
            // 我需要拿到store, 给每个组件都增加 $store 属性
            if(this.$options && this.$options.store){
                // 为根实例, 给根实例增加 $store 属性
                this.$store = this.$options.store;
            }else{
                // 有可能单独创建了一个实例, 没有父亲, 那就无法获取到 store 属性
                this.$store = this.$parent && this.$parent.$store
            }
        },
    })
}

export default {
    // 给用户提供一个 install 方法, 外部使用 use 默认会调用
    install,
    Store
}

// 模块
// 源码中, 会将 当前用户传递的内容, 进行格式化
// let root = {
//     _raw: options,
//     _children: {
//         a:{
//             _raw:{},
//             _children:{},
//             state: { a_s: 1}
//         },
//         b:{}
//     },
//     state:options.state
// }

// 命名空间
// 计算出命名空间后, 给所有属性添加命名空间即可实现
// let module = store.modules.root;
// let namespace = path.reduce((space, current)=>{
//     module = module._children[current];
//     return space + (module.namespaced?current + '/':'')
// })