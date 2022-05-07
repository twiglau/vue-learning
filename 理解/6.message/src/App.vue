<template>
  <div id="app">
    <button @click="showMsg">弹出</button>
  </div>
</template>

<script>
import Vue from 'vue';
// import { Message } from './Message.js'
import Message from './Message.js'
Vue.use(Message) // use 方法使用的时候, 默认会调用内部的 Install 方法
export default {
  name: 'App',
  components: {},
  methods: {
    showMsg(){
      this.$message.success({
        message:'消息',
        duration:3000
      })
      // Message.success({
      //   message:'消息',
      //   duration:3000
      // })
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
