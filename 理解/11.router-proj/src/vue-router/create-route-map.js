

export default function createRouteMap(routes,oldPathList, oldPathMap){
    // 将用户传入的数据 进行格式化
    let pathList = oldPathList || []
    let pathMap = oldPathMap || Object.create(null)
    routes.forEach(route => {
        addRouteRecord(route,pathList,pathMap);
    });
    return {
        pathList,
        pathMap
    }

}
function addRouteRecord(route, pathList, pathMap, parent){
    let path = parent? `${parent.path}/${route.path}`: route.path;
    let record = { // 记录
        path,
        component: route.component,
        parent
    }
    if(!pathMap[path]){
        pathList.push(path); // 将路径添加到 pathList 中
        pathMap[path] = record;
    }
    if(route.children){
        route.children.forEach(child=>{
            addRouteRecord(child, pathList, pathMap, record); //每次循环儿子是, 都将父路径传入
        })
    }
}