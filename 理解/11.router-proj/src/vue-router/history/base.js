
export function createRoute(record, location){// path matched
    let res = [];
    if(record){// {path:'/about/a',component:xxx,parent}
        while(record){
            res.unshift(record);
            record = record.parent;
        }
    }
    return {
        ...location,
        matched:res
    }
}

export default class History {
    constructor(router){ // router => new Router
        this.router = router;
        // 默认路由中应该保存一个当前的路径
        // 后续会更改这个路径

        this.current = createRoute(null, {
            path: '/'
        })
    }
    // 跳转的核心逻辑
    // location 代表跳转的目的地
    // complete 当前跳转成功后执行的方法
    transitionTo(location, onComplete){
        // 用当前路径, 找出对应的记录
        // /about/a => {path:'/about/a', matched:[about, aboutA]}
        let route = this.router.match(location);
        // route 就是当前匹配那些路由
        // 将新的route 睡醒, 覆盖掉 current
        if(this.current.path === location && route.matched.length === this.current.matched.length){
            return; // 如果是相同路径, 就不进行跳转了
        }
        this.updateRoute(route);
        onComplete && onComplete()
    }
    updateRoute(route){
        this.current = route;
        this.cb && this.cb(route);// 路径变化, 会将最新路径传递给 Listen 方法
    }
    listen(cb){
        this.cb = cb;
    }
}