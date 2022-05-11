


// 观察者 =>  发布订阅 观察者,被观察者
class Dep {
    constructor(){
        this.subs = []; // 存放所有 watcher
    }
    // 订阅
    addSub(watcher){// 添加 watcher
        this.subs.push(watcher);
    }
    // 发布
    notify(){
        this.subs.forEach(watcher=>watcher.update());
    }
}
class Watcher {
    constructor(vm, expr, cb){
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        // 默认先存放一个老值
        this.oldValue = this.get();
    }
    get(){
        Dep.target = this; // 先把自己放在 this 上
        // 取值, 把这个观察者, 和数据关联
        let value = CompileUtil.getVal(this.vm, this.expr);
        Dep.target = null;
        return value;
    }
    // 更新操作, 数据变化后, 会调用观察者的 update方法
    update(){
        let newVal = CompileUtil.getVal(this.vm, this.expr);
        if(newVal !== this.oldValue){
            this.cb(newVal);
        }
    }
}

class Observer { // 实现数据劫持
    constructor(data){
        this.observer(data);
    }
    observer(data){
        // 如果是对象才观察
        if(data && typeof data == 'object'){
            // 如果是对象
            for(let key in data){
                this.defineReactive(data, key, data[key]);
            }
        }
    }
    defineReactive(obj, key, value){
        this.observer(value);
        let dep = new Dep(); // 给每个属性 都加上一个具有发布订阅的功能
        Object.defineProperty(obj, key, {
            get(){
                // 创建 watcher 时, 会取到对应的内容, 并且把 watcher 放到了全局上
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set:(newVal)=>{ // {school: {name: 'lau'}}
                if(newVal != value){
                    this.observer(newVal);
                    value = newVal;
                    dep.notify();
                }
            }
        })
    }
}
// 基类 进行调度
class Compiler {
    constructor(el, vm){
        // 判断 el 属性 是不是一个元素, 如果不是元素, 那就获取他
        this.el = this.isElementNode(el)? el: document.querySelector(el);
        // 把当前节点中的元素, 获取到, 放到内存中
        this.vm = vm;
        let fragment = this.node2fragment(this.el);
        
        // 把节点中的内容进行替换

        // 编译模板, 用数据编译
        this.compile(fragment);

        // 把内容再次赛道页面中
        this.el.appendChild(fragment);
    }
    // 把节点 移动的内存中
    node2fragment(node){
        // 创建一个文档碎片
        let fragment = document.createDocumentFragment();
        let firstChild;
        while(firstChild = node.firstChild){
            // appendChild 具有移动性
            fragment.appendChild(firstChild);
        }
        return fragment;
    }
    isElementNode(node){ // 是不是元素节点
        return node.nodeType === 1;
    }
    isDirective(attrName){
        return attrName.startsWith('v-')
    }
    // 编译元素
    compileElement(node){
        let attributes = node.attributes; // 类数组
        [...attributes].forEach(attr=>{// type="text" v-model="school.name"
            let {name,value:expr} = attr;
            // 判断是不是指令
            if(this.isDirective(name)){ // v-model v-html v-bind
                let [,directive] = name.split('-');
                let [directiveName, eventName] = directive.split(':');
                // 需要调用不同的指令来处理
                CompileUtil[directiveName](node, expr, this.vm, eventName);
            }

        })
    }
    // 编译文本
    compileText(node){
        // 判断当前文本节点中内容是否包含 {{}}
        let content = node.textContent;
        if(/\{\{(.+?)\}\}/.test(content)){
            // 文本节点 content = {{a}} {{b}}
            CompileUtil['text'](node, content, this.vm);
        }
    }
    // 核心的编译方法
    compile(node){
        // 用来编译内存中的 dom 节点
        let childNodes = node.childNodes;
        [...childNodes].forEach(child=>{
            if(this.isElementNode(child)){
                this.compileElement(child);
                // 如果是元素的话, 需要把自己传进去, 再去遍历子节点.
                this.compile(child);
            }else{
                this.compileText(child);
            }
        });
    }
}
CompileUtil = {
    // 根据表达式取到对应的数据
    getVal(vm, expr){
        // vm.$data 'school.name' => [school, name]
        
        return expr.split('.').reduce((data,current)=>{
            return data[current];
        },vm.$data);
    },
    setVal(vm, expr, newVal){
        //school.name 'twig'
        return expr.split('.').reduce((data,current, index, arr)=>{
            if(arr.length-1 == index){
                return data[current] = newVal;
            }
            return data[current];
        },vm.$data);
    },
    // node 是节点, expr 是表达式 vm是当前实例
    model(node, expr, vm){
        // school.name vm.$data 
        // 给输入框赋予 vlaue 属性  node.value = xxx
        let fn = this.updater['modelUpdater'];
        new Watcher(vm, expr, (newVal)=>{ // 给输入框加一个观察者, 如果稍后数据更新了,触发此方法.
            fn(node, newVal);
        });
        node.addEventListener('input',(e)=>{
            let value = e.target.value; // 获取用户输入的内容
            this.setVal(vm, expr, value);
        })
        let value = this.getVal(vm, expr); // lau 值
        fn(node, value);
    },
    html(node, expr, vm){
        let fn = this.updater['htmlUpdater'];
        new Watcher(vm, expr, (newVal)=>{ // 给输入框加一个观察者, 如果稍后数据更新了,触发此方法.
            fn(node, newVal);
        });
        let value = this.getVal(vm, expr);
        fn(node, value);
    },
    // expr => {{a}} {{b}}
    getContentValue(vm, expr){
        // 遍历表达式, 将内容重新替换成一个完整的内容, 返还回去
        return expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{
            return this.getVal(vm, args[1]);
        });
    },
    on(node, expr, vm, eventName){
        node.addEventListener(eventName, (e)=>{
            vm[expr].call(vm, e); // this.change
        })
    },
    text(node, expr, vm){
        let fn = this.updater['textUpdater'];
        let content = expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{
            // 给表达式每个人 都加上观察者
            new Watcher(vm, args[1],(newVal)=>{
                fn(node, this.getContentValue(vm, expr)); //返回一个全的字符串
            });
            return this.getVal(vm, args[1]);
        });
        fn(node, content);
    },
    updater: {
        // 把数据插入到节点中
        modelUpdater(node, value){
            node.value = value;
        },
        htmlUpdater(node, value){
            node.innerHTML = value;
        },
        textUpdater(node, value){
            node.textContent = value;
        }
    }
}
class Vue {
    constructor(options){
        this.$el = options.el;
        this.$data = options.data;
        let computed = options.computed;
        let methods = options.methods;

        // 这个跟元素 存在 编译模板
        if(this.$el){
            // 数据劫持: 把数据-> 全部转化成用 Object.defineProperty 来定义
            new Observer(this.$data);
            this.proxyVm(this.$data);
            // 把数据获取操作, vm上的取值操作, 都代理到 vm.$data
            // {{getNewName}} -> reduce -> vm.$data.getNewName
            for(let key in computed){
                // 有依赖关系
                Object.defineProperty(this.$data, key, {
                    get:()=>{
                        return computed[key].call(this);
                    }
                })
            };
            for(let key in methods){
                Object.defineProperty(this, key, {
                    get(){
                        return methods[key];
                    }
                })
            }
            new Compiler(this.$el, this);
        }
    }
    proxyVm(data){
        for(let key in data){
            Object.defineProperty(this, key, {
                get() {
                    return data[key]; // 进行了转化操作
                }
            })
        }
    }
}