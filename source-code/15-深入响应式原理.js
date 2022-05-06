/**
 * 示例
 */
`
<div id="app" @click="changeMsg">
 {{message}}
</div>
`
var app = new Vue({
    el:'#app',
    data:{
        message:'Hello Vue!'
    },
    methods:{
        changeMsg(){
            this.message = 'Hello World!'
        }
    }
})
// 当我们去修改 this.message 的时候,模板对应的插值也会渲染成新的数据,原理是啥?

/**
 * 思考: 若不同 Vue 的话, 会如何实现需求:
 * 监听点击事件,修改数据,手动操作 DOM 重新渲染.
 * 这个过程和使用Vue 的最大区别就是多了一步 "手动操作 DOM重新渲染"
 * 1. 我需要修改哪块的DOM?
 * 2. 我的修改效率和性能是不是最优?
 * 3. 我需要对数据每一次的修改都去操作DOM?
 * 4. 我需要case by case 去写修改DOM的逻辑?
 */