<template>
  <div class="hello">
    <h1> <slot></slot> </h1>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    type: String
  },
  //1. 如果 template 存在, 就不会调用 render 函数
  //2. 希望只提供 render 函数 而不再使用 template
  //3. 2中提到的组件,就可以封装成函数组件
  render(h) {
    return h('h1',{},'你好')
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
