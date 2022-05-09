<template>
  <div id="app">
      <Swiper v-model="selected">
        <swiper-item name="box1">
          <div class="content" style="background-color:orange;">内容1</div>
        </swiper-item>
        <swiper-item name="box2">
          <div class="content" style="background-color:red;">内容2</div>
        </swiper-item>
        <swiper-item name="box3">
          <div class="content" style="background-color:blue;">内容3</div>
        </swiper-item>
      </Swiper>
  </div>
</template>

<script>
import SwiperItem from './components/SwiperItem.vue'
import Swiper from './components/Swiper.vue'
export default {
  name: 'App',
  components: {SwiperItem,Swiper},
  data(){
    return {
      selected:'box1'
    }
  },
  mounted() {},
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
.content {
  height: 200px;
}
</style>
