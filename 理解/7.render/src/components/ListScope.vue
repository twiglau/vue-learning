<template>
    <ul>
        <template v-for="a in arr">
            <!-- 每次循环都会产生作用域 -->
            <slot :a="a" b="1">
               <li :key="a">{{a}}</li>
            </slot>
            <slot name="back" :x="a"></slot>
        </template>
        
    </ul>
</template>
<script>
export default {
    name:'List',
    props:['arr']
}
</script>