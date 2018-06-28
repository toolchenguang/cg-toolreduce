/**
 *  控件的基础属性
 *  @param name 控件名称
 *  @param version 控件版本
 *  @param author 控件作者
 *  @param width 控件宽度
 *  @param height 控件高度
 *
 *  @author create by heshang
 * */
var base = {};
var control = {};
var compents = {};
var utils = {};
var errlog = {};

base.Controller = class {
    static getItemById(guid) {
        return this.boxObj[guid];
    }

    static setItemById(guid, item) {
        this.boxObj[guid] = item;
    }

    static delItemById(guid) {
        delete this.boxObj[guid];
    }
}
base.Controller.boxObj = {}

base.EventPrope = class {
    constructor() {
        this.debugger = true;
        base.EventPrope.control_un_id++;//全局唯一
        this._name = "";
        this._version = "0.0.1";                                      //控件的版本
        this._author = "";
        this._guid = 'control_' + base.EventPrope.control_un_id;   //控件的唯一id

        this._tempDomStr = "";//这个是优化拼接style属性的使用
        //todo  后期定义的控件的公共属性
        this._width = 100;
        this._height = 50;
        this._style = "";
        this._html = "";                                              //模板
        //增加的公共属性
        this._visibility = "visible";
        this._zindex = 0;
        this._tabindex = 0;
    }

    changeStyleStr() {
        // this.dom.style
    }

    set tabindex(t) {
        this._tabindex = t;
    }

    get tabindex() {
        return this._tabindex;
    }

    get dom() {
        return "";
    }

    get html() {
        return this._html;
    }

    get guid() {
        return this._guid;
    }

    setControllerItem(oldG, newG) {

        base.Controller.delItemById(oldG);
        base.Controller.setItemById(newG, this);
        if (this.dom) {
            this.dom.setAttribute("data-guid", this._guid);
        }
    }

    set guid(g) {
        if (this.guid != g || this.guid != "") {
            this.setControllerItem(this._guid, g);
            this._guid = g;
        }
    }

    get name() {
        return this._name;
    }

    set name(n) {
        this._name = n;
    }

    get version() {
        return this._version;
    }

    set version(v) {
        this._version = v;
    }

    get author() {
        return this._author;
    }

    set author(a) {
        this._author = a;
    }

    get width() {
        return this._width;
    }

    set width(w) {
        this._width = w;
    }

    get height() {
        return this._height;
    }

    set height(h) {
        this._height = h;
    }
}

base.EventPrope.control_un_id = 0;
/**
 * 缓存刷新dom类 单例 全局唯一控制
 * @author create by heshang
 * */
base.DomCacheRefresh = class {
    constructor() {
        this.styleList = [];
        this.tempT = null;
        this.freshNum = 0;
        this.startFreshCount = 100;//开始刷新的上限，达到上线后立即刷新style
        this.delayMs = 20;//延迟刷新style的毫秒数
    }

    /**
     *  单例类的对象
     * */
    static get instance() {
        return this._instance || (this._instance = new base.DomCacheRefresh());
    }

    /**
     * 添加对象属性进缓存池
     * @param control 对象
     * @param key 属性名称 || hash列表
     * @param value 属性名称对应的属性值
     * */
    addStyle(control, key, value) {
        if (!this.styleList[control.guid]) {
            let style = {};
            for (let i in control.dom.style) {
                if (control.dom.style[i] && typeof control.dom.style[i] != "function") {
                    style[i] = control.dom.style[i];
                }
            }
            this.styleList[control.guid] = {control: control, style: style};
        }
        if (typeof key === "string") {
            this.styleList[control.guid].style[key] = value;
        } else {
            for (let i in key) {
                this.styleList[control.guid].style[i] = key[i];
            }
        }

        this.startRefresh();
    }

    /**
     * 检测是否需要刷新 当需要刷新的缓存数量超过上线 或者小于定期刷新的事件间隔 执行刷新
     * */
    startRefresh() {
        this.freshNum++;
        if (this.freshNum >= this.startFreshCount) {
            this.fresh();
            return;
        }
        clearTimeout(this.tempT);
        this.tempT = setTimeout(function () {
            this.fresh();
        }.bind(this), this.delayMs);
    }

    /**
     * 刷新dom属性
     * */
    fresh() {
        this.freshNum = 0;
        clearTimeout(this.tempT);
        this.tempT = null;
        for (let i in this.styleList) {
            let control = this.styleList[i].control;
            let style = this.styleList[i].style;
            let str = JSON.stringify(style);
            str = str.replace(/\"/g, "");
            str = str.replace(/\{/g, "");
            str = str.replace(/\}/g, "");
            str = str.replace(/\,/g, ";");
            control.dom.style = str;
        }
        this.styleList = [];
    }
};
base.DomCacheRefresh._instance = null;
/**
 * 事件类型定义
 *
 * @author create by heshang
 * */

base.EventBase = {
    CLICK: "click",
    DBLCLICK:"dblclick",
    MOUSE_DOWN: "mousedown",
    MOUSE_UP: "mouseup",
    MOUSE_MOVE: "mousemove",
    MOUSE_OUT: "mouseout",

    DRAGBEGIN:"dragbegin",
    DRAGMOVE:"dragmove",
    DRAGEND:"dragend",
    FCOURS: "fcours",

    LOAD_BEFORE: "loadbefore",
    LOAD_COMPLETE: "loadcomplete",

    CREATE_BEFORE: "createbefore",
    CREATE_COMPLETE: "createcomplete",
    DESTORY_BEFORE: "destorybefore",
    DESTORY_COMPLETE: "destorycomplete",
    CHANGE: "change",
    CONTEXTMENU:"contextmenu"
}
/**
 * 事件句柄构造函数
 * @param call 回调方法
 * @param caller 回调的作用域
 * @param args 回调的参数
 * @example btn.click = base.Handler.create(fun,this,"我是按钮1");
 * @author create by heshang
 * */
base.Handler = class {
    constructor(call, caller, args) {
        this._tmp_call = call;
        this._tmp_caller = caller;
        this._tmp_args = args;

        this.runIndex = 0;
        this.stopIndex = 0;
        if (call) {
            this.call = this.runMine.bind(this);
        } else {
            this.call = null;
        }
        this.caller = caller;
        this.args = args;
        this.handlerList = [];
    }

    runMine() {
        this._tmp_call && this._tmp_call.call(this._tmp_caller, this._tmp_args);
        this.runIndex = 0;
        this.stopIndex = 0;
        this.runHandlerList();
    }

    /**
     * 阻止链条继续执行（阻止冒泡）
     * */
    stop() {
        this.stopIndex = this.runIndex;
        this.runIndex = this.handlerList.length;
    }

    /**
     *  从上次阻断的位置继续执行
     * */
    resume() {
        this.runIndex = this.stopIndex;
        this.runHandlerList();
        this.stopIndex = 0;
    }

    /**
     * 执行事件句柄的集合
     * */
    runHandlerList() {
        if (this.runIndex < this.handlerList.length) {
            let {call, caller, args} = this.handlerList[this.runIndex];
            call.call(caller, call, caller, args);
            this.runIndex++;
            this.runHandlerList();
        }
    }

    /**
     * 事件链条的执行方法可以无限追加，当之前事件句柄时自动追加。
     * @param handler 事件句柄
     * */
    next(handler) {
        this.handlerList.push(handler);
        return this;
    }

    /**
     * static 静态方法 创建事件句柄
     * @param call 回调函数
     * @param caller 作用域
     * @param args 透传参数
     * */
    static create(call, caller, args) {
        return new base.Handler(call, caller, args);
    }
}

/**
 * 生命周期的对象
 * @param createBefore  创建之前
 * @param createComplete 创建完成
 * @param loadedBefore  加载之前
 * @param loadedComplete 加载完成
 * @param destoryBefore 销毁之前
 * @param destroyComplete 销毁完成
 * @example var ec = new base.EventCyle(b,c,b1,c1,d,d1);
 * create by heshang
 * */
base.EventCycle = class {
    constructor(createBefore, createComplete, loadedBefore, loadedComplete, destoryBefore, destroyComplete) {
        this.debugger = false;
        this.parent = null;
        this.createBefore = createBefore;
        this.createComplete = createComplete;
        this.loadedBefore = loadedBefore;
        this.loadedComplete = loadedComplete;
        this.destoryBefore = destoryBefore;
        this.destroyComplete = destroyComplete;
    }

    getEvent(type) {
        let event = null;
        switch (type) {
            case base.EventBase.CREATE_BEFORE:
                event = this.createBefore;
                break;
            case base.EventBase.CREATE_COMPLETE:
                event = this.createComplete;
                break;
            case base.EventBase.LOAD_BEFORE:
                event = this.loadedBefore;
                break;
            case base.EventBase.LOAD_COMPLETE:
                event = this.loadedComplete;
                break;
            case base.EventBase.DESTORY_BEFORE:
                event = this.destoryBefore;
                break;
            case base.EventBase.DESTORY_COMPLETE:
                event = this.destroyComplete;
                break;
        }
        return event;
    }

    runEvent(type, args) {
        let event = this.getEvent(type);
        // if (this.debugger) {
        //     console.log(this.parent.name + " " + this.parent.guid + " run code " + type + " fun before");
        // }
        event && event.call.call(event.caller, event.args, args);
        if (this.debugger) {
            console.log(this.parent.author + " " + this.parent.name + " " + this.parent.guid + " run code " + type + " fun complete");
        }
    }

    setEvent(type, cycleEvent) {
        switch (type) {
            case base.EventBase.CREATE_BEFORE:
                this.createBefore = cycleEvent;
                break;
            case base.EventBase.CREATE_COMPLETE:
                this.createComplete = cycleEvent;
                break;
            case base.EventBase.LOAD_BEFORE:
                this.loadedBefore = cycleEvent;
                break;
            case base.EventBase.LOAD_COMPLETE:
                this.loadedComplete = cycleEvent;
                break;
            case base.EventBase.DESTORY_BEFORE:
                this.destoryBefore = cycleEvent;
                break;
            case base.EventBase.DESTORY_COMPLETE:
                this.destroyComplete = cycleEvent;
                break;
        }
    }
}
/**
 *  基础的显示对象
 *  @param eventCycle 此按钮的生命周期对象
 *  @type null
 *  @author create by heshang
 * */
base.ControlDisplayBase = class extends base.EventPrope {
    constructor(eventCycle) {
        super();
        this._eventCycle = eventCycle;                               //生命周期
        this._childList = [];                                        //子对象的集合
        this._parent = null;                                         //父对象
        this.type = "";                                              //控件的类型
        this._styleCache = base.DomCacheRefresh.instance;
        //todo 目前这个做到了公用的里面 作者信息是拿不到的
        this.eventCycle.runEvent(base.EventBase.CREATE_BEFORE);           //对象创建完成
    }

    /**
     *设置控件内的公共属性
     * @param config 事件的配置
     * @example {text:"xxx",guid:"xxxx"}
     * */
    set config(config) {
        for (let i in config) {
            if (typeof this[i] != "undefined")
                this[i] = config[i];
            else {
                if (this.debugger) {
                    console.warn(this.type + ` prop${i} is not defined`);
                }
            }
        }
    }

    /**
     *获取此显示对象的生命周期
     * @returns 生命周期
     * */
    get eventCycle() {
        if (!this._eventCycle) {
            this._eventCycle = new base.EventCycle();
        }
        if (!this._eventCycle.parent) {
            this._eventCycle.parent = this;
        }
        return this._eventCycle;
    }

    /**
     *获取此显示对象的子对象
     * @returns 子对象集合列表
     * */
    get childList() {
        return this._childList;
    }


    /**
     *根据子对象索引获取子对象
     * @param index 子对象索引值
     * @returns 子对象
     * */
    getChildAt(index) {
        return this._childList[index];
    }

    /**
     *根据子对象id查找对象
     * @param guid 对象的唯一id
     * @returns 子对象
     * */
    getChildById(guid) {
        for (let i in this.childList) {
            if (this.childList[i].guid === guid) {
                return this.childList[i];
            }
        }
        return null;
    }

    /**
     * 将属性反射到对象上
     * @param child 节点对象
     * @param reflex 反射对象
     * */
    reflexProp(child, reflex) {
        let guid = utils.Dom.getAttr(child, "guid");
        let text = utils.Dom.getAttr(child, "text");
        let config = utils.Dom.getAttr(child, "config");
        if (guid) {
            this.guid = guid;
        } else {
            this.guid = this.guid;
        }
        if (text) {
            // if(text.indexOf('.')>-1){
            //     text = text.split('.');
            //     text[0]="i";
            //     let str=""
            //     str = `${text[0]}.${text[1]}`;
            //     text=i? str: '';
            //     this.text = eval(text);
            // } else {
            this.text = text;
            // }

        }
        if (config) {
            this.config = eval(config);
        }
        this.reflexPropSelf(child, reflex);
    }

    /**
     * 从dom中反射控件独有的属性，控件内需要有自己的反射属性是需要重写
     * @param child dom的节点
     * @param reflex 反射的对象
     * */
    reflexPropSelf(child, reflex) {

    }

    reflexDom(child, reflex) {
        this.reflexProp(child, reflex);
    }

    get dom() {
        return null;
    }

    /**
     * 获取此对象的父对象
     * */
    get parent() {
        return this._parent;
    }

    /**
     * 添加对象作为此对象的子对象
     *  @param node 子对象必须是一个显示对象
     * */
    addChild(node) {
        this.eventCycle.runEvent(base.EventBase.LOAD_BEFORE);
        node._parent = this;
        this._childList.push(node);
        if (node.dom && this.dom) {
            this.dom.appendChild(node.dom);
        }
        node.setControllerItem(node.guid, node.guid);
        this.eventCycle.runEvent(base.EventBase.LOAD_COMPLETE);
    }

    /**
     * 删除此对象的所有子对象
     * */
    removeAllChild() {
        for (let i in this._childList) {
            this._childList[i].destory();
        }
        this._childList = null;
    }

    /**
     * 删除此对象本身的渲染逻辑，物理逻辑还存在可以再次添加
     * */
    removeSelfUI() {
        if (this.parent) {
            this.parent.dom.removeChild(this.dom);
        }
    }

    /**
     * 销毁显示对象内的所有UI、及生命周期
     * */
    destoryDisplayBase() {
        this.eventCycle.runEvent(base.EventBase.DESTORY_BEFORE);
        this.removeAllChild();
        this.removeSelfUI();
        this._parent = null;
        this.eventCycle.runEvent(base.EventBase.DESTORY_COMPLETE);
        this._eventCycle = null;
    }

    /**
     * 销毁自身所有的额外的事件跟变量
     * */
    destorySelfProp() {

    }

    destorySelf() {
        this.destorySelfProp();
    }

    /**
     * 销毁对象
     * */
    destory() {
        this.destorySelf();
        this.destoryDisplayBase();
    }

    //加载完成
    loadComplete() {
        this.eventCycle.runEvent(base.EventBase.LOAD_COMPLETE);
    }

    /**
     * 设置属性 改变dom
     * @param key 属性名称 || 是一个哈希列表
     * @param val 属性名称对应的值
     * @example a.style({"position":"absolute","margin-top":"0px"})
     * @example a.style("position","absolute");
     * */
    style(key, val) {
        this._styleCache.addStyle(this, key, val);
    }

    /**
     * 元素的visibility属性
     * @param v visible默认，元素框是可见的。 hidden元素框不可见，但仍然影响布局。 collapse当在表格元素中使用时，此值可删除一行或一列，但是它不会影响表格的布局。被行或列占据的空间会留给其他内容使用。如果此值被用在其他的元素上，会呈现为 "hidden"。
     * @example a.visibility = "visible";
     * */
    set visibility(v) {
        this.style("visibility", v);
        this._visibility = v;
    }

    get visibility() {
        return this._visibility;
    }

    /**
     * 设置元素的zindex
     * @param z 显示的层级
     * */
    set zindex(z) {
        this.style("zIndex", z);
        this._zindex = z;
    }

    get zindex() {
        return this._zindex;
    }


    set width(w) {
        this.style("width", w);
        this._width = w;
    }

    get width() {
        return this._width;
    }


    //设置属性 改变dom  end

}

/**
 *  带有事件处理的显示对象
 *  @param eventCycle 事件的生命周期
 *
 *  @author create by heshang
 * */
base.ControlEventBase = class extends base.ControlDisplayBase {
    constructor(eventCycle) {
        super(eventCycle);
        this._eventList = [];
        this._event = [];
        this._stop = false;//阻止冒泡
    }

    // noinspection JSAnnotator
    /**
     * 设置控件的点击事件
     * @param handler x
     * */
    set click(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.CLICK, handler);
    }

    /**
     * 设置控件的点击事件
     * @param handler x
     * */
    set dblclick(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.DBLCLICK, handler);
    }

    // noinspection JSAnnotator
    /**
     * 设置控件的改变事件
     * @param handler x
     * */
    set change(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.CHANGE, handler);
    }


    /**
     * 设置控件的右击事件
     * @param handler x
     * */
    set contextmenu(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.CONTEXTMENU, handler);
    }

    /**
     * 设置控件的拖拽开始事件
     * @param handler x
     * */
    set dragbegin(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.DRAGBEGIN, handler);
    }

    /**
     * 设置控件的拖拽移动事件
     * @param handler x
     * */
    set dragmove(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.DRAGMOVE, handler);
    }

    /**
     * 设置控件的拖拽结束事件
     * @param handler x
     * */
    set dragend(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.DRAGEND, handler);
    }


    /**
     * 获取点击事件的句柄
     * @returns 事件句柄
     * */
    get click() {
        return this._event[base.EventBase.CLICK];
    }

    //获取事件索引
    getEvent(type, handler) {
        if (this._eventList[type]) {
            for (let i in this._eventList[type]) {
                let {call, caller, args} = this._eventList[type][i];
                if (handler.call == _call && handler.caller == _caller) {
                    return i;
                }
            }
        }
        return -1;
    }

    /**
     * 绑定事件类型 同种类型只能绑定一个事件
     * @param type 事件的类型
     * @param handler 事件句柄
     * */
    onEvent(type, handler) {
        this._event[type] = handler;
    }

    /**
     * 执行绑定类型的事件
     * @param type 绑定的事件类型
     * @param _args 执行时要传入的参数
     * */
    runEvent(type, _args) {

        if (this._event[type]) {
            if (this._stop) {
                this._stop = false;
                return;
            }
            let {call, caller, args} = this._event[type];
            call && call.call(caller, _args, args);
        }
    }

    /**
     * 删除绑定的事件类型
     * @param type 删除指定的事件类型
     * @example btn.offEvent(base.EventBase);
     * */
    offEvent(type) {
        delete this._event[type];
    }

    /**
     * 事件委托  同一个事件类型可以绑定多个不同的事件句柄
     * @param type 事件类型
     * @param handler 事件的对象
     * @example btn.on("abc",handler1);
     * @example btn.on("abc",handler2);
     * */
    on(type, handler) {
        let index = this.getEvent(type, handler);
        if (index != -1) {
            return;
        }
        if (!this._eventList[type]) {
            this._eventList[type] = [handler];
            return;
        }
        this._eventList[type].push(handler);
    }

    /**
     * 解绑 指定事件类型的 事件句柄
     * @param type 事件类型
     * @param handler 事件句柄
     * */
    off(type, handler) {
        let index = -1;
        if (this._eventList[type]) {
            for (let i in this._eventList[type]) {
                index = this.getEvent(type, handler);
                if (index != -1) {
                    break;
                }
            }
        }
        if (index >= 0) {
            delete this._eventList[type][index];
        }
    }

    /**
     * 绑定指定的事件类型，执行一次后自动解绑
     * @param type 事件类型
     * @param handler 事件句柄
     * */
    once(type, handler) {
        function one() {
            handler.call && handler.call(handler.caller, handler.args);
            this.off(type, handler);
        }

        this.on(type, one, this);
    }

    /**
     * 派发指定作用域下的事件
     * @param type 事件类型
     * @param _args 派发的时候传的第二个参数
     * @param _caller 派发时指定的作用域 不写默认派发全部
     * */
    dispatch(type, _args, _caller) {
        if (this._eventList[type]) {
            if (this._stop) {
                this._stop = false;
                return;
            }
            for (let i in this._eventList[type]) {
                let {call, caller, args} = this._eventList[type][i];
                if (!_caller || _caller == caller) {
                    call && call.call(caller, _args, args)
                }
            }
        }
    }

    // -------------事件委托结束

    destorySelfEvent() {

    }

    destorySelf() {
        this.destorySelfEvent();
        this.destorySelfProp();
    }

    /**
     * 销毁事件对象
     * */
    destory() {
        this._event = null;
        this._eventList = null;
        this.destorySelf();
        this.destoryDisplayBase();
    }

    /**
     * 根据dom节点把事件str反射到dom中
     * */
    createReflexEvent(str) {
        return base.Handler.create(function () {
            eval(str);
        }, this);
    }

    /**
     *反射控件的公共事件
     * @param child dom节点
     * @param reflex 反射对象
     * */
    reflexEvent(child, reflex) {
        let click = utils.Dom.getEvt(child, "click");
        let onload = utils.Dom.getEvt(child, "onload");
        let change = utils.Dom.getEvt(child, "change");
        if (click) {
            this.click = this.createReflexEvent(click);
        }
        if (onload) {
            reflex.ready(this.createReflexEvent(onload));
        }
        if (change) {
            this.change = this.createReflexEvent(change);
        }
        this.reflexEventDefault(child, reflex);
    }

    /**
     * 从dom中反射控件独有的事件，控件内需要有自己事件是需要重写
     * @param child dom的节点
     * @param reflex 反射的对象
     * */
    reflexEventDefault(child, reflex) {

    }

    reflexDom(child, reflex) {
        this.reflexProp(child, reflex);
        this.reflexEvent(child, reflex);
    }

    /**
     * 阻止冒泡
     * @example e.stop();
     * */
    stop() {
        if (this.parent && this.parent instanceof base.ControlEventBase) {
            this.parent.pstop();
        }
    }

    pstop() {
        this._stop = true;
        this.stop();
    }

    //--------阻止冒泡结束
}
/**
 * 事件反射 将dom中的所有元素反射到框架中
 * @author create by heshang
 * */

