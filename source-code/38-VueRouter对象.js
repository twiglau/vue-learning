/**
 * VueRouter 的实现是一个类,定义在 src/index.js中:
 */
export default class VueRouter {
    static install: () => void;
    static version:String;

    app:any; // 表示根 Vue 实例
    apps:Array<any>; // 保存所有子组件的Vue 实例;
    ready:boolean;
    readyCbs:Array<Function>;
    options:RouterOptions; // 保存转入的路由配置.
    mode:string;
    history:HashHistory | HTML5Histroy | AbstractHistory;
    matcher:Matcher;
    fallback:boolean;
    beforeHooks:Array<?NaigationGuard>;
    resolveHooks:Array<?NaigationGuard>;
    afterHooks:Array<?AfterNavigationHook>;

    constructor(options:RouterOptions = {}){
        this.app = null
        this.apps = []
        this.options = options
        this.beforeHooks = []
        this.resolveHooks = []
        this.afterHooks = []
        this.matcher = createMatcher(options.routes || [],this)

        let mode = options.mode || 'hash'
        this.fallback = mode === 'history' && !supportsPushState && options.fallback != false
        if(this.fallback){
            mode = 'hash'
        }
        if(!inBrowser){
            mode = 'abstract'
        }
        this.mode = mode

        switch(mode){
            case 'history':
                this.history = new HTML5Histroy(this,options.base)
                break
            case 'hash':
                this.history = new HashHistory(this,options.base,this.fallback)
                break
            case 'abstract':
                this.history = new AbstractHistory(this,options.base)
                break
            default:
                if(process.env.NODE_ENV !== 'production'){
                    assert(false,`invalid mode:${mode}`)
                }
        }
        match(
            raw:RawLocation,
            current?:Route,
            redirectedFrom?:Location
        ):Route {
            return this.matcher.match(raw,current,redirectedFrom)
        }
        get currentRoute(): ?Route {
            return this.history && this.history.current
        }
        init(app:any){
            process.env.NODE_ENV !== 'production' && assert(
                install.installed,
                `not installed,Make sure to call \'Vue.use(VueRouter)\' ` +
                `before creating root instance.`
            )
            this.apps.push(app)
            if(this.app){
                return
            }
            this.app = app
            const history = this.history
            if(history instanceof HTML5Histroy) {
                history.transitionTo(history.getCurrentLocation())
            }else if(history instanceof HashHistory) {
                const setupHashListener = ()=>{
                    history.setupListeners()
                }
                history.transitionTo(
                    history.getCurrentLocation(),
                    setupHashListener,
                    setupHashListener
                )
            }

            history.listen(route => {
                this.apps.forEach((app) => {
                    app._route = route
                })
            })
            beforeEach(fn:Function):Function{
                return registerHook(this.beforeHooks,fn)
            }
            beforeResolve(fn:Function):Function{
                return registerHook(this.resolveHooks,fn)
            }
            afterEach(fn:Function):Function{
                return registerHook(this.afterHooks,fn)
            }
            onReady(cb:Function,errorCb?:Function){
                this.history.onReady(cb,errorCb)
            }
            onError(errorCb:Function){
                this.history.onError(errorCb)
            }
            push(location:RawLocation,onComplete?:Function,onAbort?:Function){
                this.history.push(location,onComplete,onAbort)
            }
            replace(location:RawLocation,onComplete?:Function,onAbort?:Function){
                this.history.replace(location,onComplete,onAbort)
            }
            go(n:number){
                this.history.go(n)
            }
            back(){
                this.go(-1)
            }
            forward(){
                this.go(1)
            }
            getMatchedComponents(to?:RawLocation | Route): Array<any> {
                const route:any = to
                  ? to.matched
                  ? to
                  : this.resolveHooks(to).route
                : this.currentRoute

                if(!route){
                    return []
                }
                return [].concat.apply([],route.matched.map( m => {
                    return Object.keys(m.components).map(key => {
                        return m.components[key]
                    })
                }))
            }
            resolve(
                to:RawLocation,
                current?:Route,
                append?:boolean
            ): {
                location:Location,
                route:Route,
                href:string,
                normalizedTo:Location,
                resolved:Route
            }{
                const location = normalizeLocation(
                    to,
                    current || this.history.currrent,
                    append,
                    this
                )
                const route = this.match(location,current)
                const fullPath = route.redirectedFrom || route.fullPath
                const base = this.history.base
                const href = createHref(base,fullPath,this.mode)
                return {
                    location,
                    route,
                    href,
                    normalizedTo:location,
                    resolved:route
                }
            }
            addRoutes(routes:Array<RouteConfig>){
                this.matcher.addRoutes(routes)
                if(this.history.current !== START){
                    this.history.transitionTo(this.history.getCurrentLocation())
                }
            }
            
        }

    }
}

/**
 * 实例化VueRouter 后会返回它的实例 router, 我们在 new Vue() 的时候会把
 * router 作为配置的属性传入. 上节 beforeCreated 混入的时候
 */
beforeCreated(){
    if(isDef(this.$options.router)){
        //...
        this._router = this.$options.router
        this._router.init(this)
        //就是说每个组件在执行beforeCreated 钩子函数的时候,都会执行
        //router.init 方法;
    }
}

/**
 * 总结: 在组件的初始化阶段,执行的beforeCreated 钩子函数的时候会执行
 * router.init 方法, 然后又会执行 history.transitionTo 方法做路由过渡,
 * 进而引出了 matcher 的概念;
 */
