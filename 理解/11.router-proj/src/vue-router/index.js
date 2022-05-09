import install from './install'
import createMatcher from './create-matcher';
import HashHistory from './history/hash';
export default class VueRouter {
    constructor(options){
        //1. 什么叫路由: 根据不同的路径,跳转不同的页面组件
        //1.1 将用户传递的 routes 装化成好维护的结构
        // match 负责匹配路径 {'/':'记录', '/about': '记录'}
        // addRoutes 动态添加路由配置
        this.matcher = createMatcher(options.routes || []);

        //2. 创建路由系统 
        this.mode = options.mode || 'hash';
        //2.1 根据模式创建不同的路由对象
        //History 类 基类
        //new HashHistory
        //new HtHistory
        this.history = new HashHistory(this);
    }
    init(app){ // new Vue app指代的是根实例
        //如何初始化
        //1. 先根据当前路径, 显示到指定的 组件
        const history = this.history;
        const setUpHashListener = ()=>{
            history.setupListener();
        }
        history.transitionTo(
            history.getCurrentLocation(),
            setUpHashListener
        );
        history.listen((route)=>{
            app._route = route; // 视图就可以刷新了
        })
    }
    match(location){
        return this.matcher.match(location);
    }
    push(){}
    replace(){}
}
VueRouter.install = install