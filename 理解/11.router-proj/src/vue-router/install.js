
// 安装插件, 这个插件应该依赖于 vue

import RouterView from './components/view';
export let _Vue;
// 参数Vue 就是 vue 的构造函数
export default function install(Vue){
    _Vue = Vue;
    // 把用户注入的 router 属性
    // Vue.mixin 主要干了一件事: 在所有组件上都增加了 _routerRoot 属性
    Vue.mixin({
        beforeCreate() { // 深度优先 [beforeCreate, beforeCreate]
            if(this.$options.router){
                // 为根实例
                this._routerRoot = this;
                this._router = this.$options.router;
                this._router.init(this);

                // 响应是视图变化.
                Vue.util.defineReactive(this, '_route',this._router.history.current);
            }else{
                this._routerRoot = this.$parent && this.$parent._routerRoot;
                // this._router = this._routerRoot._router;
            }
            console.log('mixin before create')
        },
    })
    Object.defineProperty(Vue.prototype, '$route',{
        // $route 上 都是属性: current, path, matched
        get(){
            return this._routerRoot._route
        }
    })
    Object.defineProperty(Vue.prototype, '$router',{
        // 拿到router属性
        get(){
            return this._routerRoot._router;
        }
    })
    // 1. 注册全局属性 $route $router
    // 2. 注册全局指令 v-scroll ...
    // 3. 注册全局的组件 router-view router-link
    Vue.component('RouterView', RouterView);
}
