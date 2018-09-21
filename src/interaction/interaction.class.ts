'use strict'

import * as styles from './interaction.less';
import utils from '../utils/utils';
import Event from '../event/event';

const POINTER_DOWN = 'mousedown';
const POINTER_MOVE = 'mousemove';
const POINTER_UP = 'mouseup';
const POINT_CLICK = 'click';
const WHEEL = 'wheel';
const KEY_DOWN = 'keydown';
const KEY_UP = 'keyup';
const KEY_PRESS = 'keypress';
const CURSOR_DEFAULT = 'default';
const CURSOR_GRAB = '-webkit-grab';
const CURSOR_GRABBING = '-webkit-grabbing';

const MAX_WHEEL_VALUE = 10000;
const INIT_WHEEL_VALUE = 1000;
const MIN_WHEEL_VALUE = 100;
const INIT_SCALE = 1;
const WHEEL_SCALE_RATE = 1000;
const TRACKPAD_PAN_RATE = -1;
const TRACKPAD_PINCH_RATE = 12;
const KEEP_INSIDE = 0.2;


// 概念
// base 初始化时的状态
// source 每个状态对应的原始大小的状态，主要信息是 offset origin
// entity 当前实时的状态
// state 属性集合
// origin 缩放的原点

export default class Interaction {
    public $interaction: HTMLElement;
    private $container: HTMLElement;
    private movableWhenContained: boolean = true;
    private visibleSideWidth: number = 0;
    private visibleSideHeight: number = 0;
    private state;
    private device;
    private canvasOriginWidth;
    private canvasOriginHeight;

    constructor(container, options) {
        options = options || {};

        this.$container = container;
        const rect = this.getContainerRect();
        this.visibleSideWidth = rect.width * KEEP_INSIDE;
        this.visibleSideHeight = rect.height * KEEP_INSIDE;

        this.$interaction = container.querySelector(`.${styles.interaction}`);
        let style = this.$interaction.style;
        style.width = options.canvasWidth + 'px';
        style.height = options.canvasHeight + 'px';
        style.left = (rect.width - options.canvasWidth) / 2 + 'px';
        style.top = (rect.height - options.canvasHeight) / 2 + 'px';
        this.canvasOriginWidth = options.canvasWidth;
        this.canvasOriginHeight = options.canvasHeight;


        this.movableWhenContained = options.movableWhenContained || true;

        this.initAction();

        Event.on(Event.SCOPE_PAN, (delta) => {
            this.setPanStyle(delta.deltaX, delta.deltaY);
        });
    }

    setPanStyle(offsetX: number, offsetY: number) {
        const info = this.getEntityInfo();

        let x = info.left + offsetX;
        let y = info.top + offsetY;

        const tmp = this.keepVisible(x, y, info.width, info.height);
        x = tmp.x;
        y = tmp.y;

        this.setStyle({ x, y });
    }

    getSourceInfo(ev: MouseEvent) {
        // 求出 鼠标在缩放之后的 interaction 中的位置
        // 映射到原始 container 中的位置
        const interRect = this.$interaction.getBoundingClientRect();
        const tmpX = ev.pageX - interRect.left;
        const tmpY = ev.pageY - interRect.top;

        const originX = tmpX / this.state.scaleValue;
        const originY = tmpY / this.state.scaleValue;

        const containerRect = this.getContainerRect();
        const offsetX = ev.pageX - containerRect.left - originX;
        const offsetY = ev.pageY - containerRect.top - originY;

        return { originX, originY, offsetX, offsetY};
    }

    getEntityInfo() {
        const i = this.$interaction;
        const left = parseInt(i.style.left) || 0;
        const top = parseInt(i.style.top) || 0;
        const width = i.offsetWidth;
        const height = i.offsetHeight;
        return { top, left, width, height };
    }

    getContainerRect() {
        return this.$container.getBoundingClientRect();
    }

