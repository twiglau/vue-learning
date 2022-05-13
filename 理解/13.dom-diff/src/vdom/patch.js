


/**
 * 
 * @param {*} vnode 用户写的虚拟节点
 * @param {*} container 要渲染到哪个容器中
 */
export function render(vnode, container){
    let ele = createDomElementFromVnode(vnode); // 通过这个方法可以将虚拟节点转化为真实元素
    container.appendChild(ele);
}

// 通过虚拟的对象, 创建一个真实的 dom 树
function createDomElementFromVnode(vnode){
    let {type, key, props, children, text} = vnode;
    if(type){
        // 为标签
        vnode.domElement = document.createElement(type); // 建立虚拟节点和真实元素一个关系, 后面可以用来更新正式dom
        updateProperties(vnode);// 根据当前的虚拟节点的属性, 去更新正式的 dom 元素
        // children 中放的也是 一个个的虚拟节点
        // 递归渲染子的 虚拟节点
        children.forEach(childVnode=>render(childVnode, vnode.domElement));
    }else{
        vnode.domElement = document.createTextNode(text);
    }
    return vnode.domElement;
}
// 后续比对的时候, 会根据老的属性 和 新的属性 重新更新节点
function updateProperties(newVnode, oldProps={}){
    let domElement = newVnode.domElement; // 真实的 dom 元素
    let newProps = newVnode.props; // 当前虚拟节点中的属性


    // 如果老的里面有, 新的里面没有  这个属性 被移除了
    for(let oldPropName in oldProps){
        if(!newProps[oldPropName]){
            delete domElement[oldPropName];
        }
    }
    // 如果新的里面有 style 老的里面也有 style, style有可能还不一样, 老的有 background
    // 新的里面没有 background
    let newStyleObj = newProps.style || {};
    let oldStyleObj = oldProps.style || {};
    for(let propName in oldStyleObj){
        if(!newStyleObj[propName]){
            domElement.style[propName] = ''; // 老dom元素上更新之后, 没有某个样式需要删除
        }
    }
    // 如果新的里面灭有, 新的里面有
    for(let newPropsName in newProps){
        if(newPropsName === 'style'){
            let styleObj = newProps.style
            for(let s in styleObj){
                domElement.style[s] = styleObj[s];
            }
        }else{
            // 用新节点的属性 直接覆盖掉 老节点的属性即可
            domElement[newPropsName] = newProps[newPropsName];
        }
    }
}

export function patch(oldVnode, newVnode) {
    // 1. 类型不同
    if(oldVnode.type !== newVnode.type){
        return oldVnode.domElement.parentNode.replaceChild(createDomElementFromVnode(newVnode),oldVnode.domElement);
    }
    // 2. 类型相同 
    // 2.1 文本 hello world
    if(oldVnode.text){
        if(oldVnode.text === newVnode.text) return;
        return oldVnode.domElement.textContent = newVnode.text
    }
    // 2.2 不是文本, 并且是标签, 需要根据新节点的属性, 更新老节点的属性
    let domElement = newVnode.domElement = oldVnode.domElement;
    updateProperties(newVnode, oldVnode.props); //根据最新的虚拟节点来更新属性

    let oldChildren = oldVnode.children;
    let newChildren = newVnode.children;
    //2.2.1 老的有儿子, 新的有儿子
    //2.2.2 老得有儿子, 新的没儿子
    //2.2.3 新增了儿子
    if(oldChildren.length > 0 && newChildren.length > 0){
        //比对两个儿子
        updateChildren(domElement, oldChildren, newChildren);
    }else if(oldChildren.length > 0){
        domElement.innerHTML = '';
    }else if(newChildren.length > 0){
        for(let i = 0; i < newChildren.length; i++) {
            domElement.appendChild(createDomElementFromVnode(newChildren[i]))
        }
    }
}
function isSameVnode(oldVnode, newVnode) {
    return oldVnode.key === newVnode.key && oldVnode.type === newVnode.type;
}
// 需要写一个方法, 做成一个 a:0, b:1, c:2, d:3
function createMapByKeyToIndex(oldChildren){
    let map = {}
    for(let i=0; i<oldChildren.length;i++){
        let current = oldChildren[i];
        if(current.key){
            map[current.key] = i;
        }
    }
    return map
}
// diff 最复杂的就是列表 比对
function updateChildren(parent, oldChildren, newChildren) {
    let oldStartIndex = 0;
    let oldStartVnode = oldChildren[0];
    let oldEndIndex = oldChildren.length - 1;
    let oldEndVnode = oldChildren[oldEndIndex];

    let oldMap = createMapByKeyToIndex(oldChildren);
    

    let newStartIndex = 0;
    let newStartVnode = newChildren[0];
    let newEndIndex = newChildren.length - 1;
    let newEndVnode = newChildren[newEndIndex];

    // 我希望, 判断老的孩子 和 新的孩子, 循环的时候, 谁先结束就停止循环  
    while(oldStartIndex<=oldEndIndex && newStartIndex<=newEndIndex){
        debugger
        if(!oldStartVnode){
            oldStartVnode = oldChildren[++oldStartIndex];
        }else if(!oldEndVnode){
            oldEndVnode = oldChildren[--oldEndIndex];
            // 头部一样
        }else if(isSameVnode(oldStartVnode,newStartVnode)){
            patch(oldStartVnode, newStartVnode);
            oldStartVnode = oldChildren[++oldStartIndex];
            newStartVnode = newChildren[++newStartIndex];
            // 尾部一样
        }else if(isSameVnode(oldEndVnode, newEndVnode)){
            patch(oldEndVnode, newEndVnode);
            oldEndVnode = oldChildren[--oldEndIndex];
            newEndVnode = newChildren[--newEndIndex];
        }else if(isSameVnode(oldStartVnode, newEndVnode)){
            patch(oldStartVnode, newEndVnode);
            parent.insertBefore(oldStartVnode.domElement, oldEndVnode.domElement.nextSiblings);
            oldStartVnode = oldChildren[++oldStartIndex];
            newEndVnode = newChildren[--newEndIndex];
        }else if(isSameVnode(oldEndVnode, newStartVnode)){
            patch(oldEndVnode, newStartVnode)
            parent.insertBefore(oldEndVnode.domElement, oldStartVnode.domElement);
            oldEndVnode = oldChildren[--oldEndIndex];
            newStartVnode = newChildren[++newStartIndex];
        }else{
            // 需要先按到 新的节点, 去老的中查找, 看是否存在, 如果存在就复用, 不存在就穿件插入即可
            let index = oldMap[newStartVnode.key];
            if(index == null){
                // 创建插入
                parent.insertBefore(createDomElementFromVnode(newStartVnode),oldStartVnode.domElement);
            }else{
                let toMoveNode = oldChildren[index];
                patch(toMoveNode, newStartVnode);
                parent.insertBefore(toMoveNode.domElement, oldStartVnode.domElement);
                oldChildren[index] = undefined;
            }
            newStartVnode = newChildren[++newStartIndex];
        }
    }
    // 只有小于 或者 等于 才说明有剩余
    if(newStartIndex <= newEndIndex){
        for(let i = newStartIndex; i <=newEndIndex;i++){
            let beforeElement = newChildren[newEndIndex + 1] == null? null :newChildren[newEndIndex + 1].domElement; // 
            parent.insertBefore(createDomElementFromVnode(newChildren[i]),beforeElement);
        }
    }
    if(oldStartIndex <= oldEndIndex){
        for(let i = oldStartIndex; i <= oldEndIndex; i++){
            if(oldChildren[i]){
                parent.removeChild(oldChildren[i].domElement)
            }
        }
    }

}