base.ControlReflex = class {
    constructor() {
        this.debugger = false;
        this.call = null;
        this.caller = null;
        this.box = null;
        this._readyList = [];
        //todo document.onreadystatechange || docuemtn.ready
        let ie = !(window.attachEvent && !window.opera);
        if(!ie){
            if (document.onreadystatechange) {
                document.onreadystatechange = (e) => {
                    if (document.readyState === "interactive") {
                        this.init();
                    }
                }
            } else {
                document.ready = function () {
                    this.init();
                }.bind(this);
            }
        }else{
            document.addEventListener('DOMContentLoaded', ()=>{
                this.init();
            }, false);
        }

    }

    /**
     *  框架的入口函数
     *  @param handler 页面准备完毕的句柄，可以放置多个。
     * */
    ready(handler) {
        this._readyList.push(handler);
    }

    /**
     * 反射初始化
     * */
    init() {
        let box = new control.Box();
        let body = document.body.cloneNode(true);
        document.body.innerHTML = "";
        let dom = body.children;
        for (let i = 0; i < dom.length; i++) {
            this.build(dom[i], box);
        }
        this.box = box;
        document.body.appendChild(box.dom);
        this.runReadyList();
    }

    /**
     *  执行入口函数的监听
     * */
    runReadyList() {
        for (let i in this._readyList) {
            let {call, caller, args} = this._readyList[i];
            // this.call && this.call.call(this.caller, box);
            call.call(caller, this.box, args);
        }
        this._readyList = null;
    }

    startBuild() {

    }

    /**
     * @param child 重铸dom对象
     * */
    build(child, controlObj) {
        if (child.nodeName === "SCRIPT") {
            return;
        }
        let t = this.createControlAtt(child, controlObj);
        this.buildChildren(child.children, t);
    }

    buildChildren(children, t) {
        if (children.length <= 0) {
            return;
        }
        for (let i = 0; i < children.length; i++) {
            this.build(children[i], t);
        }
    }

    checkReflex(nodeName) {
        if (nodeName.indexOf("data-") > -1) {
            return true;
        }
        if (nodeName.indexOf("evt-") > -1) {
            return true;
        }
        return false;
    }

    /**
     *  @param child 子节点对象
     *  @param controlObj 控制逻辑对象
     * */
    createControlAtt(_child, controlObj) {
        let child = _child.cloneNode(false);
        let t = this.makeControl(child);
        for (let i = 0; i < child.attributes.length; i++) {
            let nodeName = utils.Dom.getAttrNodeName(child.attributes[i]);
            let val = utils.Dom.getAttrValue(child.attributes[i]);
            if (!this.checkReflex(nodeName) || this.debugger)
                t.dom.setAttribute(nodeName, val);
        }
        // if (t) {

        t.reflexDom(child, this);

        controlObj.addChild(t);
        // }
        return t;
    }

    /**
     * 根据自定义创建基于结构的对象
     * */
    makeControl(child) {
        try {
            let type = utils.Dom.getAttr(child, "control-type");
            if (!type) {
                return new control.Base(child);
            }
            let a = eval("new " + type + "()");
            return a;
        } catch (e) {
            // let error = new Error("xx");
            let error = new Error("reflex dom is Error：" + `${utils.Dom.getOuterHtml(child)}`);
            error.stack = e.stack;
            // console.error(error);
            throw error;
        }
    }
}
base.reflex = new base.ControlReflex();
errlog.Error = class {
    constructor() {

    }

    static throwError(a, b, c, d, e) {
        let divMask;
        let divDialog;
        let divTitle;
        let divContent;

        function createMask() {
            divMask = $(`<div></div>`);
            divMask.css({
                "position": "absolute",
                "width": "100%",
                "height": "100%",
                "top": 0,
                "left": 0,
                "backgroundColor": "black",
                "opacity": .8,
                "zIndex": 999
            });
            $("body").append(divMask);
        }

        function createDialog() {
            divDialog = $(`<div></div>`);
            divDialog.css({
                "position": "absolute",
                "width": "500px",
                "height": "400px",
                "top": "50%",
                "left": "50%",
                "border-radius": "30px",
                "transform": "translate(-50%,-50%)",
                "backgroundColor": "white",
                "zIndex": 999,
                "overflow": "auto",
            });
        }

        function createTitle() {
            divTitle = $(`<div></div>`);
            divTitle.text("错误提示⚠");
            divTitle.css({
                "fontWeight": "bold",
                "fontSize": "18px",
                "text-align": "center",
                "marginTop": "15px",
            })
            divDialog.append(divTitle);
        }

        function createContent() {
            divContent = $(`<div style="font-size: 14px;padding:25px">
                                <div>
                                    <span>错误信息:</span>
                                    <span style="color:red">${a}</span>
                                </div>
                                <div>
                                    <span>错误堆栈:</span>
                                    <span style="color:red">${e && e.stack}</span>
                                </div>
                                <div>
                                    <span>错误文件:</span>
                                    <span style="color:red">${b}</span>
                                </div>
                                <div>
                                    <span>错误行数:</span>
                                    <span style="color:red">${c}</span>
                                </div>
                                <div>
                                    <span>错误列数:</span>
                                    <span style="color:red">${d}</span>
                                </div>
                            </div>`);
            divDialog.append(divContent);
        }

        createMask();
        createDialog();
        createTitle();
        createContent();
        $(() => {
            $("body").append(divDialog);
            divMask.click(() => {
                divMask.remove();
                divDialog.remove();
            })
        })

    }
}
window.onerror = errlog.Error.throwError;
/**
 * 工具类 一些基础的公共类方法
 * @author create by heshang
 * */
utils.Dom = class {
    /**
     *  将dom本身转换为html字符串
     *  @param node dom节点
     *
     * */
    static getOuterHtml(node) {
        var b = document.createElement("div");
        b.appendChild(node.cloneNode(true));
        return b.innerHTML;
    }

    /**
     *  将字符串转换为dom节点
     *  @param domstr html字符串
     * */
    static parseDom(domstr) {
        var b = document.createElement("div");
        b.innerHTML = domstr;
        return b.children;
    }

    /**
     *获取属性的value
     * */
    static getAttrValue(attr) {
        return attr.value;
    }

    /**
     * 獲取属性的nodeName
     * */
    static getAttrNodeName(attr) {
        return attr.nodeName;
    }

    /**
     * 根据key获取对应的属性
     * */
    static getBasic(tag, node, key) {
        let str = node.getAttribute(tag + key);
        // if (!base.reflex.debugger) {
        //     debugger;
        //     this.removeAttr(node, tag, key);
        // }
        return str ? str : "";
    }

    static getAttr(node, key) {
        return this.getBasic("data-", node, key);
    }

    static getEvt(node, key) {
        return this.getBasic("evt-", node, key);
    }

    static getEvl(node, key) {
        return this.getBasic("evl-", node, key);
    }

    /**
     * 删除对应的attr
     * */
    static removeAttr(child, tag, key) {
        child.removeAttribute(tag + key);
    }
}
utils.Href = class {
    static getQureryString(key, href) {
        var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)", "i");
        if (!href) {
            href = window.location.search;
        } else {
            href = "?" + href.split('?')[1];
        }
        var r = href.substr(1).match(reg);
        if (r != null) return (r[2]);
        return null;
    }
}
utils.Ajax = class {
    static post(url, data, suc, error) {
        $.ajax({
            url: url,
            type: "post",
            data: data,
            dataType: "json",
            success: suc,
            error: error
        });
    }

    static postFormData(url, fd, suc, error) {
        $.ajax({
            url: url,
            type: "POST",
            data: fd,
            processData: false,
            contentType: false,
            success: suc,
            error: error
        });
    }

    static get(url, data, suc, error) {
        $.ajax({
            url: url,
            type: "get",
            data: data,
            dataType: "json",
            success: suc,
            error: error
        });
    }
}


/**
 *  基础的dom结构 把未定义的节点原样构建到本身的dom树中
 *  @param Node 需要遍历的节点
 *  @author create by heshang
 * */