    // 相对于 base
    getTransformStyle(offsetX: number = 0, offsetY: number = 0, originX: number, originY: number, scale: number) {
        const width = this.canvasOriginWidth;
        const height = this.canvasOriginHeight;
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        let x;
        let y;

        if (this.isMovable()) {
            x = originX * (1 - scale) + offsetX;
            y = originY * (1 - scale) + offsetY;

            const tmp = this.keepVisible(x, y, scaledWidth, scaledHeight);
            x = tmp.x;
            y = tmp.y;
        } else {
            x = (scaledWidth - width) / 2;
            y = (scaledHeight - height) / 2;
        }

        return {
            x: x,
            y: y,
            width: scaledWidth,
            height: scaledHeight
        };
    }

    setStyle(info) {
        // offset 是相对于 base
        let style = this.$interaction.style;
        info.hasOwnProperty('width') && (style.width = `${info.width}px`);
        info.hasOwnProperty('height') && (style.height = `${info.height}px`);
        // 使用 translate 会变模糊
        info.hasOwnProperty('x') && (style.left = `${info.x}px`);
        info.hasOwnProperty('y') && (style.top = `${info.y}px`);

        Event.trigger(Event.CANVAS_TRANSFORM, info);
    }

    keepVisible(x, y, entityWidth, entityHeight) {
        const cRect = this.getContainerRect();

        const tmp1 = this.visibleSideWidth - entityWidth;
        (x < tmp1) && (x = tmp1);

        const tmp2 = cRect.width - this.visibleSideWidth;
        (x > tmp2) && (x = tmp2);

        const tmp3 = this.visibleSideHeight - entityHeight;
        (y < tmp3) && (y = tmp3);

        const tmp4 = cRect.height - this.visibleSideHeight;
        (y > tmp4) && (y = tmp4);

        return { x, y };
    }

    initAction() {

        let device = this.device = {
            altKey: false,
            metaKey: false,
            ctrlKey: false,
            spaceKey: false,
            isMouseLeftButtonDown: false,
            mouseButtonCode: -1, // -1 没有点击， 0左键 1中键 2右键 需要确认下兼容性问题
            wheelDeltaX: 0,
            wheelDeltaY: 0,
            keyCode: -1,
            clientX: 0,
            clientY: 0,
            pageX: 0,
            pageY: 0,
        };

        let state = this.state = {
            startX: 0,
            startY: 0,
            wheelValue: INIT_WHEEL_VALUE,
            scaleValue: INIT_SCALE
        };       

        let self = this;
        function wrap (callback) {
            return function (ev) {
                if ([POINTER_DOWN, POINTER_MOVE, POINTER_UP, POINT_CLICK].indexOf(ev.type) >= 0) {
                    ev.preventDefault();
                    self.setMouseAttributes(device, ev);
                } else if ([WHEEL].indexOf(ev.type) >= 0) {
                    ev.preventDefault();
                    self.setMouseAttributes(device, ev);
                    self.setKeyboardAttributes(device, ev);
                } else if ([KEY_DOWN, KEY_UP, KEY_PRESS].indexOf(ev.type) >= 0) {
                    self.setKeyboardAttributes(device, ev);
                }
                device.altKey = ev.altKey;
                callback && callback(device, state, ev);
            }
        }

        this.$container.addEventListener(WHEEL, wrap((device, state, ev) => {
            this.onWheel(device, state, ev);
        }), false);

        this.$container.addEventListener(POINTER_DOWN, wrap((device, state, ev) => {
            this.onMouseDown(device, state, ev);
        }), false);

        window.addEventListener(POINTER_MOVE, wrap((device, state, ev) => {
            this.onMouseMove(device, state, ev);
        }), false);

        window.addEventListener(POINTER_UP, wrap((device, state, ev) => {
            this.onMouseUp(device, state, ev);
        }), false);        

        window.addEventListener(KEY_DOWN, wrap((device, state, ev) => {            
            this.onKeyDown(device, state, ev);
        }), false);

        window.addEventListener(KEY_UP, wrap((device, state, ev) => {
            this.onKeyUp(device, state, ev);
        }), false);
    }

