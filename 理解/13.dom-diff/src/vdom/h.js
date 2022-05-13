
/**
 * jsx loader 来转化的结果
 */
import { vnode } from './vnode';
/**
 * 
 * @param {*} type 类型 div span
 * @param {*} props 节点属性
 * @param  {...any} children 所有孩子
 */
export default function createElement(type, props={}, ...children){
    let key;
    if(props.key){
        key = props.key;
        delete props.key;
    }
    // 将不是虚拟节点的子节点, 编程虚拟节点
    children = children.map(child => {
        if(typeof child === 'string'){
            return vnode(undefined, undefined, undefined, undefined, child);
        }else{
            return child;
        }
    })
    return vnode(type, key, props, children)
}



// let app = document.getElementById('app');
// for(let key in app){
//     console.log(key)
// }