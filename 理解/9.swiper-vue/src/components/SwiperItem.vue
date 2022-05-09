<template>
    <transition>
        <div class="swiper-item" v-show="isShow" :class="{reverse}">
            
            <slot></slot>
        </div>
    </transition>
</template>
<script>
export default {
    computed:{
        isShow(){
            return this.selected === this.name
        }
    },
    props:{
        name:{
            type: String,
            required:true
        }
    },
    data(){
        return {
            selected:'',
            reverse:false
        }
    }
}
</script>
<style>
.v-enter-active,.v-leave-active {
    transition: all 1s linear;
}
.v-leave-to {
    transform: translate(-100%);
}
.v-enter {
    transform: translate(100%);
}

.v-leave-to.reverse {
    transform: translate(100%);
}
.v-enter.reverse {
    transform: translate(-100%);
}
.v-enter-active {
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
}
</style>