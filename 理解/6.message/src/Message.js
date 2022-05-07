import MessageComponent from './Message.vue';
import Vue from 'vue';
// 单例
let instance;
let getVueInstance = ()=>{
    // 此instance 是全局的
    instance = new Vue({
        render: h=>h(MessageComponent)
    }).$mount();

    // $mount() document.body.appendChild
    // options 就是当前弹出来的框的属性
    document.body.appendChild(instance.$el);
}
getVueInstance();
const Message = {
    success(options){
        // 点击弹出层, 需要将 .vue 文件挂载到 内存中

        // 就是将这个 new Vue 的操作 只做一次
        // 默认如果实例不存在, 我就创建一个实例
        !instance && getVueInstance();
        
        // 通过数据来驱动
        instance.$children[0].add(options);
    }
}

export {
    Message
}

export default {
    // _Vue 是当前的构造函数
    // 默认Vue.use 就会使用调用这个方法
    install(_Vue){
        // 1. 注册全局组件
        // 2. 注册全局指令
        // 3. 往原型上添加方法, 属性
        let $message = {}
        Object.keys(Message).forEach(key=>{
            $message[key] = Message[key]
        })
        // 一般使用新对象是, 使用拷贝对象
        _Vue.prototype.$message = $message
    }
}