    onMouseDown(device, state, ev) {
        // ev.pageY === ev.y
        // ev.layerY 相对于父容器
        // ev.pageY 相对于页面
        // ev.offsetY 相对于target的位置

        if (device.isMouseLeftButtonDown && device.spaceKey) {
            this.$container.style.cursor = CURSOR_GRABBING;
        }

        state.startX = device.pageX;
        state.startY = device.pageY;
    }

    onMouseMove(device, state, ev) {
        if (device.isMouseLeftButtonDown && device.spaceKey && this.isMovable()) {
            this.setPanStyle(device.pageX - state.startX, device.pageY - state.startY);
            state.startX = device.pageX;
            state.startY = device.pageY;
        }
    }

    onMouseUp(device, state, ev) {
        device.isMouseLeftButtonDown = false;
        if (device.spaceKey) {
            this.$container.style.cursor = CURSOR_GRAB;
        } else {
            this.$container.style.cursor = CURSOR_DEFAULT;
        }
    }

    onWheel(device, state, ev) {
        // mac trackpad 双指平移: ev.deltaY * -3 === ev.wheelDeltaY
        // mac trackpad 双指缩放 与 鼠标滚轮 相同: ev.deltaY 为浮点数, ev.wheelDeltaY 为 120 倍数
        if (device.ctrlKey) { // 缩放 alt/ctrl+滚动
            const info = this.getSourceInfo(ev); // 先获取位置
            state.scaleValue = this.getScaleValue(device.deltaY * TRACKPAD_PINCH_RATE); // 后缩放
            const style = this.getTransformStyle(info.offsetX, info.offsetY, info.originX, info.originY, state.scaleValue); // 变形
            this.setStyle(style);
        } else if (this.isMovable()) { // 平移
            const rate = TRACKPAD_PAN_RATE;
            this.setPanStyle(device.deltaX / rate, device.deltaY / rate);
        }
    }

    onKeyDown(device, state, ev) {
        if (device.spaceKey && !device.isMouseLeftButtonDown) {
            this.$container.style.cursor = CURSOR_GRAB;
        }
    }

    onKeyUp(device, state, ev) {
        this.$container.style.cursor = CURSOR_DEFAULT;
    }

    getScaleValue(deltaY) {
        const s = this.state;
        s.wheelValue -= deltaY;
        s.wheelValue = utils.range(s.wheelValue, MIN_WHEEL_VALUE, MAX_WHEEL_VALUE);
        return s.wheelValue / WHEEL_SCALE_RATE;
    } 

    isMovable(): boolean {
        // interaction 小于容器，且配置 movableWhenContained 为 false，不能移动；其余状况能移动
        return !(this.movableWhenContained === false && this.state.scaleValue <= 1);
    }

    // 键盘事件属性
    setKeyboardAttributes(device, ev) {
        device.keyCode = ev.keyCode;

        device.altKey = ev.altKey;
        device.metaKey = ev.metaKey;
        device.ctrlKey = ev.ctrlKey;
        
        if (ev.type === KEY_DOWN) {
            device.spaceKey = ev.keyCode === 32;
        } else if (ev.type === KEY_UP) {
            device.spaceKey = false;
        }
    }

    // 鼠标事件属性
    setMouseAttributes(device, ev) {
        if (ev.type === POINTER_UP) {
            device.isMouseLeftButtonDown = false;
            device.mouseButtonCode = -1;
        } else if (ev.type === POINTER_DOWN) {
            device.mouseButtonCode = ev.button;

            if (device.mouseButtonCode === 0) {
                device.isMouseLeftButtonDown = true;
            }
        }

        device.wheelDeltaX = ev.wheelDeltaX;
        device.wheelDeltaY = ev.wheelDeltaY;
        device.deltaX = ev.deltaX;
        device.deltaY = ev.deltaY;
        device.keyCode = ev.keyCode;
        device.pageX = ev.pageX;
        device.pageY = ev.pageY;
        device.pageX = ev.pageX;
        device.pageY = ev.pageY;
    }    
}