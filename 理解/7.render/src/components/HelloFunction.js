export default {
    props:{
        type:String
    },
    data() {
        return {
            val:'显示'
        }
    },
    methods: {
        input(e){
            console.log({e})
            this.val = e.target.value
        }
    },
    render(h) {
        console.log(h)
        // 1. h = createElement
        // 2. 创建 vnode 虚拟节点 (对象)
        // 3. render 中的 this 指代的是 => 我们当前组件的实例
        // 4. jsx 和 react 中的不太一样, jsx => js + xml html + javascript
        // 5. <> 都是 html, 如果是 js {}进行赋值

        let obj = {
            domProps:{
                innerHTML: '<h1>test inner</h1>'
            }
        }
        //3.
        return <div>
            {this.val}
            <input type="text" value={this.val} on-input={this.input}></input>
            <div {...obj}></div>
            <div domPropsInnerHTML={'<span>inner</span>'}></div>
        </div>

        //2.
        // let tag = 'h' + this.type
        // return <tag>{this.$slots.default}</tag>

        //1.
        // return h('h1',{},this.$slots.default)
    },
}