control.Base = class extends base.ControlEventBase {
    constructor(Node, eventCycle) {
        super(eventCycle);
        this.name = "Base";
        this.version = "1.0.0";//控件的版本
        this.author = "heshang";//控件的制作人
        this._value = null;
        if (Node) {
            this._html = $(Node.cloneNode(true));
            this.dom.setAttribute("data-guid", this.guid);
        } else {
            this._html = "";
        }
    }

    /**
     *  获取本类的js对象
     * */
    get dom() {
        if (this.html) {
            return this.html[0];
        } else {
            return "";
        }
    }

    get value() {
        return this._value;
    }

    set value(v) {
        this._value = v;
    }

}
/**
 * 基础的盒子对象
 *
 * @author create by heshang
 * */
control.Box = class extends control.Base {
    constructor(eventCycle) {
        super(eventCycle);
        this.name = "Box";
        this.version = "1.0.0"//控件的版本
        this.author = "heshang";//控件的制作人
        this._html = $(`<div data-guid="${this.guid}"></div>`);
    }

    get dom() {
        return this.html[0];
    }

    set text(t){
        this._text = t;
        this.html.text(t);
    }
}

/**
 * 基础的按钮对象
 * @param text  按钮的显示文本
 * @param eventCycle  事件生命周期
 * @example var b = new control.Button(null,"xxxx");
 * @author create by heshang
 * */
control.Button = class extends control.Base {
    constructor(text = "", eventCycle) {
        super(eventCycle);
        this.name = "Button";    //控件的名称
        this.version = "1.0.0";  //控件的版本
        this.author = "heshang"; //控件的制作人
        this._text = text;
        this._html = $(`<button class="button" data-guid="${this.guid}">${this.text}</button>`);
        this._bindClick();
    }

    offClick() {
    }

    _bindClick() {
        this._html.on("click", function () {
            this.runEvent(base.EventBase.CLICK, this);
        }.bind(this));
    }

    /**
     * 删除自身的属性
     * */
    destorySelfProp() {
        this._text = null;
    }

    /**
     *删除自身的事件
     * */
    destorySelfEvent() {
        this._html.off("click");
    }

    /**
     * 获取dom的显示对象
     * @returns 获取此控件的jsdom对象
     * */
    get dom() {
        return this._html[0];
    }

    /**
     * 设置按钮的显示文本
     * @param t 按钮上的显示文本
     * */
    set text(t) {
        this._text = t;
        this.html.text(this.text);
    }

    get text() {
        return this._text;
    }
}
control.CheckBox = class extends control.Base {
    constructor(name = "", val = "", eventCycle) {
        super(eventCycle);
        this._html = $(`<span></span>`);
        this.inputDom = $(`<input type='checkbox' value="${val}"/>`);
        this.textDom = $(`<span>${name}</span>`);
        this._html.append(this.inputDom);
        this._html.append(this.textDom);
        this.value = val;
        this.controlName = name;
        this._checked = false;
        this._groupName = "";
        this._showType = "";
        this._text = name;
        this.bindEvent();
    }

    set text(t) {
        this._text = t;
        this.textDom.text(t);
    }

    get text() {
        return this._text;
    }

    set groupName(n) {
        this._groupName = n;
        this.inputDom.attr("name", n);
    }

    bindEvent() {
        this._html.on("click", () => {
            this.runEvent(base.EventBase.CLICK);
            this.checked = !this.checked;
        })
    }

    set change(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.CHANGE, handler);
    }

    set click(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.CLICK, handler);
    }

    set showType(t) {
        this.inputDom.addClass(t);
        this._showType = t;
    }

    get checked() {
        return this._checked;
    }

    set checked(b) {
        this.inputDom.prop("checked", b);
        this._checked = b;
        if (this._parent) {
            this._parent.changeSelectedIndex(this);
        }
        this.runEvent(base.EventBase.CHANGE);
    }

    get dom() {//返回原生的js   Dom对象
        return this._html[0];
    }

    destorySelfEvent() {
        this._html.off("click");
    }

    destorySelfProp() {

    }
}
control.CheckGroup = class extends control.Base {
    constructor(name, eventCycle) {
        super(eventCycle);
        this._selectIndex = [];
        this._selectItem = [];
        this._groupName = name;
        this._html = $("<span></span>");
    }

    get dom() {
        return this._html[0];
    }

    set change(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.CHANGE, handler);
    }

    reflexPropSelf(child, reflex) {
        let name = utils.Dom.getAttr(child, "groupName");
        reflex.ready(base.Handler.create(function () {
            this.groupName = name;
        }, this));
    }

    changeSelectedIndex(item) {
        let checked = item.checked;
        let index = this.childList.indexOf(item);
        let itemIndex = this._selectIndex.indexOf(index);
        if (itemIndex < 0 && checked) {
            this._selectIndex.push(index);
        } else if (!checked && itemIndex >= 0) {
            this._selectIndex.splice(itemIndex, 1);
        }
        this.selectIndex.sort();
        this.runEvent(base.EventBase.CHANGE);
    }

    set groupName(name) {
        for (let i = 0; i < this.childList.length; i++) {
            this.childList[i].groupName = name;
        }
    }

    get groupName() {
        return this._groupName;
    }

    addChildOther(node) {
        node.groupName = this.groupName;
    }

    get selectIndex() {
        return this._selectIndex;
    }

    set selectIndex(b) {
        if (this.debugger) {
            if (!(b instanceof Array)) {
                console.warn(b + "< is not array");
                return;
            }
        }
        this._selectIndex = b;
        for (let i = 0; i < b.length; i++) {
            if (this.childList[i]) {
                this.childList[i].checked = false;
            }
            if (!this.childList[b[i]]) {
                continue;
            }
            if (this.childList[b[i]]) {
                this.childList[b[i]].checked = true;
            }
        }
    }

    selectedBool(b) {
        for (let i = 0; i < this.childList.length; i++) {
            this.childList[i].checked = b;
        }
    }

    selectRevert() {
        for (let i = 0; i < this.childList.length; i++) {
            this.childList[i].checked = !this.childList[i].checked;
        }
    }
}
/**
 * select级联下拉框
 * @param obj 配置参数 
 * @param eventCycle 事件生命周期 
 * @example 1.  DOM反射
        * <comboBox
            data-control-type="control.ComboBox"
            data-selectList=[{
                value: 'xx',
                index: 'x',
                name: 'xxx',
                child: []
            }] >
        </comboBox>
 * @example 2. 实例化
 *      new control.ComboBox({
            selectList : [],                                   // 数据
            selectNotFoundText: '无数据',                      // 当没有数据时显示什么             默认显示[无匹配数据]
            defaultIndex : '1',                               // 设置默认当的前选中值，            默认选中第一个
            disUsed: false,                                   // 是否禁用                        默认false
            comboBoxStyle: control.ComboBox.DEFAULT_STYLE,    // 选择定义好的样式,或者是自己定义的class名  默认橙色皮肤
            disScroll: false                                  // 是否隐藏滚动条                   默认false
        });
 * @author create by hehe
 * */
control.ComboBox = class extends control.Base {
    constructor(obj = {}, eventCycle) {
        super(eventCycle);
        this.name = "ComboBox";
        this.version = "1.0.0";
        this.author = "hehe";

        this._html = $(`<div class="comboBox"></div>`);
        this.selectionDom = $(`<div class="comboBox-selection"></div>`);
        this.selectionPlaceholderDom = $(`<span class="comboBox-selection-placeholder">请选择</span> `);
        this.selectionArrowDom = $('<div><i class="comboBox-selection-arrow"></i></div>');
        this.selectionDom.append(this.selectionPlaceholderDom);
        this.selectionDom.append(this.selectionArrowDom);

        this.selectDropDownDom = $(`<div class="comboBox-dropdown"></div>`);
        this.selectDropDownNotFoundDom = $(`<div class="comboBox-dropdown-notfound">无匹配数据</div> `);
        this.selectOptionDom = $(`<ul class="comboBox-dropdown-list"></ul>`);
        // this.selectDropDownLoadDom = $(`<div class="comboBox-dropdown-loading">加载中...</div>`)
        this.selectDropDownDom.append(this.selectDropDownNotFoundDom);
        this.selectDropDownDom.append(this.selectOptionDom);
        // this.selectDropDownDom.append(this.selectDropDownLoadDom);

        this._html.append(this.selectionDom);
        this._html.append(this.selectDropDownDom);
        // 数据
        this._selectList = obj.selectList || [];
        // 无匹配数据时显示内容
        this._selectNotFoundText = obj.selectNotFoundText || '无匹配数据';
        // 默认选中
        this._defaultIndex = obj.defaultIndex || '';
        // 默认样式
        this._comboBoxStyle = obj.comboBoxStyle || '';
        // 当前选中内容（name value）
        this._curSelectObj = {};
        // 当前选中的子级
        this._curSelectChildArr = [];
        this._disUsed = obj.disUsed || false;
        // 是否隐藏进度条
        this._disScroll = obj.disScroll || false;
        // 初始化渲染页面
        this._renderSelectList();
        this._init();
    }

    _init() {
        this.disUsed = this._disUsed;
        this.disScroll = this._disScroll;
        this.comboBoxStyle = this._comboBoxStyle;
    }
    _bindEvent() {
        
        this._html.on("click", (e) => {
            // 初始化所有combobox样式
            $('.comboBox .comboBox-dropdown').slideUp();
            $('.comboBox-selection div').removeClass('comboBox-transform');
            e.stopPropagation(); 
            this.runEvent(base.EventBase.CLICK);
            // 伸缩效果
            if ($(this.selectDropDownDom).is(":hidden")) { 
                this.selectDropDownDom.slideDown(200);
                $(this.selectionDom[0].children[1]).addClass('comboBox-transform');
            } else {
                this.selectDropDownDom.slideUp(200);
                $(this.selectionDom[0].children[1]).removeClass('comboBox-transform');
            }
        })
        $(document).on('click', () => {
            this.selectDropDownDom.slideUp();
            $(this.selectionDom[0].children[1]).removeClass('comboBox-transform');
        })
    }
    /**
     * @returns {boolean} 返回当前控件是否被禁用
     * */
    get disUsed() {
        return this._disUsed;
    }
    /** 
     * @param v 设置当前控件是否被禁用
     * */
    set disUsed(v) {
        if (v) {
            this.selectionDom.addClass('comboBox-disable');
            this.selectionArrowDom.css('display', 'none');
            this.selectOptionDom.css('display', 'none');
            this._html.unbind('click');
        } else {
            this.selectionDom.removeClass('comboBox-disable');
            this.selectionArrowDom.css('display', 'block');
            this.selectOptionDom.css('display', 'block');
            this._html.unbind('click');
            // 绑定点击事件 
            this._bindEvent();
        }
    }
    /**
     * @returns {boolean} 返回当前控件是否隐藏进度条
     * */
    get disScroll() {
        return this._disScroll;
    }
    /** 
     * @param v 设置当前控件是否隐藏进度条
     * */
    set disScroll(v) {
        if (v) { 
            this.selectDropDownDom.css('overflow', 'hidden');
            this.selectOptionDom.css({ 'overflow-y': 'scroll', 'width': '1000px', 'height': '150px' });
        } else {
            this.selectDropDownDom.css('overflow-y', 'auto');
            this.selectOptionDom.css({ 'overflow-y': 'initial'});
        }
    }

    /** 
     * @param v 设置当前控件皮肤样式
     * */
    set comboBoxStyle(v) {
        switch (v) {
            case control.ComboBox.DEFAULT_STYLE:
                this.html.addClass("comboBox-defaultStyle");
                break;
            default:
                if (v) {
                    // 设置的自定义样式
                    this.html.removeClass("comboBox-defaultStyle");
                    this.html.addClass(v);
                } else {
                    this.html.addClass("comboBox-defaultStyle");
                }
                break;
        }
    }
    /**
     * @returns {string} 返回当前控件皮肤样式
     * */
    get comboBoxStyle() {
        return this._comboBoxStyle;
    }

    /** 
     * @param v 设置当前选中内容
     * */
    set curSelectObj(v) {
        this._curSelectObj = v;
        this.selectionPlaceholderDom.text(v.name);
    }
    /**
     * @returns {string} 返回当前选中的内容
     * */
    get curSelectObj() {
        return this._curSelectObj;
    }

    /**
     * @returns {string}  返回当前选中内容的子级
     * */
    get curSelectChildArr() {
        return this._curSelectChildArr;
    }
    /** 
     * @param v 设置当前选中内容的子级
     * */
    set curSelectChildArr(v) {
        this._curSelectChildArr = v;
    }

    //初始化渲染列表
    _renderSelectList(valArr = this._selectList) {
        // 1.清空列表
        this.selectOptionDom.empty();
        this.selectDropDownNotFoundDom.text(this._selectNotFoundText);
        // this.selectDropDownLoadDom.css('display', 'block');  
        this.selectDropDownNotFoundDom.css('display', 'none');
        // 2.判断如果是空数组，显示对应描述文字，并返回
        if (!valArr || valArr.length == 0) {
            this.selectDropDownNotFoundDom.css('display', 'block');
            // this.selectDropDownLoadDom.css('display', 'none');
            this.selectOptionDom.empty();
            this.curSelectObj = {
                name: '',
                value: ''
            };
            this.selectionPlaceholderDom.text('-');
            return;
        }

        let flag = true;
        // 3遍历数组
        for (let i = 0; i < valArr.length; i++) {
            let valChildObj = valArr[i];
            let name = valChildObj.name;
            let val = valChildObj.value;
            let index = valChildObj.index;
            let child = valChildObj.child;
            let liDom = $(`<li class="comboBox-dropdown-item" data-val="${val}">${name}</li>`);
            let liArrowDom = $(`<span class="comboBox-arrow">></span>`);
            // 4判断如果是当前选中则添加样式
            if (this._defaultIndex) {
                if (this._defaultIndex === index && flag) {
                    this.curSelectObj = {
                        name: name,
                        value: val
                    };
                    this.curSelectChildArr = child;
                    liDom.addClass('comboBox-selectStyle').siblings().removeClass('comboBox-selectStyle');
                    this.selectionPlaceholderDom.text(name);
                    flag = false;
                }
            } else {
                if (i == 0) {
                    liDom.addClass('comboBox-selectStyle').siblings().removeClass('comboBox-selectStyle');
                    this.selectionPlaceholderDom.text(name);
                    this.curSelectObj = {
                        name: name,
                        value: val
                    };
                }
            }
            // 5 插入dom
            this.selectOptionDom.append(liDom);
            // 6 注册点击事件
            liDom.on("click", () => {
                let obj = {
                    name: name,
                    val: val
                }
                this.curSelectChildArr = child;
                this.curSelectObj = obj;
                this.selectionPlaceholderDom.text(name);
                this.runEvent(base.EventBase.CHANGE);
                if (name === this.curSelectObj.name) {
                    liDom.addClass('comboBox-selectStyle').siblings().removeClass('comboBox-selectStyle');
                }
            })
            // if (i == valArr.length - 1) {
            //     this.selectDropDownLoadDom.css('display', 'none')
            // }
        }
    }

    /**
     * @returns {string} 返回此控件数据列表
     * */
    get selectList() {
        return this._selectList;
    }
    /**
     * 设置数据列表
     * @param valArr 对象数组类型的数据列表
     * */
    set selectList(valArr) {
        this._selectList = [];
        this.selectOptionDom.empty();
        this._selectList = valArr;
        this._renderSelectList();
    }

    /**
     * 设置无匹配内容时显示的内容
     * @param v 无匹配内容时显示的内容
     * */
    set selectNotFoundText(v) {
        this._selectNotFoundText = v;
        this.selectDropDownNotFoundDom.text(v);
    }
    /**
     * 获取无匹配内容时显示的内容
     * @returns {string} 返回此控件无匹配内容时显示的内容
     * */
    get selectNotFoundText() {
        return this._selectNotFoundText;
    }

    /**
     * 设置默认选中值
     * @param v 默认选中值
     * */
    set defaultIndex(v) {
        this._defaultIndex = v;
        this._renderSelectList();
    }
    /**
     * 获取默认选中哪一个值
     * @returns {string} 返回此控件的初始化选中值
     * */
    get defaultIndex() {
        return this._defaultIndex;
    }

    // 映射
    reflexPropSelf(child, reflex) {
        let ListVal = utils.Dom.getAttr(child, "selectList");
        let NotFoundTextVal = utils.Dom.getAttr(child, "selectNotFoundText");
        let IndexVal = utils.Dom.getAttr(child, "defaultIndex");
        let StyleVal = utils.Dom.getAttr(child, "defaultStyle");
        let disUsedVal = utils.Dom.getAttr(child, "disUsed");
        let disScrollVal = utils.Dom.getAttr(child, "disScroll");
        this.selectList = eval(ListVal);
        this.selectNotFoundText = eval(NotFoundTextVal);
        this.defaultIndex = eval(IndexVal);
        this.comboBoxStyle = eval(StyleVal);
        this.disUsed = eval(disUsedVal);
        this.disScroll = eval(disScrollVal);
    }

    /**
     * 获取dom的显示对象
     * @returns {string} 获取此控件的jsdom对象
     * */
    get dom() {
        return this._html[0];
    }

    // 销毁事件
    destroySelfEvent() {
        this._html.off("click");
        this._html.off("change");
    }
    // 销毁属性
    destroySelfProp() {
        this._selectList = null;
        this._selectNotFoundText = null;
        this._defaultIndex = null;
        this._comboBoxStyle = null;
        this._curSelectObj = null;
        this._curSelectChildArr = null;
        this._disUsed = null;
        this._disScroll = null;
        this._html = null;
    }

}

