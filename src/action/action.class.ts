'use strict'

import Event from '../core/event';
import IActionConfig from '../interface/actionConfig.interface';
import IActionDevice from '../interface/actionDevice.interface';
import { 
    POINTER_DOWN,
    POINTER_MOVE,
    POINTER_UP, 
    POINT_CLICK,
    WHEEL,
    KEY_DOWN, 
    KEY_UP,
    KEY_PRESS,
    TRACKPAD_PAN_RATE,
    TRACKPAD_PINCH_RATE,
    WHEEL_SCALE_RATE
} from '../core/config';

export default class Action {
    private $target: HTMLElement;
    private $targetContainer: Window;
    private $wheelTarget: HTMLElement;

    private state: any;
    private device: IActionDevice;
    private config: IActionConfig;
    
    constructor (config: IActionConfig) {
        this.config = config;
        this.config.cursor = this.config.cursor || {}; 

        if (!config.$target) {
            return;
        }

        this.$target = config.$target;
        this.$targetContainer = window;
        this.$wheelTarget = config.$wheelTarget || this.$target;
        const pointerOverCursor = this.config.cursor.pointerOver;
        if (pointerOverCursor) {
            this.$target.style.cursor = pointerOverCursor;
        }

        this.device = {
            altKey: false,
            metaKey: false,
            ctrlKey: false,
            spaceKey: false,
            dragging: false,
            isMouseLeftButtonDown: false,
            mouseButtonCode: -1, // -1 没有点击， 0左键 1中键 2右键 需要确认下兼容性问题
            wheelDeltaX: 0,
            wheelDeltaY: 0,
            keyCode: -1,
            clientX: 0,
            clientY: 0,
            pageX: 0,
            pageY: 0,
            deltaX: 0,
            deltaY: 0
        };
        let device: IActionDevice = this.device;

        this.state = {
            startX: 0,
            startY: 0
        };

        let self = this;
        function wrap (callback: Function) {
            return function (ev: MouseEvent & WheelEvent & KeyboardEvent) {
                if ([POINTER_DOWN, POINTER_MOVE, POINTER_UP, POINT_CLICK].indexOf(ev.type) >= 0) {
                    ev.preventDefault();
                    if (ev)
                    self.setMouseAttributes(device, ev);
                } else if ([WHEEL].indexOf(ev.type) >= 0) {
                    ev.preventDefault();
                    self.setWheelAttributes(device, ev);
                    self.setKeyboardAttributes(device, ev);
                } else if ([KEY_DOWN, KEY_UP, KEY_PRESS].indexOf(ev.type) >= 0) {
                    self.setKeyboardAttributes(device, ev);
                }
                device.altKey = ev.altKey;
                callback && callback(device, ev);
            }
        }

        const pointerDownHandler = wrap((device: IActionDevice, ev: MouseEvent) => {
            this.onPointerDown(device, ev);

            this.$targetContainer.addEventListener(POINTER_MOVE, pointerMoveHandler, false);
            this.$targetContainer.addEventListener(POINTER_UP, pointerUpHandler, false);
        });

        const pointerMoveHandler = wrap((device: IActionDevice, ev: MouseEvent) => {
            this.onPointerMove(device, ev);
        });

        const pointerUpHandler = wrap((device: IActionDevice, ev: MouseEvent) => {
            this.onPointerUp(device, ev);

            this.$targetContainer.removeEventListener(POINTER_MOVE, pointerMoveHandler);
            this.$targetContainer.removeEventListener(POINTER_UP, pointerUpHandler);
        });

        this.$target.addEventListener(POINTER_DOWN, pointerDownHandler, false);

        window.addEventListener(KEY_DOWN, wrap((device: IActionDevice, ev: KeyboardEvent) => {            
            this.onKeyDown(device, ev);
        }), false);

        window.addEventListener(KEY_UP, wrap((device: IActionDevice, ev: KeyboardEvent) => {
            this.onKeyUp(device, ev);
        }), false);
        
        const wheelHandler = wrap((device: IActionDevice, ev: WheelEvent) => {
            this.onWheel(device, ev);
        });
        this.$wheelTarget.addEventListener(WHEEL, wheelHandler, false);

    }

