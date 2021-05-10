/**
 * 在平时开发工作中,为了减少首屏代码体积,往往会把一些首屏的组件设计成异步组件,按需加载. Vue 也原生支持了
 * 异步组件的能力:
 */
Vue.components('async-example',function(resolve,reject){
    //这个特殊的 require 语法告诉 webpack
    //自动将编译后的代码分割成不同的块,
    //这些块将通过 Ajax 请求自动下载.
    require(['./my-async-component',resolve])
})
/**
 * Vue 注册的组件不再是一个对象,而是一个工厂函数,函数有两个参数 resolve 和 reject, 函数内部用 setTimeout 模拟了异步
 * 实际使用可能是通过动态请求异步组件的 JS 地址, 最终通过执行 resolve 方法,它的参数就是我们的异步组件对象.
 */

// ....