control.ComboBox.DEFAULT_STYLE = 0;
/**
 * 图片控件
 * 
 * @author wuji
 */
control.Image = class extends control.Base{
    /**
     * 
     * @param {宽} width 
     * @param {高} height 
     * @param {周期状态} eventCycle 
     */
    constructor(width,height,eventCycle){
        super(eventCycle);
        this._imgDom = $("<img>");
        this._width = width||"0px";
        this._height = height||"0px";
        this._imgDom.attr("width",`${width||0}px`);
        this._imgDom.attr("height",`${height||0}px`);
        this._src = "";
        this._html = $(`<span></span>`);
        this._contextCan=null;
        this._image=null;
        if(!width){
            this._widthSetted = false;
        }
        if(!height){
            this._heightSetted = false;
        }
        
        this._html.append(this._imgDom);
        this._bindEvent();
    }

    _bindEvent(){
        this._imgDom.on("click",function(ev){
            // console.log(ev);
        });
       
    }
    getPixelData(x,y){
        if(this._contextCan!=null&&this._image.complete==true){
            return contextCan.getImageDate(x,y,1,1);
        }else{
            return null;
        }
    }
    _drawImageSource(){
        if(this._src && this._src !== ""){
            this._image = new Image();
            let canvasDes = document.createElement("canvas");
            this._image.onload = function(){
                if(!this._widthSetted){
                    canvasDes.attr("width",this._width+"px");
                }
                if (!_this._heightSetted){
                    canvasDes.attr("height",this._height+"px");
                }
                console.log("width is:",this._width," height is:",this._height);
                this._contextCan = canvasDes[0].getContext("2d");
            }
        }
    }

    reflexPropSelf(child,reflex){
        console.log("child is:::",child);
        let width = utils.Dom.getAttr(child,"showWidth");
        if(width && width !== ""){
            this._widthSetted = true;
            this._imgDom.attr("width",width);
        }

        let height = utils.Dom.getAttr(child,"showHeight");
        if(height && height !== ""){
            this._heightSetted = true;
            this._imgDom.attr("height",height);
        }

        let src = utils.Dom.getAttr(child,"showSrc");
        this._imgDom.attr("src",src);
    }

    get showSrc(){
        return this._imgDom.attr("src");
    }

    set showSrc(src){
        this._src = src;
        this._imgDom.attr("src",src);
        this._drawImageSource();
    }

    get showWidth(){
        return this._imgDom.attr("width");
    }

    set showWidth(width){
        this._width = width;
        this._widthSetted = true;
        this._imgDom.attr("width",width);
    }

    get showHeight(){
        return this._imgDom.attr("height");
    }

    set showHeight(height){
        this._height = height;
        this._heightSetted = true;
        this._imgDom.attr("height",height);
    }
    
    destroySelfEvent(){
        this._inputDom.off("click");
    }

    destroySelfProp(){
        this._width = null;
        this._height = null;
        this._src = null;
        this._widthSetted=null;
        this._heightSetted=null;
        this._imgDom=null;
        this._contextCan=null;
        this._image=null;
    }


}   
control.ImgButton = class extends control.Base {
    constructor(normorl='',over='',down='',text="",ev) {
        super(ev);
        this.name = "ImgButton";    //控件的名称
        this.version = "1.0.0";  //控件的版本
        this.author = "fengche"; //控件的制作人
        this._text = text; //控间文本
        this._normorl = normorl;//控间默认背景图显示
        this._over = over;//控间划过背景图显示
        this._down = down;//控间鼠标落下背景图显示
        this._bgSrc = normorl;//控间默认的背景图
        this._align = 'left'//控间文本位置  接收所有text-align属性值
        this._vertical = 'top'//控间文本位置  接收所有text-vertical属性值
        this._divDom = $(`<div style="position:absolute">${this._text}</div>`)
        let html = $(`<button class="button" data-guid="${this.guid}" style="position: relative; border: null; padding:0; margin: 0;"></button>`);
        html.append(this._divDom);
        this._html = html;
        this._bindEvent();
    }

    reflexPropSelf(child, reflex) {
        let normorl = utils.Dom.getAttr(child, "normorl");
        let over = utils.Dom.getAttr(child, "over");
        let down = utils.Dom.getAttr(child, "down");
        let width = utils.Dom.getAttr(child, "width");
        let height = utils.Dom.getAttr(child, "height");
        let align = utils.Dom.getAttr(child, "align");
        let vertical = utils.Dom.getAttr(child, "vertical");
        this.normorl = normorl;
        this.over = over;
        this.down = down;
        this.width = width;
        this.height = height;
        this.align = align;
        this._bgSrc = normorl;
        this.vertical = vertical;
    }

    /**
     * 设置按钮的默认背景
     * @param n 按钮上的显默认背景
     * */
    set normorl(n){
        this._normorl = n;
        this._bgSrc = n;
        this._html.css("background",`url(${this._bgSrc}) no-repeat`);
        this._html.css("background-size",`100% 100%`);
    }
    /**
     * 设置按钮的划过背景
     * @param o 按钮上的显划过背景
     * */
    set over(o){
        this._over = o;
    }
    /**
     * 设置按钮的鼠标落下背景
     * @param d 按钮上的显鼠标落下背景
     * */
    set down(d){
        this._down = d;
    }
    /**
     * 设置按钮宽度
     * @param t 按钮宽度
     * */
    set width(w){
        this._width = w;
        this._html.css("width",w);
        this._divDom.css('width', w)
    }
    get width(){
        return this._width
    }

    /**
     * 设置按钮高度
     * @param h 按钮高度
     * */
    set height(h){
        this._height = h;
        this._html.css("height",h);
    }
    get height(){
        return this._height
    }
    /**
     * 设置按钮的文字上下位置
     * @param v 按钮上文字上下位置
     * */
    set vertical(v){
        this._vertical = v;
        if(v == 'top'){
            this._divDom.css('top',0);
            this._divDom.css('transform','translateY(0)');
        } else if(v == 'middle') {
            this._divDom.css('top','50%');
            this._divDom.css('transform','translateY(-50%)');

        } else if(v == 'bottom'){
            this._divDom.css('top','100%');
            this._divDom.css('transform','translateY(-100%)');

        } else{
            console.warn('您输入的值有误， 请重新输入');
            return;
        }
    }
    get vertical(){
        return this._vertical
    }
    /**
     * 设置按钮的文字左右位置
     * @param a 按钮上文字左右位置
     * */
    set align(a){
        if(a === 'left' || a === "center" || a === 'right') {
            this._align = a;
            this._divDom.css('text-align',a);
        } else {
            console.warn('您输入的值有误， 请重新输入');
            return;
        }
    }
    get align(){
        return this._align
    }
    offClick() {
    }


    set mouseout(handler){
        this._event[base.EventBase.MOUSE_OUT] = handler;
    }

    set mouseover(handler){
        this._event[base.EventBase.MOUSE_OVER] = handler;
    }

    set mousedown(handler){
        this._event[base.EventBase.MOUSE_DOWN] = handler;
    }

    set mouseup(handler){
        this._event[base.EventBase.MOUSE_UP] = handler;
    }

    _bindEvent() {
        this._html.on("click", function () {
            this.runEvent(base.EventBase.CLICK, this);
        }.bind(this));

        this._html.on("mouseover", function () {
            this._bgSrc = this._over;
            this._html.css({'background': `url(${this._bgSrc}) no-repeat`, "background-size": '100% 100%'})
            this.runEvent(base.EventBase.MOUSE_OVER, this);
        }.bind(this));

        this._html.on("mouseout", function () {
            this._bgSrc = this._normorl;
            this._html.css({'background': `url(${this._bgSrc}) no-repeat`, "background-size": '100% 100%'})
            this.runEvent(base.EventBase.MOUSE_OUT, this);
        }.bind(this));

        this._html.on("mousedown", function () {
            this._bgSrc = this._down;
            this._html.css({'background': `url(${this._bgSrc}) no-repeat`, "background-size": '100% 100%'})
            this.runEvent(base.EventBase.MOUSE_DOWN, this);
        }.bind(this));

        this._html.on("mouseup", function () {
            this._bgSrc = this._over;
            this._html.css({'background': `url(${this._bgSrc}) no-repeat`, "background-size": '100% 100%'})
            this.runEvent(base.EventBase.MOUSE_UP, this);
        }.bind(this));

    }

    /**
     * 获取dom的显示对象
     * @returns 获取此控件的jsdom对象
     * */
    get dom() {
        return this._html[0];
    }

    /**
     * 设置按钮的显示文本
     * @param t 按钮上的显示文本
     * */
    set text(t) {
        this._text = t;
        this._divDom.text(t);
    }

    get text() {
        return this._text;
    }
    destorySelfProp(){
        this._normorl = null;
        this._over = null;
        this._down = null;
        this._width = null;
        this._height = null;
        this._align = null;
        this._bgSrc = null;
        this._vertical = null;
        this._divDom = null;
        this._html = null;
    }
    destorySelfEvent(){
        this._html.off('mouseup').off('mouseout').off('mousedown').off('mouseover').off('click');
    }
}

/**
 * 基础的输入对象
 * @param eventCycle 事件生命周期
 *
 * @author create by heshang
 * */
control.Input = class extends control.Base {
    constructor(eventCycle) {
        super(eventCycle);
        this.name = "Input";
        this.version = "1.0.0"//控件的版本
        this.author = "heshang";//控件的制作人
        let html = `<span data-guid="${this.guid}">
                        <input type="text"/>
                    </span>`
        this._html = $(html);
    }

    set text(s) {
        this.html.find('input').val(s);
    }

    get text() {
        return this.html.find('input').val();
    }

    get dom() {
        return this.html[0];
    }

}
/**
 * 基础的文本显示对象
 *  @param text 文本对象
 *  @param eventCycle 生命周期
 *  @author create by heshang
 * */
