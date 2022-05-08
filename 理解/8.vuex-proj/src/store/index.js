import Vue from 'vue'
import Vuex from '../vuex'

Vue.use(Vuex) // 1. 使用这个插件 install 方法

const persits = (store)=> {
  store.subscribe((mutation, state) => {
    console.log(mutation, state)
    localStorage.setItem('vuex-state', JSON.stringify(state))
  })
}
// 导出的是 一个 store 的实例
export default new Vuex.Store({
  plugins:[
    persits
  ],
  state: {
    age:10
  },
  getters:{
    // 计算属性
    myAge(state){
      //object.defineProperty
      return state.age + 18;
    }
  },
  mutations: {
    syncAdd(state, payload){
      state.age += payload
    },
    syncMinus(state, payload){
      state.age -= payload
    }
  },
  actions: {
    asyncMinus({commit},payload){// action 异步获取完后, 提交到 mutation 中
      setTimeout(()=>{
        commit('syncMinus',payload)
      }, 1000)
    }
  },
  modules: {
    a:{
      state:{ a_s: 1},
      modules: {
        c: {
          state: {c_s: 3},
          getters:{ // 所有的 getters 都会定义到跟上
            computed(state){
              return state.c + 100;
            }
          },
          mutations:{
            syncAdd(state, payload){
              console.log('add')
            }
          }
        }
      }
    },
    b:{
      state: { b_s: 2}
    }
  }
})
