


// 1. 先实现虚拟 dom: 主要就是一个对象 来描述 dom 节点 jsx react jsx
// 2. createElement h

/**1.
 * <div id="wrapper" a=1>
 *    <span style="color:red">hello<span>
 *    lau
 * </div>
 */

// 3.
// {
//     type: 'div',
//     props: {id: 'wrapper', a: 1},
//     children: {
//         {type: 'span', props: {color: 'red'}, children:[{'hello'}]},
//         {type: '', props: '', children: [], text: 'lau'}
//     }
// }