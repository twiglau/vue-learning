<template>
  <div id="app">
    <hello-world type="1"><span>slot1</span> </hello-world>
    <hello-function type="1"> <span>helloworld</span> </hello-function>
    <!-- 问题: 用户无法自定义列表中的内容 -->
    <list :arr="[1,2,3,4]" :render="render"></list>
    <list-scope :arr="[1,2,3,4]">
      <!-- 希望拿到内部每次循环的结果 -->
      <!-- 新用法: v-slot="{a,b}" -->
      <template slot-scope="{a,b}">
        <span style="backgroundColor:red;">{{a}} : {{b}}</span>
      </template>
      <template v-slot:back="backInfo">
        <li>{{backInfo.x}}</li>
      </template>
    </list-scope>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import HelloFunction from './components/HelloFunction'
import List from './components/List.vue'
import ListScope from './components/ListScope.vue'
export default {
  name: 'App',
  components: {
    HelloWorld,
    HelloFunction,
    List,
    ListScope
  },
  methods: {
    render(h, item){// jsx 语法默认要使用这个 h 变量
       console.log(h)
       return <span>{item}</span>
    }
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