control.Label = class extends control.Base {
    constructor(text = "", eventCycle) {
        super(eventCycle);
        this.name = "Label";
        this.version = "1.0.0"//控件的版本
        this.author = "heshang";//控件的制作人
        let _this = this;
        this.vuebox = $(`<div id="box_${this.guid}"></div>`);
        this.data = {
            msg: text
        }
        this._html = `<span data-guid="${this.guid}" ref="myBox" @click="click">{{msg}}</span>`
    }

    checkVue() {
        if (!this.vue) {
            let _this = this;
            if(this.parent){
                this.parent.dom.appendChild(this.vuebox[0]);
            }else{
                document.body.appendChild(this.vuebox[0]);
            }
            this.vue = new Vue({
                el: `#box_${this.guid}`,
                template: this.html,
                data() {
                    return _this.data;
                },
                methods: {
                    click: function () {
                        _this.runEvent(base.EventBase.CLICK, _this);
                    }
                }
            });
        }
    }

    get dom() {
        this.checkVue();
        return this.vue.$refs.myBox;
    }

    set text(s) {
        this.data.msg = s;
    }
    get text(){
        return this.data.msg;
    }
}
control.Menu = class extends control.Base {
    /**
     * 菜单(menu)控件
     * @param subItems  控件的子菜单项
     * @param menuType  控件的类型
     * @param eventCycle
     * @example <menu data-control-type="control.Menu" data-menuType="appMenu">
     * @author created by lingyan
     * @Method: addChild(node)
     */
    constructor(subItems = new Array(),menuType,eventCycle){
        super(eventCycle);
        this.name = "Menu";                                             //控件的名称
        this.version = "1.0.0";                                         //控件的版本
        this.author = "lingyan";                                        //控件的制作人
        this._childList = subItems?subItems:[];                         //控件的子菜单项
        this._menuType = menuType?menuType:control.Menu.MenuType.APP_MENU;                //控件的类型
        this._acceleratorKeyDic = new Array();                          //初始化快捷键数组
    }


    /**
     * @private
     * 根据子项获取当前的 html
     */
    _getHtml() {
        switch (this._menuType){
            case control.Menu.MenuType.APP_MENU:
                this._subDom = $(`<ul class="appMenu"></ul>`);
                break;
            case control.Menu.MenuType.RIGHT_MENU:
                this._subDom = $(`<ul class="rightMenu"></ul>`);
                break;
        }
        this._html = this._subDom;
        this._bindEvent();
    }

    /**
     * @private
     * 绑定menu对应的事件
     */
    _bindEvent(){
        let _this = this;
        window.onkeydown = function (event) {
            if(!_this._acceleratorKeyDic){
                return;
            }
            let _command ="";
            if(event.altKey){
                _command += "alt+";
            }
            if(event.ctrlKey){
                _command += "ctrl+";
            }
            if (event.shiftKey){
                _command += "shift+";
            }
            _command += event.key.toLowerCase();
            // 触发点击事件
            if(_this._acceleratorKeyDic[_command]){
                _this._acceleratorKeyDic[_command].clickFunc();
            }
            // 实现的效果是菜单显示的时候点击相应的按键就能触发点击事件
            let _singleComm = event.key.toLowerCase();
            for(let key in _this._acceleratorKeyDic){
                if(key.toLowerCase().includes(_singleComm) && _this._acceleratorKeyDic[key]._parent.showItem){
                    _this._acceleratorKeyDic[key].clickFunc();
                }
            }
        }

        // 当失去焦点的时候，所有的子菜单隐藏显示
        this._html.on("blur", ()=>{
            if(_this._childList){
                for(let item of _this._childList){
                    item.showItem = false;
                }
            }
        });
    }

    /**
     * @private
     * 递归遍历获取所有的快捷键
     * @param subItems
     */
    _getAllKeys(subItems){
        if(!subItems){
            return;
        }
        for(let item of subItems){
            if(item && item.accelerator){
                this._acceleratorKeyDic[item.accelerator.toLowerCase()] = item;
            }
            if(item && item.childList){
                this._getAllKeys(item.childList);
            }
        }
    }

    /**
     * 添加子项方法 都要获取快捷键
     * @param node
     */
    addChild(node){
        super.addChild(node);
        this._getAllKeys([node]);
    }

    /**
     * 设置当前的子项
     * @param b
     */
    set childList(b){
        this._childList = b;
        if(b){
            for(let item of b){
                item._parent = this;
            }
        }
    }

    /**
     * 获取整个菜单的快捷键数据结构
     * key:快捷键字符串
     * value:快捷键对应的子项对象实例
     * @returns {快捷键数据}
     */
    get accelerator(){
        return this._accelerator;
    }

    /**
     * 设置整个菜单的快捷键数据结构
     * @param k
     */
    set accelerator(k){
        this._accelerator = k;
    }

    /**
     * 获取当前菜单的dom结构
     * @returns {dom结构}
     */
    get dom() {
        if(!this._html){
            this._getHtml();
        }
        return this._html[0];
    }

    /**
     * 删除自身的属性
     * */
    destorySelfProp() {
        this._accelerator = null;
        this._subItems = null;
        this._acceleratorKeyDic = null;
        this._menuType = null;
        this._html = null;
        this._childList = null;
        this._subDom = null;
    }

    /**
     *删除自身的事件
     * */
    destorySelfEvent() {
        this._html.off("blur");
    }

    /**
     * reflex自身属性
     * @param child
     * @param reflex
     */
    reflexPropSelf(child, reflex){
        let menuType = utils.Dom.getAttr(child, "menuType");
        if (menuType) {
            this._menuType = menuType;
        }
        this._getHtml();
    }
};

/**
 * 当前菜单的类型
 * @type {{NORMAL: string, SEPARATOR: string, SUBMENU: string}}
 */
control.Menu.MeunItemType= {
    NORMAL: "normal",
    SEPARATOR: "separator",
    SUBMENU: "submenu"
};
/**
 * 菜单的类型，目前仅仅支持应用程序菜单和右键菜单
 * @type {{APP_MENU: string, RIGHT_MENU: string}}
 */
control.Menu.MenuType={
    APP_MENU:"appMenu",
    RIGHT_MENU:"rightMenu"
};

/**
 *菜单栏的快捷键选项
 **/
control.Menu.MeunAccelerator= {
    Command: "Cmd",
    Control: "Ctrl",
    CommandOrControl: "CmdOrCtrl",
    Alt: "Alt",
    Option: "Option",
    AltGr: "AltGr",
    Shift: "Shift",
    Super: "Super"
};


control.MenuItem = class extends control.Base {
    /**
     * 菜单项的构造方法
     * @param label 当前的标签
     * @param subItems 当前菜单的子项集合
     * @param clickFunc 当前菜单单机触发的事件
     * @param type 当前菜单的类型
     * @param accelerator 当前菜单的快捷键
     * @param icon 当前菜单的图标
     * @param enable 当前菜单是否可用
     * @param eventCycle 当前菜单的周期状态
     * @example <menuItem data-control-type="control.MenuItem" data-label="标准型(T)" data-index="1" data-type="normal" data-accelerator="Alt+1"></menuItem>
     * @author created by lingyan
     */
    constructor(label, index, subItems, clickFunc, type, accelerator, icon, enable = true, eventCycle) {
        super(eventCycle);
        this.name = "MenuItem";                                     // 控件的名称
        this.version = "1.0.0";                                     // 控件的版本
        this.author = "lingyan";                                    // 控件的制作人
        this._label = label;                                        // 获取当前标签的内容
        this._index = index ? index : 1;                            // 获取当前标签的索引，0代表第一级标签，非0代表非一级标签
        this._childList = subItems ? subItems : [];                 // 当前菜单的子菜单，这时候子菜单已经初始化完成了
        this._accelerator = accelerator;                            // 当前菜单的快捷键
        this._icon = icon;                                          // 当前菜单需要展示的图标
        this._enable = enable ? enable : false;                     // 当前菜单是否可用
        this._type = type ? type : control.Menu.MeunItemType.NORMAL;     // 当前菜单的类型，是app菜单还是右键菜单
        this._showItem = false;                                     // 默认不显示子菜单
        this._getFocused = false;                                   // 当前菜单是否处于获取焦点状态，如果处于获取焦点状态，只要经过菜单项就会显示子菜单，否则不显示，点击子菜单获取焦点，再次点击失去焦点，点击非菜单区域失去焦点
        this._clickFunc = clickFunc;
        this._getHtml();
    }
    /**
     * 获取当前的html
     * @private
     */
    _getHtml() {

        switch (this._type) {
            //分隔线
            case control.Menu.MeunItemType.SEPARATOR:
                this._currentDom = $(`<li class="separator-menuItem"></li>`);
                break;
            //当是正常菜单项的时候 也分两种 一种是初级菜单项 横向显示，另一种是非初级菜单项，纵向显示
            case control.Menu.MeunItemType.NORMAL:
                // 第一组子项，横向显示
                if (this._index == 0) {
                    this._currentDom = $(`<li class="normal-menuItem-first"><span>${this.label}</span></li>`);
                    this._subDom = $(`<ul class="normal-menu-first"></ul>`);
                }
                else {
                    this._currentDom = $(`<li class="normal-menuItem"></li>`);
                    this._initStyle(3);
                    this._subDom = $(`<ul class="normal-menu"></ul>`);
                }
                break;
            default:
                break;
        }
        //如果该菜单项包含子菜单，默认是隐藏的
        if (this._subDom) {
            this._subDom.hide();
            this._currentDom.append(this._subDom);
        }
        this._html = this._currentDom;
        this._bindEvent();

        // 初始化鼠标点击事件
        this.clickFunc = ()=>
        {
            if(this.index==0){
                this._getFocused = !this._getFocused;
            }
            if (this._clickFunc) {
                this._clickFunc;
            }
            this.showItem = !this._showItem;
        }
        this._currentDom.on("click", () => {
                this.clickFunc();
        });
    }

    /**
     * 根据不同的菜单选项类型初始化样式，可以考虑部分样式的设置是否可以通过属性来设置
     * @param index:代表了当前菜单选项的类型，1表示分隔线，2表示一级菜单项，3代表非一级菜单
     */
    _initStyle(index) {
        switch (index) {
            case 3:
                //如果存在图标，将图标添加到html中
                if (this.icon) {
                    let iconDom = $(`<img src="${this.icon}"/>`);
                    this._currentDom.append(iconDom);
                }
                //添加标签
                this._currentDom.append($(`<span class="normal-menuItem-label" style="left: ${this.icon?40:10 + "px"}">${this.label}</span>`));
                //如果存在快捷键
                if (this._accelerator) {
                    this._acceleratorDom = $(`<span class="normal-menuItem-accelerator">${this._accelerator}</span>`);
                    // 这个时候该菜单的宽度还没有确定，只有初始化父菜单的时候子菜单的宽度才能确定，所以这里的快捷键的位置
                    // 需要在设置宽度的时候设置
                    this._currentDom.append(this._acceleratorDom);
                }
                // 如果存在子菜单列表 应该绘制向右的箭头
                if (this._childList && this._childList.length > 0) {
                    let rightDom = $(`<span class="normal-menuItem-right" style="vertical-align: middle;"></span>`);
                    this._currentDom.append(rightDom);
                }
                break;
        }
    }


    /**
     * @private 绑定事件
     */
    _bindEvent() {
        // 鼠标进图的状态分为两种，一种是初级菜单，另一种是非初级菜单，非初级菜单 鼠标进入除了样式的改变还要显示子菜单项。
        // 初级菜单当获取焦点的时候显示子菜单项，否则不显示
        this._currentDom.on("mouseenter", () => {
            if ((this.index == 0 && this.getFocused) || (this.index > 0)) {
                this.showItem = true;
            }
        });
        this._currentDom.on("mouseleave", () => {
            this.showItem = false;
        });
    }

    /**
     * 由于控件特殊性，重写addChild方法
     * @param node
     */
    addChild(node){
        this.eventCycle.runEvent(base.EventBase.LOAD_BEFORE);
        node._parent = this;
        this._childList.push(node);
        if (node.dom && this._subDom && this.type != control.Menu.MeunItemType.SEPARATOR) {
            this._subDom.append(node.dom);
            this._subDom.css("width", this.maxWidth + "px");
        }
        node.setControllerItem(node.guid, node.guid);
        this.eventCycle.runEvent(base.EventBase.LOAD_COMPLETE);
    }

    get getFocused(){
        return this._getFocused;
    }

    /**
     * 获取当前列表菜单是否显示
     * @returns {boolean|*}
     */
    get showItem() {
        return this._showItem;
    }

    /**
     * 设置当前列表菜单是否显示
     * @param b
     */
    set showItem(b) {
        //如果是一级菜单 只能显示一个子菜单
        if(b && this._index ===0){
            for(let item of this._parent.childList){
                item.showItem = false;
            }
        }
        this._showItem = b;
        if (this._subDom) {
            this._showItem ? this._subDom.show() : this._subDom.hide();
        }
    }
    /**
     * 获取当前菜单的标签
     * @returns {*}
     */
    get index() {
        return this._index;
    }

    /**
     * 设置当前菜单的标签
     * @param str
     */
    set index(index) {
        this._index = index;
    }

    /**
     * 获取当前菜单的标签
     * @returns {*}
     */
    get label() {
        return this._label;
    }

    /**
     * 设置当前菜单的标签
     * @param str
     */
    set label(str) {
        this._label = str;
    }

    /**
     * 设置当前的子项菜单列表
     * @param items
     */
    set childList(items) {
        this._childList = items;
        if(!items || items.length<=0){
            return;
        }
        for(let item of items){
            item._parent = this;
        }
    }

    /**
     * 获取当菜单项被点击后的回调方法
     * @returns {*}
     */
    get clickFunc() {
        return this._clickFunc;
    }

    /**
     * 设置菜单项被点击后的回调方法
     * @param f
     */
    set clickFunc(f) {
        this._clickFunc = f;
    }

    /**
     * 获取当前菜单项的类型，目前只有三种类型，normal，submenu, separator
     * @returns {*}
     */
    get type() {
        return this._type;
    }

    /**
     * 设置当前菜单项的类型
     * @param t
     */
    set type(t) {
        this._type = t;
    }


    /**
     * 获取当前菜单的快捷键
     * @returns {*}
     */
    get accelerator() {
        return this._accelerator;
    }

    /**
     * 设置当前菜单的快捷键
     * @param commandKey
     */
    set accelerator(commandKey) {
        this._accelerator = commandKey;
    }

    /**
     * 获取当前菜单的图标
     * @returns {*}
     */
    get icon(){
        return this._icon;
    }

    /**
     * 设置当前菜单的图标
     * @param i
     */
    set icon(i){
        this._icon = i;
    }

    /**
     * 获取当前菜单是否可用
     * @returns {*}
     */
    get enable(){
        return this._enable;
    }

    /**
     * 设置当前菜单是否可用
     * @param e
     */
    set enable(e){
        this._enable = e;
    }

    /**
     * 根据子项获取当前子菜单的宽度
     * @returns {number}
     */
    get maxWidth(){
        if(!this._childList || this._childList.length<=0){
            return 0;
        }
        let max = 0;
        for(let index = 0;index<this._childList.length;index++){
            let contentWidth = this._childList[index].label?this._childList[index].label.length * 15:0;
            let iconWidth = this._childList[index].icon?30:0;
            let acceleratorWidth = this._childList[index].accelerator?this._childList[index].accelerator.length * 10:0;
            let leftWidth = 50;
            let temp = contentWidth + iconWidth + acceleratorWidth + leftWidth;
            if(temp>max){
                max = temp;
            }
        }
        for(let index = 0;index<this._childList.length;index++) {
            this._childList[index].width = max;
        }
        return max;
    }

    /**
     * 获取当前菜单项的宽度
     * @returns {*|null}
     */
    get width(){
        return this._width;
    }

    /**
     * 根据当前项的宽度设置样式
     * @param w
     */
    set width(w){
        this._width = w;
        if(this._index!=0 && this._subDom){
            this._subDom.css("left", (this.width-40) + "px");
        }
        if(this._index !=0 && this._accelerator){
            this._acceleratorDom.css("left",(this.width - this._accelerator.length * 10-15) + "px");
        }
    }

    /**
     * 获取dam树
     * @returns {dam树}
     */
    get dom(){
        return this._html[0];
    }

    /**
     * 删除自身的属性
     * */
    destorySelfProp() {
        this._text = null;
        this._width = null;
        this._enable = null;
        this._icon = null;
        this._accelerator = null;
        this._type = null;
        this._clickFunc = null;
        this._childList = null;
        this._label = null;
        this._showItem = null;

    }

    /**
     *删除自身的事件
     * */
    destorySelfEvent() {
        this._currentDom.off("click");
        this._currentDom.off("mouseenter");
        this._currentDom.off("mouseleave");
    }

    /**
     * reflex自己的属性
     * @param child
     * @param reflex
     */
    reflexPropSelf(child, reflex){
        let label = utils.Dom.getAttr(child, "label");
        let index = utils.Dom.getAttr(child, "index");
        let accelerator = utils.Dom.getAttr(child, "accelerator");
        let icon = utils.Dom.getAttr(child, "icon");
        let enable = utils.Dom.getAttr(child, "enable");
        let type = utils.Dom.getAttr(child, "type");
        if (label) {
            this.label = label;
        }if (index) {
            this.index = index;
        }if (accelerator) {
            this.accelerator = accelerator;
        }if (icon) {
            this.icon = icon;
        }if (enable) {
            this.enable = enable;
        }if (type) {
            this.type = type;
        }
        this._getHtml();
    }

    /**
     * reflex默认的事件
     * @param child
     * @param reflex
     */
    reflexEventDefault(child, reflex) {
        let click = utils.Dom.getEvt(child, "click");
        if (click) {
            this.clickFunc= () => {
                if(this.index==0){
                    this._getFocused = !this._getFocused;
                }
                this.runEvent(base.EventBase.CLICK);
                this.showItem = !this._showItem;
            };
            this._currentDom.on("click", () => {
                this.clickFunc();
            });
        }
    }
}

