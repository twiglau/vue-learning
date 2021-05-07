/**
 * 组件化,就是把页面拆分成多个组件(component),每个组件依赖的 CSS, JavaScript,模板
 * 图片等资源放在一起开发和维护.
 * 组件是资源独立的,组件在系统内部可复用,组件和组件之间可以嵌套.
 */

// Vue-cli 初始化代码
import Vue from 'vue'
import App from './App.vue'
var app = new Vue({
    el:'#app',
    //这里的h 是 createElement 方法
    render: h => h(app)
})

