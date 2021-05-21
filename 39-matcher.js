/**
 * matcher 相关的实现在 src/create-matcher.js中;
 */
export type Matcher = {
    match:(raw:RawLocation,current?:Route,redirectedFrom?:Location) =>Route;
    addRoutes:(routes:Array<RouteConfig>) => void;
}
//1. 路由中两个重要概念 Location / Route ,它的数据结构定义在 flow/declarations.js

// Location => 对 url 的结构化描述;
declare type Location = {
    _normalized?:boolean;
    name?:string;
    path?:string;
    hash?:string;
    query?:Dictionary<string>;
    params?:Dictionary<string>;
    append?:boolean;
    replace?:boolean;
}
//Route
declare type Route = {
    path:string;
    name:string;
    hash:string;
    query:Dictionary<string>;
    params:Dictionary<string>;
    fullPath:string;
    matched:Array<RouteRecord>;
    redirectedFrom?:string;
    meta?:any;
}

//2. createMatcher  matcher 的创建过程:
//2个参数,一个是router,是我们 new VueRouter 返回的实例, 一个是 routes,
//它是用户定义的路由配置.
export function createMatcher (routes:Array<RouteConfig>,router:VueRouter):Matcher {
    //2.1 创建一个路由映射表.
    const { pathList,pathMap,nameMap } = createRouteMap(routes)

    function addRoutes(routes){
        createRouteMap(routes,pathList,pathMap,nameMap)
    }
    function match(raw:RawLocation,currentRoute?:Route,redirectedFrom?:Location):Route {
        const location = normalizeLocation(raw,currentRoute,false,router)
        const { name } = location

        if(name){
            const record = nameMap[name]
            if(process.env.NODE_ENV !== 'production'){
                warn(record,`Route with name '${name}' doest not exist`)
            }
            if(!record) return _createRoute(null,location)
            const paramNames = record.regex.keys
            .filter(key => !key.optional)
            .map(key => key.name)

            if(typeof location.params !== 'object'){
                location.params = {}
            }
            if(currentRoute && typeof currentRoute.params === 'object'){
                for(const key in currentRoute.params){
                    if(!(key in location.params) && paramNames.indexOf(key) > -1){
                        location.params[key] = currentRoute.params[key]
                    }
                }
            }
            if(record){
                location.path = fillParams(record.path,location.params,`name route "${name}"`)
            }
            return _createRoute(record,location,redirectedFrom)
        }else if(location.path) {
            location.params = {}
            for(let i = 0; i < pathList.length; i++) {
                const path = pathList[i]
                const record = pathMap[path]
                if(matchRoute(record.regex,location.path,location.params)){
                    return _createRoute(record,location,redirectedFrom)
                }
            }
        }
        return _createRoute(null,location)
    }
    
}
// ...

function _createRoute(record:?RouteRecord,location:Location,redirectedFrom?:Location): Route {
    if(record && record.redirect){
        return redirect(record,redirectedFrom || location)
    }
    if(record && record.matchAs) {
        return alias(record,location,record.matchAs)
    }
    return createRoute(record,location,redirectedFrom,router)
}

return {match,addRoutes}

/**
 * 2.3 例子
 */
const Foo = { template:'<div>foo</div>'},
const Bar = { template:'<div>bar</div>'}

const routes = [
    {path:'/foo',component:Foo},
    {path:'/bar',component:Bar}
]
/**
 * 2.1 createRouteMap 的定义在 src/create-route-map 中:
 * 目标是把用户的路由配置转换成一张路由映射表,
 * 它包含3个部分, pathList 存储所有的 path, pathMap 表示一个path到
 * RouteRecord的映射关系, 而 nameMap 表示 name 到 RouteRecord 的
 * 映射关系.
 */