/**
 * progressBar 进度条
 * @param obj  配置参数
 * @param eventCycle  事件生命周期 
 * @example 1.  DOM反射
        * <progressBar data-control-type="control.ProgressBar" data-progressVal='15'></progressBar>
 * @example 2. 实例化
 *      new control.ProgressBar({
            isShowProgressVal: false,                                    //是否显示进度值          默认true
            progressVal: 60,                                             //进度值                  *必填
            progressTime: 1000,                                          //动画完成所需要的时间     默认1000
            progressBarStyle: control.ProgressBar.SINGLECOLOR_STYLE,     //进度条样式              默认单色
            progressValStyle: control.ProgressBar.PERTOP_STYLE,          // 进度值样式             默认中间
            progressDesc: '开始加载'                                      // 进度值的描述内容(进度值的样式在上方时会有)      默认空
        });
 * @author create by hehe
 * */
control.ProgressBar = class extends control.Base {
    constructor(obj = {}, eventCycle) {
        super(eventCycle);
        this.name = "ProgressBar";
        this.version = "1.0.0";
        this.author = "hehe";

        this._html = $(`<div class="progressBar"></div>`);
        this.progressBgDom = $(`<div class="progressBar-bg"></div>`);
        this.barDom = $(`<div class="progressBar-progress"></div>`);
        this.progressValDom = $(`<span class="progressBar-val"></span>`);
        this.progressBgDom.append(this.barDom);
        this._html.append(this.progressBgDom);
        this._html.append(this.progressValDom);
        // 进度条底色样式
        this._progressBarStyle = obj.progressBarStyle || control.ProgressBar.SINGLECOLOR_STYLE;
        // 进度条样式
        this._progressValStyle = obj.progressValStyle || control.ProgressBar.PERCENTER_STYLE;
        // 进度值
        this._progressVal = obj.progressVal || 0;
        // 是否显示进度值
        this._isShowProgressVal = obj.isShowProgressVal || false;
        // 多少时间展示完
        this._progressTime = obj.progressTime || 1000;
        // 实时进度值 
        this._progresFlag = 0;
        // 进度值描述
        this._progressDesc = obj.progressDesc || '';

        this.init();
    }


    init() {
        this.progressBarStyle = this._progressBarStyle;
        this.progressValStyle = this._progressValStyle;
        this.progressVal = this._progressVal;
        this.isShowProgressVal = this._isShowProgressVal;
    }
    /** 
     * @returns {string} 获取获取实时进度值
     * */
    get progresFlag() {
        return this._progresFlag;
    }

    /** 
     * @returns {string} 获取进度值描述
     * */
    get progressDesc() {
        return this._progressDesc || '';
    }
    /**
     * 设置进度描述
     * @param v 进度值描述 
     * */
    set progressDesc(v) {
        this._progressDesc = v;
        this.progressValDom.text(v + this._progresFlag + '%');
    }

    /** 
     * @returns {boolean} 获取是否显示进度值
     * */
    get isShowProgressVal() {
        return this._isShowProgressVal;
    }
    /** 
     * @param v 是否显示进度值
     * */
    set isShowProgressVal(v) {
        this._isShowProgressVal = v;
        let isShow = v ? 'none' : 'block';
        this.progressValDom.css('display', isShow);
    }
    /** 
     * @returns {string} 获取进度值
     * */
    get progressVal() {
        return this._progressVal;
    }
    /** 
     * @param v 进度值
     * */
    set progressVal(v) {
        let oldVal = this._progressVal;
        this._progressVal = v > 100 ? 100 : v;
        var speed;
        if (oldVal != this.progressVal) {
            speed = Math.abs(this.progressVal - oldVal);
        } else {
            speed = this.progressVal;
        } 
        // 进度值以+1累加
        let time = parseInt(this._progressTime / speed) || 500;
        let Timer = setInterval(() => {
            if (this._progresFlag == this._progressVal) {
                clearInterval(Timer);
                return;
            } else if (this._progresFlag > this._progressVal) {
                --this._progresFlag;
            } else if (this._progresFlag < this._progressVal) {
                ++this._progresFlag;
            }
            this.runEvent(base.EventBase.CHANGE); 
            this.progressValDom.text(this.progressDesc + this._progresFlag + '%');
            this.barDom.stop();
            this.progressValDom.stop();

        }, time);
        // 改变进度条宽，进度值
        setTimeout(() => {
            this.barDom.css({ 'width': this.html.width() * (this._progressVal / 100), 'transition-duration': this._progressTime / 1000 + 's' });
            if (this._progressValStyle == control.ProgressBar.PERCENTER_STYLE) {
                this.progressValDom.css({ 'left': this.html.width() * (this._progressVal / 100) - 20, 'transition-duration': this._progressTime / 1000 + 's' });
            }
        }, 0);
    }

    /**
     * 设置进度条样式
     * @param v 进度条的样式
     *:     1：单色皮肤
            2：渐变皮肤 
     * */
    set progressBarStyle(v) {
        let _v = v - 0;
        switch (_v) {
            case control.ProgressBar.SINGLECOLOR_STYLE:
                this.html.removeClass("progressBar-barStyle-Gradual");
                this.html.addClass("progressBar-barStyle-singleColor");
                break;
            case control.ProgressBar.GRADUAL_STYLE:
                this.html.removeClass("progressBar-barStyle-singleColor");
                this.html.addClass("progressBar-barStyle-Gradual");
                break;
            default:
                this.html.addClass("progressBar-barStyle-singleColor");
                break;
        }
    }
    /**
     * 设置进度值样式
     * @param v 进度值的样式
     *:     1：悬浮上面
            2：悬浮中间
            3：悬浮右面
     * */
    set progressValStyle(v) {
        switch (v) {
            case control.ProgressBar.PERTOP_STYLE:
                this.progressValDom.removeClass("progressBar-percentStyle-center progressBar-percentStyle-right");
                this.progressValDom.addClass("progressBar-percentStyle-top");
                break;
            case control.ProgressBar.PERCENTER_STYLE:
                this.progressValDom.removeClass("progressBar-percentStyle-top progressBar-percentStyle-right");
                this.progressValDom.addClass("progressBar-percentStyle-center");
                break;
            case control.ProgressBar.PERRIGHT_STYLE:
                this.progressValDom.removeClass("progressBar-percentStyle-top progressBar-percentStyle-center");
                this.progressValDom.addClass("progressBar-percentStyle-right");
                break;
            default:
                if (v) {
                    console.log(v);
                    // 设置的自定义样式
                    this.progressValDom.removeClass("progressBar-percentStyle-top progressBar-percentStyle-center progressBar-percentStyle-right");
                    this.progressValDom.addClass(v);
                } else {
                    console.log(v);
                    this.progressValDom.addClass("progressBar-percentStyle-top");
                }
                break;
        }
    }

    set change(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.CHANGE, handler);
    }

    reflexPropSelf(child, reflex) {
        let progressVal = utils.Dom.getAttr(child, "progressVal");
        let isShowProgressVal = utils.Dom.getAttr(child, "isShowProgressVal");
        let progressTimeVal = utils.Dom.getAttr(child, "progressTime");
        let progressBarStyleVal = utils.Dom.getAttr(child, "progressBarStyle");
        let progressValStyleVal = utils.Dom.getAttr(child, "progressValStyle");
        let progressDescVal = utils.Dom.getAttr(child, "progressDesc");

        this.progressVal = eval(progressVal);
        this.isShowProgressVal = eval(isShowProgressVal);
        this.progressTime = eval(progressTimeVal);
        this.progressBarStyle = eval(progressBarStyleVal);
        this.progressValStyle = eval(progressValStyleVal);
        this.progressDesc = eval(progressDescVal);
    }
    /**
     * 获取dom的显示对象
     * @returns {string} 获取此控件的jsdom对象
     * */
    get dom() {
        return this._html[0];
    }

    // 销毁事件
    destroySelfEvent() { 
        this._html.off("change"); 
    }
    // 销毁属性
    destroySelfProp() {
        this._progressBarStyle = null; 
        this._progressValStyle = null; 
        this._progressVal = null; 
        this._isShowProgressVal = null; 
        this._progressTime = null; 
        this._progresFlag = null; 
        this._progressDesc = null;
        this._html = null;
    }
}
control.ProgressBar.SINGLECOLOR_STYLE = 1;
control.ProgressBar.GRADUAL_STYLE = 2;

control.ProgressBar.PERTOP_STYLE = 1;
control.ProgressBar.PERCENTER_STYLE = 2;
control.ProgressBar.PERRIGHT_STYLE = 3;

/**
 * @param text 文本对象
 * @param eventCycle 生命周期
 * */
control.Radio = class extends control.Base {
    constructor(text, val, ev) {
        super(ev);
        this.name = "Radio";
        this.version = "1.0.0"//控件的版本
        this.author = "heshang";//控件的制作人
        this._selected = false;
        this._groupName = "";
        this.textDom = $(`<span>${this.text}</span>`);
        this.inputDom = $(`<input type="radio" value="${this._value}"/>`);
        let html = $(`<span></span>`);
        html.append(this.inputDom);
        html.append(this.textDom);
        this._html = html;
        this.value = val;
        this.text = text;
        this._bindEvent();
    }

    set selected(b) {
        if (b) {
            this.inputDom.attr("checked", "checked");
        } else {
            this.inputDom.removeAttr("checked");
        }
        this._selected = b;
    }

    get selected() {
        return this._selected;
    }

    _bindEvent() {
        this.inputDom.on("change", () => {
            this.changeParentPro();
        });
    }

    changeParentPro() {
        if (this.parent instanceof control.RadioGroup) {
            this.parent.selectIndex = this.parent.childList.indexOf(this);
            this.parent.selectItem = this;

            this.parent.disChange();
        }
    }

    get value() {
        return this._value;
    }

    reflexPropSelf(child, reflex) {
        let val = utils.Dom.getAttr(child, "value");
        this.value = val;
    }

    set groupName(n) {
        this.inputDom.attr("name", n);
        this._groupName = n;
    }

    set value(v) {
        this.inputDom.val(v);
        this._value = v;
    }

    get dom() {
        return this._html[0];
    }

    get text() {
        return this._text;
    }

    set text(t) {
        this.textDom.text(t);
        this._text = t;
    }
}
control.RadioGroup = class extends control.Base {
    constructor(ev) {
        super(ev);
        this.name = "Radio";
        this.version = "1.0.0"//控件的版本
        this.author = "heshang";//控件的制作人
        this._selectIndex = -1;
        this._selectItem = null;
        let html = $(`<span></span>`);
        this._html = html;
        this._groupName = "";
    }

    set selectIndex(index) {
        if (index < this.childList.length) {
            this._selectIndex = index;
            this._selectItem = this.childList[index];
            this.selectItem.selected = true;
        } else if (this.debugger) {
            console.warn(`radioGroup guid:${this.guid} childList length:${this.childList.length},set index:${index}`);
        }
    }

    get selectIndex() {
        return this._selectIndex;
    }

    set selectItem(item) {
        let index = this.childList.indexOf(item);
        if (index >= 0) {
            this.selectIndex = index;
        }

    }

    get selectItem() {
        return this._selectItem;
    }

    disChange() {
        this.runEvent(base.EventBase.CHANGE);
    }

    reflexPropSelf(child, reflex) {
        let name = utils.Dom.getAttr(child, "name");
        let selectIndex = utils.Dom.getAttr(child, "selectIndex");
        reflex.ready(base.Handler.create(function () {
            this.groupName = name;
            if (selectIndex) {
                this.selectIndex = selectIndex;
            }
        }, this, "加载完成"))
    }

    set groupName(n) {
        for (let i = 0; i < this.childList.length; i++) {
            if (this.childList[i] instanceof control.Radio) {
                this.childList[i].groupName = n;
            }
        }
        this._groupName = n;
    }

    get dom() {
        return this._html[0];
    }

    get text() {
        return this._text;
    }

    set text(t) {
        this._text = t;
    }
}
control.Slider = class extends control.Base {
    constructor(direc = true, val = 0, innerSize = { width: 394, height: 24 }, outerSize = { width: 400, height: 30 }, sliderSize = { width: 40, height: 40 }, heartShow = true, eventCycle) {
        super(eventCycle);
        this.name = 'Slider';
        this.version = "1.0.0"//控件的版本
        this.author = "liaohen";//控件的制作人'
        this._direction = direc;
        this._value = val;
        this._innerSize = innerSize;
        this._outerSize = outerSize;
        this._sliderSize = sliderSize;
        this._heartShow = heartShow;
        this._outerDom = $(`<div></div>`);
        this._innerDom = $(`<div></div>`);
        this._heartDom = $(`<div></div>`);
        this._sliderDom = $(`<div></div>`);
        this._heartDom.append(this._sliderDom);
        this._innerDom.append(this._heartDom);
        this._outerDom.append(this._innerDom);
        this._heartSize = {
            width: Number.parseInt(innerSize.width * 0.05),
            height: Math.ceil(Number.parseInt(innerSize.height * 0.8) / 2) * 2,
        }
        this._bindEvent();
        this._sizeInit();
        this._valInit();
    }

    _bindEvent() {
        let dataX, dataY, sliderNow, heartNow, lenXMax = null;
        this._sliderDom[0].addEventListener('mousedown', (e) => {
            this._heartDom[0].style.transition = 'none'
            this._sliderDom[0].style.transition = 'none'
            dataX = e.clientX - this._sliderDom[0].offsetLeft;
            dataY = e.clientY - this._sliderDom[0].offsetLeft;
            sliderNow = this._sliderDom[0];
            heartNow = this._heartDom[0];
            lenXMax = this._innerDom[0].offsetWidth- this._sliderDom[0].offsetWidth;
            let mousemoveFn = (e) => {
                e.preventDefault();
                if (this._direction) {
                    let rangeX = e.clientX - dataX;
                    if (rangeX < 0) {
                        rangeX = 0;
                    } else if (rangeX > lenXMax) {
                        rangeX = lenXMax;
                    }
                    sliderNow.style.left = rangeX + 'px';
                    heartNow.style.width = rangeX + 'px';
                } else {
                    let rangeY = e.clientY - dataY;
                    if (rangeY < 0) {
                        rangeY = 0;
                    } else if (rangeY > lenXMax) {
                        rangeY = lenXMax;
                    }
                    sliderNow.style.left = rangeY + 'px';
                    heartNow.style.width = rangeY + 'px';
                }
                this._value = Number.parseInt(heartNow.offsetWidth * 100 / lenXMax);
                this.runEvent(base.EventBase.CHANGE, this)
            }
            document.addEventListener('mousemove', mousemoveFn, false);
            document.addEventListener('mouseup', (e) => {
                this.runEvent(base.EventBase.CHANGE, this)
                sliderNow = heartNow = null;
                document.removeEventListener('mousemove', mousemoveFn, false)
                e.preventDefault();
            }, false)
        }, false);
        this._innerDom[0].addEventListener('mousedown', (e) => {
            lenXMax = this._innerDom[0].offsetWidth- this._sliderDom[0].offsetWidth;
            let posNowL = e.clientX - this._heartDom[0].getBoundingClientRect().left < 0 ? 0 : e.clientX - this._heartDom[0].getBoundingClientRect().left;
            let posNowT = e.clientY - this._heartDom[0].getBoundingClientRect().top < 0 ? 0 : e.clientY - this._heartDom[0].getBoundingClientRect().top;
            let sliderL = this._sliderDom[0].offsetLeft;
            let sliderR = sliderL + this._sliderDom[0].offsetWidth;
            let formPercentFn = (arg, LMax) => {
                let res = Number.parseInt(arg * 100 / LMax) > 100 ? 100 : Number.parseInt(arg * 100 / LMax) > 0 ? Number.parseInt(arg * 100 / LMax) : 0;
                return res
            }
            if (this._direction) {
                if (posNowL < sliderL || posNowL > sliderR) {
                    this._sliderDom[0].style.left = `${posNowL}px`;
                    this._heartDom[0].style.width = `${posNowL}px`;
                    this._heartDom[0].style.transition = '0.5s';
                    this._sliderDom[0].style.transition = '0.5s';
                    this._value = formPercentFn(posNowL, lenXMax);
                }
            } else {
                if (posNowT < sliderL || posNowT > sliderR) {
                    this._sliderDom[0].style.left = `${posNowT}px`;
                    this._heartDom[0].style.width = `${posNowT}px`;
                    this._heartDom[0].style.transition = '0.5s';
                    this._sliderDom[0].style.transition = '0.5s';
                    this._value = formPercentFn(posNowT, lenXMax);
                }
            }
            this.runEvent(base.EventBase.CHANGE, this)
        })
    }
    _sizeInit() {
        [
            this._innerDom[0].style.cssText,
            this._outerDom[0].style.cssText,
            this._sliderDom[0].style.cssText,
            this._heartDom[0].style.cssText,
        ] = [
                `width:${this._innerSize.width}px;height:${this._innerSize.height}px;`,
                `width:${this._outerSize.width}px;height:${this._outerSize.height}px;`,
                `width:${this._sliderSize.width}px;height:${this._sliderSize.height}px;`,
                `width:${this._heartSize.width}px;height:${this._heartSize.height}px;`
            ];
        this._innerDom.addClass('normal_inner');
        this._outerDom.addClass('normal_outer');
        this._sliderDom.addClass('normal_slider');
        this._heartDom.addClass('normal_heart');
        if (!this._direction) {
            this._outerDom.addClass('VERTICAL_SHOW');
        }
        if (!this._heartShow) {
            this._heartDom.addClass('HEART_SHOW');
        }
    }
    _valInit() {
        this._heartSize.width = this._innerSize.width * this._value / 100;
        this._heartDom[0].style.width = this._value + '%';
        this._sliderDom[0].style.left = Number.parseInt(this._heartSize.width) + 'px';
    }
    set change(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.CHANGE, handler);
    }
    get width() {
        return this._outerDom[0].offsetWidth;
    }
    set width(t) {
        return null;
    }
    get direction() {
        return this._direction;
    }
    set direction(t) {
        this._direction = Boolean(t);
        if (!this._direction) {
            this._outerDom.addClass('VERTICAL_SHOW');
        } else {
            this._outerDom.removeClass('VERTICAL_SHOW');
        }
    }
    get value() {
        return this._value;
    }
    set value(t) {
        this._value = Number.parseInt(t) > 100 ? 100 : Number.parseInt(t) < 0 ? 0 : Number.parseInt(t);
        this._valInit();
        this.runEvent(base.EventBase.CHANGE, this);
    }
    get outerSize() {
        return this._outerSize;
    }
    set outerSize(json) {
        [this._outerSize.width,this._outerSize.height] = [json.width,json.height]
        this._outerDom[0].style.cssText =  `width:${this._outerSize.width}px;height:${this._outerSize.height}px;`;
        this._outerDom.addClass('normal_outer');
    }
    get innerSize() {
        return this._innerSize;
    }
    set innerSize(json) {
        [this._innerSize.width,this._innerSize.height] = [json.width,json.height]
        this._innerDom[0].style.cssText =  `width:${this._innerSize.width}px;height:${this._innerSize.height}px;`;
        this._innerDom.addClass('normal_inner');
    }
    get sliderSize() {
        return this._sliderSize;
    }
    set sliderSize(json) {
        [this._sliderSize.width,this._outerSize.height] = [json.width,json.height]
        this._sliderDom[0].style.cssText =  `width:${this._sliderSize.width}px;height:${this._sliderSize.height}px;`;
        this._sliderDom.addClass('normal_slider');
    }
    get heartShow() {
        return this._heartShow;
    }
    set heartShow(t) {
        this._heartShow = Boolean(t);
        if (!this._heartShow) {
            this._heartDom.addClass('HEART_SHOW')
        }else{
            this._heartDom.removeClass('HEART_SHOW')
        }
    }
    set innerStyle(t) {
        this._innerDom.addClass(t);
    }
    set outerStyle(t) {
        this._outerDom.addClass(t);
    }
    set sliderStyle(t) {
        this._sliderDom.addClass(t);
    }
    set heartStyle(t) {
        this._heartDom.addClass(t);
    }
    get dom() {
        return this._outerDom[0];
    }
    /**
     * 删除自身的属性
     * */
    destorySelfProp() {
        this._direction = null;
        this._value = null;
        this._innerSize = null;
        this._outerSize = null;
        this._sliderSize = null;
        this._heartShow = null;
        this._outerDom = null;
        this._innerDom = null;
        this._heartDom = null;
        this._sliderDom = null;
        this._heartSize = null;
    }