    private onPointerDown(device: IActionDevice, ev: MouseEvent): void {
        // ev.pageY === ev.y
        // ev.layerY 相对于父容器
        // ev.pageY 相对于页面
        // ev.offsetY 相对于target的位置

        const pointerDownCursor = this.config.cursor.pointerDown;
        if (pointerDownCursor && device.isMouseLeftButtonDown) {
            this.$target.style.cursor = pointerDownCursor;
        }

        let state = this.state;
        state.startX = device.pageX;
        state.startY = device.pageY;

        this.config.onPointerDown && this.config.onPointerDown(device, ev);
    }

    private onPointerMove(device: IActionDevice, ev: MouseEvent): void {
        let state = this.state;
        state.deltaX = device.pageX - state.startX;
        state.deltaY = device.pageY - state.startY;

        this.config.onPointerMove && this.config.onPointerMove(device, ev);
        if (device.isMouseLeftButtonDown) {
            device.dragging = true;
            this.config.onPan && this.config.onPan(state.deltaX, state.deltaY, device, ev);
        }

        state.startX = device.pageX;
        state.startY = device.pageY;
    }

    private onPointerUp(device: IActionDevice, ev: MouseEvent): void {
        const pointerUpCursor = this.config.cursor.pointerUp;
        if (pointerUpCursor && !device.isMouseLeftButtonDown) {
            this.$target.style.cursor = pointerUpCursor;
        }        
        this.config.onPointerUp && this.config.onPointerUp(device, ev);
    }

    private onWheel(device: IActionDevice, ev: MouseEvent): void {
        // mac trackpad 双指平移: ev.deltaY * -3 === ev.wheelDeltaY
        // mac trackpad 双指缩放 与 鼠标滚轮 相同: ev.deltaY 为浮点数, ev.wheelDeltaY 为 120 倍数
        if (device.ctrlKey) { // 缩放 ctrl+滚动
            const deltaScaleValue = device.deltaY * TRACKPAD_PINCH_RATE / WHEEL_SCALE_RATE;
            this.onScale(deltaScaleValue, device, ev);
        } else { // 平移
            const deltaX = device.deltaX / TRACKPAD_PAN_RATE;
            const deltaY = device.deltaY / TRACKPAD_PAN_RATE;
            device.dragging = false;
            this.onPan(deltaX, deltaY, device, ev);
        }

        this.config.onWheel && this.config.onWheel(device, ev);
    }

    private onKeyDown(device: IActionDevice, ev: KeyboardEvent): void {
        this.config.onKeyDown && this.config.onKeyDown(device, ev);
    }

    private onKeyUp(device: IActionDevice, ev: KeyboardEvent): void {
        this.config.onKeyUp && this.config.onKeyUp(device, ev);
    }

    private onScale (deltaScaleValue: number, device: IActionDevice, ev: MouseEvent): void {
        this.config.onScale && this.config.onScale(deltaScaleValue, device, ev);
    }

    private onPan (deltaX: number, deltaY: number, device: IActionDevice, ev: MouseEvent): void {
        this.config.onPan && this.config.onPan(deltaX, deltaY, device, ev);
    }

    // 键盘事件属性
    private setKeyboardAttributes(device: IActionDevice, ev: KeyboardEvent): void {
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
    private setMouseAttributes(device: IActionDevice, ev: MouseEvent): void {
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
    private setWheelAttributes(device: IActionDevice, ev: WheelEvent): void {
        device.wheelDeltaX = ev.wheelDeltaX;
        device.wheelDeltaY = ev.wheelDeltaY;
        device.deltaX = ev.deltaX;
        device.deltaY = ev.deltaY;
    }
}