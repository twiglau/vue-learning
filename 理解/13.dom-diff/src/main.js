
import { h,render, patch } from './vdom'

// 对常见的 dom 操作做优化
// 1. 前后追加
// 2. 正序和倒序
// 1.vnode
let vnode = h('div',{}, 
h('li', {style: {background: 'red'}, key: 'A'}, 'A'),
h('li', {style: {background: 'yellow'}, key: 'B'}, 'B'),
h('li', {style: {background: 'blue'}, key: 'C'}, 'C'),
h('li', {style: {background: 'green'}, key: 'D'}, 'D'),
);

// 2. render
// 将虚拟节点转化成真实的 dom 节点, 左后插入到 app 元素中
render(vnode, app);

let newVnode = h('div',{}, 
h('li', {style: {background: 'red'}, key: 'G'}, 'G'),
h('li', {style: {background: 'blue'}, key: 'C'}, 'C'),
h('li', {style: {background: 'yellow'}, key: 'A'}, 'A'),
h('li', {style: {background: 'yellow'}, key: 'E'}, 'E'),
h('li', {style: {background: 'green'}, key: 'F'}, 'F'),
);
setTimeout(() => { // 有了 虚拟 dom 之后, 不需要手动操作 dom
    patch(vnode, newVnode);
},1000);