/////////test svn111
    /**
     *删除自身的事件
     * */
    destorySelfEvent() {
        this._sliderDom.off("mousedown");
        this._innerDom.off("mousedown");
    }
}
// var vaidType = ["number","text","password"]

/**
 * TextBox控件
 * @author likui
 * @example let textBox1 = new control.TextBox("number",123);
 * textBox1.minValue = -10;
 * textBxo1.maxValue = 10;
 * textBox1.change = function(e){
 *      console.log(e);
 * }
 * @example <textbox data-control-type="control.TextBox" data-showType = "number" data-showValue=123 data-minValue=-10 data-maxValue=10></textbox>
 */
control.TextBox = class extends control.Base{
    constructor(showType = "string",val = "",ev){
        super(ev);
        this._val = val;
        if (!control.TextBox.textType[showType]){
            throw new TypeError("应该输入有效的类型(float,int,string,password,text,number)");
        }
        this._regex = "";
        this._testReg = false;
        this._showType = showType;
        this._inputDom = $(`<input type='${control.TextBox.textType[this._showType]}' value='${this._val}'/>`);
        this._html = $(`<span style="display: inline-block"></span>`);
        this._html.append(this._inputDom);
        this._bindEvent();
    }

    /**
     * @returns 返回当前控件是否要进行正则匹配
     */
    get testReg(){
        return this._testReg;
    }

    /**
     * 设置是否进行正则匹配
     * @param isReg 是否进行正则匹配
     */
    set testReg(isReg){
        this._testReg = isReg;
    }

    /**
     * @returns 获取正则匹配的字符串
     */
    get regex(){
        return this._regex;
    }

    /**
     * 设置正则匹配字符串
     * @param regexStr 设置正则匹配的字符串
     */
    set regex(regexStr){
        this._regex = regexStr;
    }

    /**
     * 获取当前的控件内容的类型
     * @returns 返回当前的控件内容的类型
     */
    get showType(){
        return this._showType;
    }

    /**
     * 获取控件宽度
     */
    get width(){
        return this._inputDom.offsetWidth;
    }

    /**
     * 设置控件宽度
     * @param value 控件的宽度值
     */
    set width(value){
        this._inputDom.css("width",value);
    }

    /**
     * 获取控件高度
     */
    get height(){
        return this._inputDom.offsetHeight;
    }

    /**
     * 设置控件高度
     * @param value 控件的高度值
     */
    set height(value){
        this._inputDom.css("height",value);
    }

    /**
     * 设置当前的控件内容的数据类型
     * @param showType 
     */
    set showType(showType){
        this._inputDom.attr("type",control.TextBox.textType[showType]);
        this._showType = showType;
    }

    /**
     * 获取TextBox的值
     * @returns 返回控件的显示内容
     */
    get showValue(){
        // console.log("this._val is::",this._val);
        return this._val;
    }

    /**
     * 设置控件的显示内容
     * @param val 显示的内容值
     */
    set showValue(val){
        this._val = val;
        this._inputDom.attr("value",val);
    }

    /**
     * 获取最小值（仅input type="number"）时有效
     * @returns 返回当前控件的最小值
     */
    get minValue(){
        if (this._inputDom.attr("type") !== "number"){
            return NaN;
        }
        return parseInt(this._inputDom.attr("min"));
    }

    /**
     * 设置当前控件的最小值
     * @returns 最小值
     */
    set minValue(value){
        if(this._inputDom.attr("type") !== "number"){
            return;
        }
        this._inputDom.attr("min",value);
    }

    /**
     * 返回当前控件的最大值
     * @returns 当前控件的最大值
     */
    get maxValue () {
        if(this._inputDom.attr("type") !== "number"){
            return NaN;
        }
        return parseInt(this._inputDom.attr("max"));
    }

    /**
     * 设置当前控件的最大值
     * @param value 设置的控件的值
     */
    set maxValue(value){
        if(this._inputDom.attr("type") !== "number"){
            return;
        }
        this._inputDom.attr("max",value);
    }

    /**
     * 删除自身的控件引用
     */
    destroySelfEvent(){
        this._inputDom.off("mousewheel");
        this._inputDom.off("change");
        this._inputDom.off("input propertychange")
    }

    /**
     * 删除自身的属性引用
     */
    destroySelfProp(){
        this._val = null;
        this._regex = null;
        this._showType = null;
    }

    /**
     * 进行事件绑定
     */
    _bindEvent(){
        let _this = this;
        this._inputDom.on("mousewheel",function (ev) {
            if(_this._inputDom.attr("type") !== "number"){
                return;
            }
            let tmpl = parseInt(_this._inputDom.attr("value"));
            _this._inputDom.attr("value",tmpl+parseInt(ev.originalEvent.wheelDeltaY/120));
        })
        this._inputDom.on("change",function (ev) {
            _this._val = ev.target.value;
            _this.runEvent(base.EventBase.CHANGE, _this);
        })
        this._inputDom.on("input propertychange",function(ev){
            _this._val = ev.target.value;
            _this.runEvent(base.EventBase.CHANGE,_this);
        })
    }
    
    /**
     * 
     * @param {*} child 属性反射实现
     * @param {*} reflex 
     */
    reflexPropSelf(child,reflex){
        let showType = utils.Dom.getAttr(child, "showType");
        this._inputDom.attr("type",control.TextBox.textType[showType]);

        let showValue = utils.Dom.getAttr(child,"showValue");
        this._inputDom.attr("value",showValue);

        let minValue = utils.Dom.getAttr(child,"minValue");
        this._inputDom.attr("min",minValue);

        let maxValue = utils.Dom.getAttr(child,"maxValue");
        this._inputDom.attr("max",maxValue);

        let testReg = utils.Dom.getAttr(child,"testReg");
        this._testReg = testReg;

        let controlWidth = utils.Dom.getAttr(child,"width");
        console.log("controlWidth is:",controlWidth);
        this._html.css("width",controlWidth);
        this._inputDom.css("width",controlWidth);

        console.log("actual width is:",this._inputDom.css("width"))

        let controlHeight = utils.Dom.getAttr(child,"height");
        this._inputDom.css("height",controlHeight);
        this._html.css("height",controlHeight);
        console.log("actual height is:",this._inputDom.css("height"));
    }

    /**
     * 返回当前的dom值
     * @returns 当前的dom值
     */
    get dom(){
        return this._html[0];
    }
}

/**
 * 当前的内容的类型
 */
control.TextBox.textType = {
    float:"number",
    int:"number",
    string:"text",
    password:"password",
    text:"text",
    number:"number"
}
/**
 * 主树控件
 * @param eventCycle 事件生命周期
 * @author create by taiduo
 * */
control.Tree = class extends control.Base {
    constructor(eventCycle) {
        super(eventCycle);
        this.name = "Tree";
        this.version = "1.0.0" //控件的版本
        this.author = "taiduo"; //控件的制作人
        //根节点
        this._rootNode = null;
        //保存当前点击tree
        this._selectItem = null;
        //点击事件保存的tree
        this._selectClickItem = null;
        //绑定html
        this._html = $(`<div class="controlTree"></div>`);
        //tree事件
        this._bindEvent();
    }
    set selectItem(item){
    	this._selectItem = item;
    }

    get selectItem(){
    	return this._selectItem;
    }

    /**
     * 添加对象作为此对象的子对象
     *  @param node 子对象必须是一个显示对象
     * */
    addChild(node) {
        this.eventCycle.runEvent(base.EventBase.LOAD_BEFORE);
        node._parent = this;
        this._childList.push(node);
        if (node.dom && this.dom) {
            this.dom.appendChild(node.dom);
        }
        node.setControllerItem(node.guid, node.guid);
        node._rootNode = this;
        this._findRootNode(node);
        this.eventCycle.runEvent(base.EventBase.LOAD_COMPLETE);
    }

    _findRootNode(node) {
        if (node._childList.length) {
            for (let i in node._childList) {
                node._childList[i]._rootNode = node._rootNode;
                if(node._childList[i]._childList.length){
                    node._rootNode._findRootNode(node._childList[i]);
                }
            }
        }
    }


    //绑定事件
    _bindEvent() {
        //绑定html单击事件
        this.html.on("click", function(ev) {
            if (this._stopEvent(ev)) return;
            // control.Tree.initTargetNd(ev, this,'click');
            this.runEvent(base.EventBase.CLICK, this);
        }.bind(this));

        //绑定html双击事件
        this.html.on("dblclick", function(ev) {
            if (this._stopEvent(ev)) return;
            // control.Tree.initTargetNd(ev, this,'dblclick');
            this.runEvent(base.EventBase.DBLCLICK, this);
        }.bind(this));

        //绑定右击事件
        this.html.on("contextmenu", function(ev) {
            if (this._stopEvent(ev)) return;
            // control.Tree.initTargetNd(ev, this,'contextmenu');
            this.runEvent(base.EventBase.CONTEXTMENU, this);
        }.bind(this))

        //绑定拖拽事件
        let _cur = this;
        this.html.on("mousedown", function(ev) {
            if (this._stopEvent(ev)) return;
            // control.Tree.initTargetNd(ev, _cur,'mousedown');
            _cur.runEvent(base.EventBase.DRAGBEGIN, _cur);
            //移动开始
            document.onmousemove = function(event) {
                _cur.runEvent(base.EventBase.DRAGMOVE, _cur);
            }
            //移动停止
            document.onmouseup = function() {
                _cur.runEvent(base.EventBase.DRAGEND, _cur);
                document.onmousemove = null;
                document.onmouseup = null;
            }
        }.bind(this));
    }

    //初始化事件触发节点
    static initTargetNd(ev, cur,eventType) {
        let currentTreeItem = window.currentTreeItem || null;
        if(eventType == "click"){
        	 if(cur._selectClickItem){
        		 cur.selectPrevItem = cur._selectClickItem;
       		 }
       		 cur._selectClickItem = currentTreeItem;
        }else{
        	cur.selectItem = currentTreeItem;
        }
    }

    //阻止冒泡
    _stopEvent(ev) {
        let _ev = ev || window.event;
        let _target = _ev.target || _ev.srcElement;
        if (ev.target.className.indexOf('spreadList') != -1) return 1;
    }


    //销毁事件
    destroySelfEvent(){
        this._html.off("click");
        this._html.off("dblclick");
        this._html.off("contextmenu");
        this._html.off("mousedown");
    }

    //销毁属性
    destroySelfProp(){
        this._selectItem = null;
        this._selectClickItem = null;
        this._html = null;
    }
    //返回DOM
    get dom() {
        let _nd = "";
        if (this.html) {
            _nd = this.html[0];
        }
        return _nd;
    }
}
/**
 * 子树控件
 * @param eventCycle 事件生命周期
 * @param config 配置文件
 * @example 1: 通过js去实例化实现: new control.TreeItem(null,{
                                    icon:'rhombus',             //左侧tree icon的样式
                                    text:"first",               //中间tree  文本
                                    spreadBtn:1,                //右侧tree 是否显示按钮去控制显示子树 如果不需要就默认不写参数
                                    definedHtml:String          //自定义的DOM 定以后自动忽略别的属性 
                                })
 * @example 2:DOM绑定           <treeItem data-control-type="control.TreeItem" data-icon="triangleRight" data-text="我的作品"  data-spreadBtn="1"></treeItem>
 * @author create by taiduo
 * */
