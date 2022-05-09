<template>
    <div class="swiper" 
    @mouseenter="mouseenter" 
    @mouseleave="mouseleave"
    @touchstart="touchstart"
    @touchmove="touchmove"
    @touchend="touchend"
    >
        <div class="viewport">
        <slot></slot>
        </div>
        <div class="dots">
            <span 
            v-for="(item,index) in len" 
            :key="index" 
            :class="{active:active == index}"
            @click="select(index)"
            >
                {{item}}
            </span>
        </div>
        <div class="btn-list">
            <button @click="select(active-1)">左边</button>
            <button @click="select(active+1)">右边</button>
        </div>
    </div>
</template>
<script>
export default {
    props:{
        autoPlay:{
            type:Boolean,
            default: true
        },
        value:{
            type: String,
            default:''
        }
    },
    data(){
        return { currentSelected:'',len:0}
    },
    watch:{
        value(){
            this.showChild();
        },
    },
    computed:{
        active(){
            return this.names.indexOf(this.currentSelected)
        }
    },
    mounted() {
        // 不放到 data 里面, 并不会 observer 该属性
        this.names = this.$children.map(child=>child.name)
        this.len = this.names.length; // 获取儿子节点的个数
        // 1. 只执行一次
        this.showChild() // 显示默认的节点
        // 2. 自动轮播
        this.run();
        // 3. 控制动画的方向
        // 记录当前的值
        this.prevPosition = this.active;

    },
    methods: {
        select(newIndex){
            // 当选择时,记录
            this.prevPosition = this.active

            if(newIndex === this.names.length) newIndex = 0;
            if(newIndex === -1) newIndex = this.names.length - 1;
            this.$emit('input', this.names[newIndex]);
        },
        run(){
            if(!this.autoPlay) return;
            this.timer = setInterval(()=>{
                // 目标 把索引往后调整 , 把结果触发给外面
                // 确定 当前是第几个
                let index = this.active;
                let newIndex = index + 1;
                this.select(newIndex)
            },3000);
        },
        showChild(){
            // 切换显示组件

            // 0. 需要获取当前从谁开始, 从哪个name属性开始
            this.currentSelected = this.value || this.$children[0].name
            // 1. 让对应的儿子显示, 其他则隐藏
            this.$children.forEach(vm => {
                this.$nextTick(()=>{
                   // 我们需要更改完毕: 是正向还是反向. 然后再去更新视图
                   vm.selected = this.currentSelected;
                })

                // 要跟儿子说, 你是正这走,反着走
                let reverse = this.prevPosition > this.active? true:false;
                // 和 子节点说: 是正还是反
                vm.reverse = reverse;
                // 考虑临界值的问题
                if(this.timer){
                    // 无缝的时候
                    if(this.prevPosition == 0 && this.active == this.len - 1){
                        vm.reverse = true
                    }
                    if(this.prevPosition == this.len - 1 && this.active == 0){
                        vm.reverse = false
                    }
                }
            })
        },
        mouseenter(){
            clearInterval(this.timer)
            this.timer = null;
        },
        mouseleave(){
            // 如果有 timer 表示已经触发
            if(!this.timer){
                this.run()
            }
        },
        touchstart(e){
            console.log('开始');
            this.mouseenter(); // 停止滚动
            this.startX = e.touches[0];
        },
        touchmove(){
            console.log('移动');
        },
        touchend(e){
            console.log('结束');
            let endX = e.changedTouches[0].clientX;
            let distance = endX - this.startX;
            if(distance < 0){
                console.log('左边')
                this.select(this.active + 1)
            }else{
                console.log('右边')
                this.select(this.active - 1)
            }
            this.run(); // 当位置变化后,继续滚动
        }
    },
}
</script>
<style>
.swiper {
    margin:0 auto;
    border: 2px solid deepskyblue;
}
.viewport {
    position: relative;
    overflow: hidden;
    height: 200px;
}
.dots {
    display: flex;
    justify-content: center;
}
.dots  span {
    cursor: pointer;
    width: 30px;
    height: 30px;
    text-align: center;
    line-height: 30px;
    border-radius: 50%;
    border: 1px solid red;
    margin: 0 10px;
}
.active {
    background: red;
    color: white;
}
</style>