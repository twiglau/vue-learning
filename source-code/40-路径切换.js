/**
 * 路径切换, 定义在 src/history/base.js 中:
 */
transitionTo(location:RawLocation, onComplete?:Function,onAbort?:Function) {
    const route = this.router.match(location,this.current)
    this.confirmTransition(route,() => {
        this.updateRoute(route)
        onComplete && onComplete(route)
        this.ensureURL()

        if(!this.ready){
            this.ready = true
            this.readyCbs.forEach(cb => { cb(route)})
        }
    }, err => {
        if(onAbort){
            onAbort(err)
        }
        if(err && !this.ready){
            this.ready = true
            this.readyErrorCbs.forEach(cb => cb(err))
        }
    })
}

/**
 * transitionTo 首先根据目标 location 和 当前路径 this.current 执行 this.router.match
 * 方法去匹配到目标的路径. 这里 this.current 是 history 维护的 当前路径, 它的初始值是在
 * history 的构造函数中初始化的:
 */
this.current = START

//START 的定义在  src/util/route.js 中:
export const START = createRoute(null,{
    path:'/'
})
//这样就创建了一个初始的Route,而 transitionTo 实际上就是在切换 this.current.