control.TreeItem = class extends control.Base {
    constructor(config,eventCycle) {
        super(eventCycle);
        this.name = "TreeItem";
        this.version = "1.0.0"//控件的版本
        this.author = "taiduo";//控件的制作人
        //设置参数对象
        this._config = config || {};
        //设置icon
        this._icon = this._config.icon || null;
        //设置tree文本
        this._text = this._config.text || null;
        //设置伸缩按钮
        this._spreadBtn = this._config.spreadBtn || null;

        //用户自定义html
        this._definedHtml = this._config.definedHtml || null;
        //获取当前类
        let _parent = control.TreeItem;
        //根节点
        this._rootNode = null;
        //绑定icon
        this._treeIconNd = $(_parent.createIcon(this._icon));
        //绑定展开按钮
        this._treeSpreadBtnNd = $(_parent.createSpreadBtn(this._spreadBtn));
        //绑定tree名称
        this._treeTextNd = $(`<span>${this._text}</span>`);
        let _tree = $(`<div class="controlTree-context" ></div>`);
        if(this._definedHtml){
            _tree = $(this._definedHtml);
        }else{
            _tree.prepend(this._treeIconNd);
            _tree.append(this._treeTextNd);
            _tree.append(this._treeSpreadBtnNd);
        }
        let html = $(`<div class="controlTree-main"></div>`)
        html.append(_tree);
        //创建tree
        this._tree = _tree;
        //绑定html
        this._html = html;
        //绑定点击事件  展开自己的子级列表
        this._bindClick();
        //tree绑定事件 
        this._bindEvent();
    }
    set tree(t) {
        this._tree = tree;
    }
    get tree() {
        return this._tree;
    }
    set text(t) {
        this._text = t;
        this._treeTextNd.text(t);
    }
    get text() {
        return this._text;
    }
    set icon(icon) {
        this._icon = icon;
        this._treeIconNd = $(control.TreeItem.createIcon(icon));
        this._tree.prepend(this._treeIconNd);
    }

    //重写addChild  为了保存当前元素的根元素
    addChild(node) {
        this.eventCycle.runEvent(base.EventBase.LOAD_BEFORE);
        node._parent = this;
        this._childList.push(node);
        if (node.dom && this.dom) {
            this.dom.appendChild(node.dom);
        }
        node.setControllerItem(node.guid, node.guid);
        // node._rootNode = this._rootNode;
        this._bindRootNode(node,node);
        this.eventCycle.runEvent(base.EventBase.LOAD_COMPLETE);
    }
    //给每一个treeItem绑定根tree 以便使用
    _bindRootNode(node,savenode) {
       if(!node.parent)return;
       if(node.parent._name  ==  "Tree"){
           savenode._rootNode = node.parent;
       }else{
           this._bindRootNode(node.parent,savenode);
       }
    }

    
    reflexPropSelf(child, reflex) {
        let icon = utils.Dom.getAttr(child, "icon");
        let spreadBtn = utils.Dom.getAttr(child, "spreadBtn");
        let definedHtml  = utils.Dom.getAttr(child,'definedHtml');
        if(icon){this.icon = icon;}
        if(spreadBtn){this.spreadBtn = spreadBtn} ;
        if(definedHtml){
            this._tree = $(definedHtml);
            let html = $(`<div class="controlTree-main"></div>`)
            html.append(this._tree);
            //绑定html
            this._html = html;
            this._bindEvent();
        }
    }

    set spreadBtn(spreadbtn) {
        this._spreadBtn = spreadbtn;
        this._treeSpreadBtnNd = $(control.TreeItem.createSpreadBtn(spreadbtn));
        this._tree.append(this._treeSpreadBtnNd);
        this._bindClick();
    }
    //创建tree的icon
    static createIcon(icon) {
        let _iconNd = null;
        //icon集合
        let _icon = {
            rhombus: "./images/rhombus.png",               //rhombus
            triangleRight: "./images/triangle-right.png"
        }
        //图标
        if (icon) {
            _iconNd = `<img src=${_icon[icon]}    />`;
        }
        return _iconNd;
    }
    //创建tree的展开按钮
    static createSpreadBtn(spreadBtn) {
        let btn = null;
        //展开按钮
        if (spreadBtn) {
            btn = `<span class="spreadList"></span>`;
        }
        return btn;
    }

    //绑定点击事件  展开自己的子级列表
    _bindClick() {
        let nd_spreadList = this._treeSpreadBtnNd;
        if (!nd_spreadList) return;
        nd_spreadList.on('click', function (ev) {
            this.spreadTree();
        }.bind(this));
    }

    //绑定事件
    _bindEvent() {
        //绑定html单击事件
        this._tree.on("click", function () {
            this.saveCurrent("click");
        }.bind(this));

        //绑定html双击事件
        this._tree.on("dblclick", function () {
            this.saveCurrent("dblclick");
        }.bind(this));

        //绑定右击事件
        this._tree.on("contextmenu", function () {
            this.saveCurrent("contextmenu");
        }.bind(this))

        //绑定拖拽事件
        this._tree.on("mousedown", function () {
            this.saveCurrent("mousedown");
            //移动开始
            document.onmousemove = function (event) {
            }
            //移动停止
            document.onmouseup = function () {
                document.onmousemove = null;
                document.onmouseup = null;
            }
        }.bind(this));
    }

    //保存当前this  便于给Tree使用
    saveCurrent(eventType) {
        let currentTreeItem = this;
        let _rootNode = this._rootNode;
        if (eventType == "click") {
            if (_rootNode._selectClickItem) {
                _rootNode.selectPrevItem = _rootNode._selectClickItem;
            }
            _rootNode._selectClickItem = currentTreeItem;
        } else {
            _rootNode.selectItem = currentTreeItem;
        }
    }

    /** 
     * 伸展子结构
     * @example this.selectItem.spreadTree();
    */
    spreadTree() {
        let nd_spreadList = this._treeSpreadBtnNd;
        if(this._spreadBtn){
            if (nd_spreadList.hasClass('active')) {
                nd_spreadList.removeClass("active");
                this.childList.forEach(item => {
                    item._html.show();
                })
            } else {
                this.childList.forEach(item => {
                    item._html.hide();
                })
                nd_spreadList.addClass("active");
            }
        }else{
            this.childList.forEach(item => {
                if(item._html.is(":hidden")){
                    item._html.show();
                }else{
                    item._html.hide();
                }
            })
           
        }
      
    }

    /** 
     * 设置样式
     * @example 1:this.selectItem.treeStyle('border',"1px solid #000");
     * @example 2:this.selectItem.treeStyle({font-size:"20px",'border':"1px solid #000"});
    */
    treeStyle(property, value) {
        if (property.constructor == Object) {
            this._tree.css(property)
        } else {
            this._tree.css(property, value)
        }
    }


    //销毁事件
    destroySelfEvent() {
        this._treeSpreadBtnNd.off("click");
        this._tree.off("click");
        this._tree.off("dblclick");
        this._tree.off("contextmenu");
        this._tree.off("mousedown");
    }

    //销毁属性
    destroySelfProp() {
        //销毁参数对象
        this._config = {};
        //销毁icon
        this._icon = null;
        //销毁tree文本
        this._text = null;
        //销毁伸缩按钮
        this._spreadBtn = null;

        this._treeIconNd = null;
        this._treeSpreadBtnNd = null;
        this._treeTextNd = null;
        this._tree = null;
        this._html = null;
    }

    //返回DOM
    get dom() {
        let _nd = "";
        if (this.html) {
            _nd = this.html[0];
        }
        return _nd;
    }
} 
control.UploadFile = class extends control.Base {
    constructor(text = "选择文件", ev) {
        super(ev);
        this._text = "";
        this.name = "Box";
        this.version = "1.0.0"//控件的版本
        this.author = "heshang";//控件的制作人
        this._box = $(`<div></div>`);
        this._html = $(`<span class="UploadFile_color UploadFile_inline">${text}</span>`);
        this._submit = $(`<span class="UploadFile_color UploadFile_inline">上传</span>`);
        this._tips = $(`<div></div>`);
        this._box.css("margin", "33px");
        this._tips.css("marginTop", "33px");
        this._input = $(`<input type="file"/>`);
        this._box.append(this._html);
        this._box.append(this._submit);
        this._box.append(this._tips);
        this._multiple = false;
        this._upFileType = [];
        this._allowSubmit = false;
        this._uploadIndex = 0;
        this._maxSize = null;
        this.allowSubmit = false;
        this.text = text;
        this._bindEvent();
    }

    set maxSize(s) {
        this._maxSize = s;
    }

    get maxSize() {
        return this._maxSize;
    }

    _bindEvent() {
        this._html.on("click", () => {
            //打开选择文件夹
            this._input[0].click();
        });
        this._submit.on("click", () => {
            //上传文件
            this._submitFile();
        });
        this._input.on("change", () => {
            //选择文件 判断是否成立
            this._selectedFile();
        });
    }

    _uploadFinish() {
        // this._input[0].outerHTML = this._input[0].outerHTML;
        // this._selectedFile();
        this.allowSubmit = false;
    }

    _uploadFile() {
        if (this._uploadIndex >= this._input[0].files.length) {
            this._uploadFinish();
            return;
        }
        let file = this._input[0].files[this._uploadIndex];
        let formData = new FormData();
        let url = "";
        if (window.location.origin.indexOf("66rpg.com") <= -1) {
            url = "http://role6-test-www.66rpg.com";
        } else {
            url = window.location.origin;
        }
        //获取验证信息
        utils.Ajax.get(url + "/ajax/OssAuth/getUploadTempAuth", null, (rcvData) => {
            let d = rcvData.data;
            let reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = (e) => {
                var md5str = md5(e.target.result);
                let key = "upload/" + md5str.substr(0, 2) + "/" + md5str;
                if (file.type === "audio/mp3") {
                    debugger;
                    key += ".mp3";
                }
                formData.append("key", key);
                formData.append("policy", d.policy);
                formData.append("OSSAccessKeyId", d.accessid);
                formData.append("signature", d.signature);
                formData.append("x-oss-security-token", d.token);
                formData.append("name", file.name);
                formData.append("file", file);
                utils.Ajax.postFormData("//cg-back.cgyouxi.com/", formData, (data) => {
                    this._tips.append($(`<div>文件:<b>${file.name}</b>上传成功,链接: <b>${"http://" + d.cdn + "/" + key}</b></div>`))
                    this._nextUpLoad();
                }, () => {
                    this._tips.append($(`<div>文件:<b style="color:red">${file.name}</b>上传失败。请重试。</div>`))
                    this._nextUpLoad();
                });
            }
        });
        // utils.Ajax.post("", formData, (data) => {
        //     this._nextUpLoad()
        // }, (data) => {
        //     this._nextUpLoad();
        // });
    }

    _nextUpLoad() {
        this._uploadIndex++;
        this._uploadFile();
    }

    _submitFile() {
        if (this._allowSubmit) {
            this._uploadIndex = 0;
            this._tips.html("");
            this._uploadFile();
        } else {
            // this._typeError();
        }
    }

    _selectedFile() {
        this.allowSubmit = false;
        this._tips.html("");
        if (this._input[0].files.length > 0) {
            if (!this.checkFileType) {
                this._typeError();
                return;
            }
            this.allowSubmit = true;
            this._selectedFileTips();
            return;
        }
        this.allowSubmit = false;
    }

    _typeError() {
        alert("请检查文件类型、文件大小。");
    }

    get checkFileType() {
        // if (this._upFileType.length <= 0) {
        //     return true;
        // }
        for (let i = 0; i < this._input[0].files.length; i++) {
            let type = this._input[0].files[i].type;
            // let name = this._input[0].files[i].name;
            // let fileType = name.split('.');
            // let flieTypeName = fileType[fileType.length - 1];
            if (this.maxSize && (this.maxSize > 0) && this._input[0].files[i].size >= this.maxSize) {
                return false;
            }
            if (this._upFileType.indexOf(type.toLowerCase()) > -1) {
                return true;
            }
        }
        return false;
    }

    _selectedFileTips() {
        this._tips.html("");
        for (let i = 0; i < this._input[0].files.length; i++) {
            this._tips.append($(`<div>已选择文件:<b>${this._input[0].files[i].name}</b></div>`));
        }
    }

    set allowSubmit(b) {
        this._allowSubmit = b;
        if (b) {
            this._submit.removeClass("UploadFile_disable").addClass("UploadFile_color");
        } else {
            this._submit.removeClass("UploadFile_color").addClass("UploadFile_disable");
        }
    }

    set upFileType(arr) {
        this._upFileType = arr;
    }

    set multiple(b) {
        this._multiple = b;
        if (b) {
            this._input.attr("multiple", "true");
        } else {
            this._input.removeAttr("multiple");
        }

    }

    get multiple() {
        return this._multiple;
    }

    set change(handler) {
        if (this._stop) {
            this._stop = false;
            return;
        }
        this.onEvent(base.EventBase.CHANGE, handler);
    }

    set text(t) {
        this._text = t;
    }

    get text() {
        return this._text;
    }

    get dom() {
        return this._box[0];
    }
}

exports.base = base;
exports.control = control;
exports.utils = utils