<template>
    <ul>
        <template v-for="a in arr">
            <xxx v-if="render" :render="render" :item="a" :key="a"></xxx>
            <li v-else :key="a">{{a}}</li>
        </template>
        
    </ul>
</template>
<script>
// 函数组件有 render 函数
import xxx from './xxx';
export default {
    name:'List',
    props:['arr','render'],
    components:{xxx}
}
</script>