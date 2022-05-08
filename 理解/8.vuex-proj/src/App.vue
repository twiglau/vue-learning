<template>
  <div id="app">
    dog age is: {{$store.state.age}}
    Mine age is: {{$store.getters.myAge}}

    <br>
    <button @click="add">更改年龄</button>
    <button @click="minus">异步年龄</button>
    <br>
    <!-- {{$store.state.a.a_s}} -->
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted() {
    console.log(this.$store);
    // setInterval(()=>{
    //   this.$store.state.age+=1; // vue 响应式原理
    // },1000)
  },
  methods: {
    add(){
      this.$store.commit('syncAdd',10); // 载荷
    },
    minus(){
      this.$store.dispatch('asyncMinus',5);
    }
  },
}
</script>

