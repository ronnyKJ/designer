'use strict'

import utils from '../utils/utils';
import IActionConfig from '../interface/actionConfig.interface';

const POINTER_DOWN: string = 'mousedown';
const POINTER_MOVE: string = 'mousemove';
const POINTER_UP: string = 'mouseup';
const POINT_CLICK: string = 'click';
const WHEEL: string = 'wheel';
const KEY_DOWN: string = 'keydown';
const KEY_UP: string = 'keyup';
const KEY_PRESS: string = 'keypress';
const CURSOR_DEFAULT: string = 'default';
const CURSOR_GRAB: string = '-webkit-grab';
const CURSOR_GRABBING: string = '-webkit-grabbing';
const TRACKPAD_PAN_RATE: number = -1;
const TRACKPAD_PINCH_RATE: number = 12;
const MAX_WHEEL_VALUE: number = 10000;
const MIN_WHEEL_VALUE: number = 100;
const WHEEL_SCALE_RATE: number = 1000;

export default class Action {
    public static POINTER_DOWN: string = POINTER_DOWN;
    public static POINTER_MOVE: string = POINTER_MOVE;
    public static POINTER_UP: string = POINTER_UP;
    public static POINT_CLICK: string = POINT_CLICK;
    public static WHEEL: string = WHEEL;
    public static KEY_DOWN: string = KEY_DOWN;
    public static KEY_UP: string = KEY_UP;
    public static KEY_PRESS: string = KEY_PRESS;
    public static CURSOR_DEFAULT: string = CURSOR_DEFAULT;
    public static CURSOR_GRAB: string = CURSOR_GRAB;
    public static CURSOR_GRABBING: string = CURSOR_GRABBING;

    private $target: HTMLElement;
    private $wheelTarget: HTMLElement;

    public state;
    private device;
    private config;
    
    constructor (config: IActionConfig) {
        this.config = config || {};
        this.config.cursor = this.config.cursor || {}; 

        if (!config.$target) {
            return;
        }

        this.$target = config.$target;
        this.$wheelTarget = config.$wheelTarget || this.$target;
        const pointerOverCursor = this.config.cursor.pointerOver;
        if (pointerOverCursor) {
            this.$target.style.cursor = pointerOverCursor;
        }

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
            deltaX: 0,
            deltaY: 0,
            wheelValue: config.initScaleValue * WHEEL_SCALE_RATE,
            scaleValue: config.initScaleValue || 1,
            beforeScaleValue: config.initScaleValue || 1,
            dragging: false
        };

        let self = this;
        function wrap (callback: Function) {
            return function (ev: any) {
                if ([POINTER_DOWN, POINTER_MOVE, POINTER_UP, POINT_CLICK].indexOf(ev.type) >= 0) {
                    ev.preventDefault();
                    self.setMouseAttributes(device, ev);
                } else if ([WHEEL].indexOf(ev.type) >= 0) {
                    ev.preventDefault();
                    self.setWheelAttributes(device, ev);
                    self.setKeyboardAttributes(device, ev);
                } else if ([KEY_DOWN, KEY_UP, KEY_PRESS].indexOf(ev.type) >= 0) {
                    self.setKeyboardAttributes(device, ev);
                }
                device.altKey = ev.altKey;
                callback && callback(device, state, ev);
            }
        }

        const pointerDownHandler = wrap((device, state, ev: MouseEvent) => {
            this.onPointerDown(device, state, ev);

            window.addEventListener(POINTER_MOVE, pointerMoveHandler, false);
            window.addEventListener(POINTER_UP, pointerUpHandler, false);
        });

        const pointerMoveHandler = wrap((device, state, ev: MouseEvent) => {
            this.onPointerMove(device, state, ev);
        });

        const pointerUpHandler = wrap((device, state, ev: MouseEvent) => {
            this.onPointerUp(device, state, ev);

            window.removeEventListener(POINTER_MOVE, pointerMoveHandler);
            window.removeEventListener(POINTER_UP, pointerUpHandler);
        });

        this.$target.addEventListener(POINTER_DOWN, pointerDownHandler, false);

        window.addEventListener(KEY_DOWN, wrap((device, state, ev: KeyboardEvent) => {            
            this.onKeyDown(device, state, ev);
        }), false);

        window.addEventListener(KEY_UP, wrap((device, state, ev: KeyboardEvent) => {
            this.onKeyUp(device, state, ev);
        }), false);
        
