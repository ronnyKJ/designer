'use strict'

import * as styles from './interaction.less';
import utils from '../utils/utils';
import Event from '../event/event';
import Action from '../action/action.class';

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
    private canvasOriginWidth;
    private canvasOriginHeight;
    private action;

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

        Event.on(Event.SCOPE_SCALE, (delta) => {
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

        const originX = tmpX / this.action.state.scaleValue;
        const originY = tmpY / this.action.state.scaleValue;

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
        const self = this;
        this.action = new Action({
            $target: this.$interaction,
            $wheelTarget: this.$container,
            initScaleValue: 1,
            initWheelValue: 1000,
            onPointerDown (device, state, ev) {
                if (device.isMouseLeftButtonDown && device.spaceKey) {
                    self.$interaction.style.cursor = Action.CURSOR_GRABBING;
                }
            },
            onPointerMove (device, state, ev) {
                if (device.isMouseLeftButtonDown && device.spaceKey && self.isMovable()) {
                    self.setPanStyle(state.deltaX, state.deltaY);
                }
            },
            onPointerUp(device, state, ev) {
                device.isMouseLeftButtonDown = false;
                if (device.spaceKey) {
                    self.$interaction.style.cursor = Action.CURSOR_GRAB;
                } else {
                    self.$interaction.style.cursor = Action.CURSOR_DEFAULT;
                }
            },
            onWheel(device, state, ev) {
                // mac trackpad 双指平移: ev.deltaY * -3 === ev.wheelDeltaY
                // mac trackpad 双指缩放 与 鼠标滚轮 相同: ev.deltaY 为浮点数, ev.wheelDeltaY 为 120 倍数
                if (device.ctrlKey) { // 缩放 alt/ctrl+滚动
                    const info = self.getSourceInfo(ev); // 先获取位置
                    state.scaleValue = self.getScaleValue(device.deltaY * TRACKPAD_PINCH_RATE); // 后缩放
                    const style = self.getTransformStyle(info.offsetX, info.offsetY, info.originX, info.originY, state.scaleValue); // 变形
                    self.setStyle(style);
                } else if (self.isMovable()) { // 平移
                    const rate = TRACKPAD_PAN_RATE;
                    self.setPanStyle(device.deltaX / rate, device.deltaY / rate);
                }
            },
            onKeyDown(device, state, ev) {
                if (device.spaceKey && !device.isMouseLeftButtonDown) {
                    self.$interaction.style.cursor = Action.CURSOR_GRAB;
                }
            },
            onKeyUp(device, state, ev) {
                self.$interaction.style.cursor = Action.CURSOR_DEFAULT;
            }
        });
    }

    getScaleValue(deltaY) {
        const s = this.action.state;
        s.wheelValue -= deltaY;
        s.wheelValue = utils.range(s.wheelValue, MIN_WHEEL_VALUE, MAX_WHEEL_VALUE);
        return s.wheelValue / WHEEL_SCALE_RATE;
    } 

    isMovable(): boolean {
        // interaction 小于容器，且配置 movableWhenContained 为 false，不能移动；其余状况能移动
        return !(this.movableWhenContained === false && this.action.state.scaleValue <= 1);
    }
 
}