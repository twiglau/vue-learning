<template>
    <div>
        <div v-for="layer in layers" :key="layer.id">
            {{layer.message}}
        </div>
    </div>
</template>
<script>
export default {
    // 每次用户点击按钮时, 都是增加数据. 自动 渲染到视图上
    data(){
        return { layers:[] }
    },
    mounted() {
        this.id = 0;
    },
    methods: { // 我要提供方法, 给外界去调用
        add(options){
            // 增加一个序号, 时间到了, 需要根据序号将它移除掉
            let layer = {...options,id:++this.id}
            this.layers.push(layer);
            layer.timer = setTimeout(()=>{
                this.remove(layer);
            },options.duration);
        },
        remove(layer){
            clearTimeout(layer.timer);
            this.layers = this.layers.filter(item=>layer.id !== item.id);
        }
        
    },
}
</script>