import createRouteMap from "./create-route-map";
import { createRoute } from "./history/base";
export default function createMatcher(routes){
    // routes 用户当前传入的配置
    // 扁平化用户传入的数据, 需要创建路由映射表
    // 数组: [/, /about, /about/a, /about/b]
    // 对象: {/: 记录, /about/a: 记录, /about/b: 记录}
    let {pathList, pathMap} = createRouteMap(routes); // 初始化配置

    // 动态添加的方法
    function addRoutes(routes){ // 添加新的配置
        createRouteMap(routes, pathList, pathMap)
    }
    // 用来匹配的方法
    function match(location){
        // 找到当前的记录
        let record = pathMap[location];
        let local = {
            path: location
        }
        //1. 需要找到对应的记录, 并且根据记录产生一个匹配数组
        if(record){//找到了记录
            return createRoute(record,local)
        }
        return createRoute(null,local);

    }



    return {
        match,
        addRoutes
    }
}