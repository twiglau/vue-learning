/**
 * src
 * -------compiler    #编译相关
 * -------core        #核心代码
 * -------platforms   #不同平台的支持
 * -------server      #服务端渲染
 * -------sfc         #.vue 文件解析
 * -------shared      # 共享代码
 */

/**
 * 1. Vue.js 源码构建
 * 1.1 构建脚本
 * 1.2 构建过程
 *     对于单个配置,它是遵循 Rollup 的构建规则的,entry 属性表示构建的入口JS文件地址
 *     dest 属性表示构建后的JS文件地址, format 属性表示构建的格式, cjs 表示构建出来的
 *     文件遵循 CommonJS 规范, es 表示构建出来的文件遵循 ES Module 规范, umd 表示构建出来
 *     的文件遵循 UMD 规范
 */

/**
 * 2. Runtime Only VS Runtime+Compiler
 *    通常我们利用vue-cli 去初始化我们的 Vue.js项目的时候会询问 我们用 Runtime Only 版本的还是
 *    Runtime+Compiler版本, 
 * 
 * 2.1Runtime Only
 *    我们在使用Runtime Only版本的Vue.js的时候,通常需要借助如webpack 的vue-loader 工具把.vue文件
 *    编译成JavaScript,因为是在编译阶段做的,所以它只包含运行时的Vue.js代码,因此代码体积也会更轻量.
 * 
 * 2.2Runtime+Compiler
 *    我们如果没有对代码做预编译,但又使用了Vue的template属性并传入一个字符串,则需要在客户端编译模板:
 */

//2.2.1 需要编译器的版本
new Vue({
    template:'<div>{{hi}}</div>'
})
//2.2.2 这种情况不需要
new Vue({
    render (h) {
        return h('div',this.hi)
    }
})