export function createRouteMap(
    routes:Array<RouteConfig>,
    oldPathList?:Array<string>,
    oldPathMap?:Dictionary<RouteRecord>,
    oldNameMap?:Dictionary<RouteRecord>
    ): {
        pathList: Array<string>;
        pathMap:Dictionary<RouteRecord>;
        nameMap:Dictionary<RouteRecord>;
    } {
        const pathList: Array<string> = oldPathList || []
        const pathMap: Dictionary<RouteRecord> = oldPathMap || Object.create(null)
        const nameMap: Dictionary<RouteRecord> = oldNameMap || Object.create(null)

        routes.forEach(route => {
            addRouteRecord(pathList,pathMap,nameMap,route)
        })

        for(let i = 0, l = pathList.length; i < l; i++) {
            if(pathList[i] === '*') {
                pathList.push(pathList.splice(i,1)[0])
                l--
                i--
            }
        }
        return {
            pathList,
            pathMap,
            nameMap
        }
    }
    /**
     * 2.1.1 RouteRecord 是什么?
     * 参数
     * path是规范化后的路径,它会根据 parent 的 path 做计算;
     * regex是一个正则表达式的扩展,它利用了 path-to-regexp 这个工具库,把 path 解析成一个正则表达式的扩展;
     * components 是一个对象,通常我们在配置中写的 component 实际上这里会被转换成 {components: route.component} ;
     * instances 表示组件的实例,也是一个对象类型;
     * parent 表示父的 RouteRecord, 因为我们配置 的时候会配置子路由,所以整个 RouteRecord 也就
     * 是一个树型结构.
     * 
     */
    declare type RouteRecord = {
        path:string,
        regex:RouteRegExp;
        components:Dictionary<any>;
        instances:Dictionary<any>;
        name:?string;
        parent:?RouteRecord;
        redirect:?RedirectOption;
        matchAs:?string;
        beforeEnter:?NavigationGuard;
        meta:any;
        props:boolean | Object | Function | Dictionary<boolean | Object | Function>;
    }
    //它的创建是通过遍历 routes 为每一个 route 执行 addRouteRecord 方法生成一条记录;
    function addRouteRecord(
        pathList:Array<string>,
        pathMap:Dictionary<RouteRecord>,
        nameMap:Dictionary<RouteRecord>,
        route:RouteConfig,
        parent?:RouteRecord,
        matchAs?:string
    ){
        const { path,name } = route
        if(process.env.NODE_ENV !== 'production'){
            assert(path != null,`"path" is required in a route configuration.`)
            assert(
                typeof route.component !== 'string',
                `route config "component" for path: ${String(path || name)} cannot be a` +
                `string id. Use an actual component instead.`
            )
        }
        const pathToRegexOptions:PathToRegexOptions = route.pathToRegexOptions || {}
        const normalizedPath = normalizePath(
            path,
            parent,
            pathToRegexOptions.strict
        )
        if(typeof route.caseSensitive === 'boolean'){
            pathToRegexOptions.sensitive = route.caseSensitive
        }
        const record:RouteRecord = {
            path:normalizedPath,
            regex:compileRouteRegex(normalizedPath,pathToRegexOptions),
            components:route.components || {default: route.component},
            instances:{},
            name,
            parent,
            matchAs,
            redirect: route.redirect,
            beforeEnter:route.beforeEnter,
            meta:route.meta || {},
            props:route.props == null? {}:route.components 
                                          ? route.props : { default: route.props}
            
        }
        if(route.children){
            if(process.env.NODE_ENV !== 'production'){
                if(route.name && !route.redirect && route.children.some(
                    child => /^\/?$/.test(child.path)
                )){
                    warn(
                        false,
                        `Name Route '${route.name}' has a default child route. ` +
                        `When navigating to this named route (:to="{name:'${route.name}'}")` +
                        `the default child route will not be rendered. Remove the name from ` +
                        `this route and use the name of the default child route for named ` +
                        `links instead. `
                    )
                }
            }
            route.children.forEach(child => {
                const childMatchAs = matchAs? cleanPath(`${matchAs}/${child.path}`)
                                            : undefined
                addRouteRecord(pathList,pathMap,nameMap,child,record,childMatchAs)
            })
        }
        if(route.alias !== undefined) {
            const aliases = Array.isArray(route.alias)
                  ? route.alias : [route.alias]

            aliases.forEach(alias => {

                const aliasRoute = {
                    path:alias,
                    children:route.children
                }
                addRouteRecord(
                    pathList,
                    pathMap,
                    nameMap,
                    aliasRoute,
                    parent,
                    record.path || '/'
                )
            })
        }
        if(!pathMap[record.path]){
            pathList.push(record.path)
            pathMap[record.path] = record
        }
        if(name){
            if(!nameMap[name]){
                nameMap[name] = record
            }else if(process.env.NODE_ENV !== 'production' && !matchAs){
                warn(
                    false,
                    `Duplicate named routes definition: ` +
                    `{name: "${name}",path:"${record.path}"}`
                )
            }
        }
    }

    /**
     * 由于 pathList, pathMap, nameMap 都是引用类型,所以在遍历整个 routes 过程中
     * 去执行 addRouteRecord 方法,会不断给他们添加数据. 那么经过整个 createRouteMap 方法的执行,
     * 我们得到的就是 pathList, pathMap 和 nameMap. 其中 pathList 是为了记录路由配置中的所有
     * path, 而pathMap 和 nameMap 都是为了通过 path 和 name 能快速查到对应的 RouteRecord.
     * 
     * createMatcher函数, 返回 match, 和 addRoutes 方法.
     */

    //addRoutes
    //方法的作用是动态添加路由配置,因为在实际开发中有些场景是不能提前把路由写死,
    //需要根据一些条件动态添加路由,所以 Vue-Router 也提供了这一接口:
    function addRoutes(routes){
        createRouteMap(routes,pathList,pathMap,nameMap)
    }
    //addRoutes 的方法简单,再次调用 createRouteMap 即可,传入新的 routes 配置,
    //由于 pathList, pathMap, nameMap 都是引用类型,执行 addRoutes 后会修改它们的值.

    //match
    /**
     * 
     * @param {*} raw 
     * 其中 raw 是 RawLocation 类型,它可以是一个 url 字符串,也可以是一个 Location 对象;
     * @param {*} currentRoute 
     * currentRoute 是 Route 类型, 它表示当前的路径;
     * @param {*} redirectedFrom 
     * redirectedFrom 和 重定向相关.
     * @returns 
     * match 方法返回的是一个路径,它的作用是根据传入的 raw 和当前的路径 currentRoute
     * 计算出一个新的路径并返回.
     */
    function match(
        raw:RawLocation,
        currentRoute?:Route,
        redirectedFrom?:Location
    ): Route {
        const record = nameMap[name]
        if(process.env.NODE_ENV !== 'production'){
            warn(record,`Route with name '${name}' does not exist`)
        }
        if(!record) return _createRoute(null,location)
        const paramNames = record.regex.keys
        .filter(key => !key.optional)
        .map(key => key.name)

        if(typeof location.params !== 'object'){
            location.params = {}
        }
        if(currentRoute && typeof currentRoute.params === 'object'){
            for(const key in currentRoute.params){
                if(!(key in location.params) && paramNames.indexOf(key) > -1){
                    location.params[key] = currentRoute.params[key]
                }
            }
        }

        if(record){
            location.path = fillParams(record.path,location.params,`named route "${name}"`)
            return _createRoute(record,location,redirectedFrom)
        }else if(location.path){
            location.params = {}
            for(let i = 0; i < pathList.length; i++) {
                const path = pathList[i]
                const record = pathMap[path]
                if(matchRoute(record.regex,location.path,location.params)){
                    return _createRoute(record,location,redirectedFrom)
                }
            }
        }
        return _createRoute(null,location)
    }

    //分析一下, normalizeLocation,定义在 src/util/location.js中:
    export function normalizeLocation(
        raw:RawLocation,
        current:?Route,
        append:?boolean,
        router:?VueRouter
    ): Location {
        let next:Location = typeof raw === 'string' ? {path:raw} :raw
        if(next.name || next._normalized) {
            return next
        }
        if(!next.path && next.params && current){
            next = assign({},next)
            next._normalized = true
            const params:any = assign(assign({},current.params),next.params)
            if(current.name){
                next.name = current.name
                next.params = params
            }else if(current.matched.length) {
                const rawPath = current.matched[current.matched.length - 1].path
                next.path = fillParams(rawPath,params,`path ${current.path}`)
            }else if(process.env.NODE_ENV !== 'production'){
                warn(false,`relative params navigation requires a current route.`)
            }
            return next
        }
        const parsedPath = parsedPath(next.path || '')
        const basePath = (current && current.path) || '/'
        const path = parsedPath.path
            ? resolvePath(parsedPath.path,basePath,append || next.append)
            : basePath

        const query = resolveQuery(
            parsedPath.query,
            next.query,
            router && router.options.parseQuery
        )

        let hash = next.hash || parsedPath.hash
        if(hash && hash.charAt(0) !== '#'){
            hash = `#${hash}`
        }
        return {
            _normalized:true,
            path,
            query,
            hash
        }
    }
    /**
     * normalizeLocation 方法的作用是根据 raw, current 计算出新的 location,
     * 它主要处理了 raw 的两种情况, 一种是有 params 且没有 path, 一种是有 path,
     * 对于第一种情况,如果 current 有 name, 则计算的 location 也有 name.
     * 
     * 计算出新的 location 后, 对 location 的 name 和 path 的两种情况:
     * 
     *  ........
     * 
     */