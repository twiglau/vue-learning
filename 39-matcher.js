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
 * 2.1 例子
 */
const Foo = { template:'<div>foo</div>'},
const Bar = { template:'<div>bar</div>'}

const routes = [
    {path:'/foo',component:Foo},
    {path:'/bar',component:Bar}
]