// 函数式组件: 没有 this, 没有状态

export default {
    functional: true,
    render(h, {parent, data}){
        // /about/a => matched = [about aboutA]
        let route = parent.$route;
        let matched = route.matched;
        let depth = 0;
        data.routerView = true; // 当前组件是一个routerView
        
        while(parent){
            if(parent.$vnode && parent.$vnode.data.routerView){
                depth++;
            }
            parent = parent.$parent;
        }
        let record = matched[depth];
        if(!record){
            return h();
        }
        let component = record.component
        return h(component, data);
    }
}