        const wheelHandler = wrap((device, state, ev: WheelEvent) => {
            this.onWheel(device, state, ev);
        });
        this.$wheelTarget.addEventListener(WHEEL, wheelHandler, false);
    }

    private onPointerDown(device, state, ev: MouseEvent): void {
        // ev.pageY === ev.y
        // ev.layerY 相对于父容器
        // ev.pageY 相对于页面
        // ev.offsetY 相对于target的位置

        const pointerDownCursor = this.config.cursor.pointerDown;
        if (pointerDownCursor && device.isMouseLeftButtonDown) {
            this.$target.style.cursor = pointerDownCursor;
        }

        state.startX = device.pageX;
        state.startY = device.pageY;

        this.config.onPointerDown && this.config.onPointerDown(device, state, ev);
    }

    private onPointerMove(device, state, ev: MouseEvent): void {
        state.deltaX = device.pageX - state.startX;
        state.deltaY = device.pageY - state.startY;

        this.config.onPointerMove && this.config.onPointerMove(device, state, ev);
        if (device.isMouseLeftButtonDown) {
            state.dragging = true;
            this.config.onPan && this.config.onPan(device, state, ev);
        }

        state.startX = device.pageX;
        state.startY = device.pageY;
    }

    private onPointerUp(device, state, ev: MouseEvent): void {
        const pointerUpCursor = this.config.cursor.pointerUp;
        if (pointerUpCursor && !device.isMouseLeftButtonDown) {
            this.$target.style.cursor = pointerUpCursor;
        }        
        this.config.onPointerUp && this.config.onPointerUp(device, state, ev);
    }

    private onWheel(device, state, ev: MouseEvent): void {
        // mac trackpad 双指平移: ev.deltaY * -3 === ev.wheelDeltaY
        // mac trackpad 双指缩放 与 鼠标滚轮 相同: ev.deltaY 为浮点数, ev.wheelDeltaY 为 120 倍数
        if (device.ctrlKey) { // 缩放 ctrl+滚动
            state.beforeScaleValue = state.scaleValue;
            state.wheelValue -= device.deltaY * TRACKPAD_PINCH_RATE;
            state.wheelValue = utils.range(state.wheelValue, MIN_WHEEL_VALUE, MAX_WHEEL_VALUE); // 约束
            state.scaleValue = state.wheelValue / WHEEL_SCALE_RATE;
            this.onScale(device, state, ev);
        } else { // 平移
            const rate = TRACKPAD_PAN_RATE;
            state.deltaX = device.deltaX / rate;
            state.deltaY = device.deltaY / rate;
            state.dragging = false;
            this.onPan(device, state, ev);
        }

        this.config.onWheel && this.config.onWheel(device, state, ev);
    }

    private onKeyDown(device, state, ev: KeyboardEvent): void {
        this.config.onKeyDown && this.config.onKeyDown(device, state, ev);
    }

    private onKeyUp(device, state, ev: KeyboardEvent): void {
        this.config.onKeyUp && this.config.onKeyUp(device, state, ev);
    }

    private onScale (device, state, ev: MouseEvent): void {
        this.config.onScale && this.config.onScale(device, state, ev);
    }

    private onPan (device, state, ev: MouseEvent): void {
        this.config.onPan && this.config.onPan(device, state, ev);
    }

    // 键盘事件属性
    private setKeyboardAttributes(device, ev: KeyboardEvent): void {
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

    // 鼠标点击事件属性
    private setMouseAttributes(device, ev: MouseEvent): void {
        if (ev.type === POINTER_UP) {
            device.isMouseLeftButtonDown = false;
            device.mouseButtonCode = -1;
        } else if (ev.type === POINTER_DOWN) {
            device.mouseButtonCode = ev.button;

            if (device.mouseButtonCode === 0) {
                device.isMouseLeftButtonDown = true;
            }
        }

        device.pageX = ev.pageX;
        device.pageY = ev.pageY;
    }

    // 鼠标滚动事件属性
    private setWheelAttributes(device, ev: WheelEvent): void {
        device.wheelDeltaX = ev.wheelDeltaX;
        device.wheelDeltaY = ev.wheelDeltaY;
        device.deltaX = ev.deltaX;
        device.deltaY = ev.deltaY;
    }    
}