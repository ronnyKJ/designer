'use strict'

import * as styles from './interaction.less';
import utils from '../utils/utils';
import Event from '../event/event';
import Action from '../action/action.class';

const KEEP_INSIDE = 0.2;
const INIT_CANVAS_MAX_RATIO = 0.9; // 初始化canvas长边占容器对应边比例


// 概念
// base 初始化时的状态
// source 每个状态对应的原始大小的状态，主要信息是 offset origin
// entity 当前实时的状态
// origin 缩放的原点

export default class Interaction {
    public $interaction: HTMLElement;
    private $container: HTMLElement;
    private movableWhenContained: boolean = true;
    private canvasOriginWidth;
    private canvasOriginHeight;
    private action;
    private initScaleValue;

    constructor($container, options) {
        options = options || {};
        this.movableWhenContained = options.movableWhenContained || true;

        this.$container = $container;
        this.$interaction = $container.querySelector(`.${styles.interaction}`);

        this.preventBrowserDefaultAction();
        this.initCanvas(options);
        this.initAction();

        Event.on(Event.SCOPE_PAN, (delta) => {
            this.setPanStyle(delta.deltaX, delta.deltaY);
        });

        Event.on(Event.SCOPE_SCALE, (delta) => {
            this.setPanStyle(delta.deltaX, delta.deltaY);
        });
    }

    private initCanvas (options) {
        const containerRect = this.getContainerRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        const canvasOriginWidth = options.canvasOriginWidth;
        const canvasOriginHeight = options.canvasOriginHeight;

        let initWidth;
        let initHeight;
        if (containerWidth / containerHeight > canvasOriginWidth / canvasOriginHeight) { // 高为长边
            initHeight = containerHeight * INIT_CANVAS_MAX_RATIO;
            initWidth = initHeight / canvasOriginHeight * canvasOriginWidth;
        } else {
            initWidth = containerWidth * INIT_CANVAS_MAX_RATIO;
            initHeight = initWidth / canvasOriginWidth * canvasOriginHeight;
        }

        if (initWidth > canvasOriginWidth) {
            initWidth = canvasOriginWidth;
        }
        if (initHeight > canvasOriginHeight) {
            initHeight = canvasOriginHeight;
        }        

        this.initScaleValue = initWidth / canvasOriginWidth;

        utils.setStyle(this.$interaction, {
            width: initWidth + 'px',
            height: initHeight + 'px',
            left: (containerWidth - initWidth) / 2 + 'px',
            top: (containerHeight - initHeight) / 2 + 'px'
        });
    }

    public getInteractionRect () {
        const $in = this.$interaction
        return {
            width: $in.offsetWidth,
            height: $in.offsetHeight,
            x: $in.offsetLeft,
            y: $in.offsetTop
        };
    }

    private preventBrowserDefaultAction () {
        // 在容器上阻止网页默认操作，后退、缩放
        this.$container.addEventListener(Action.WHEEL, (ev) => {
            ev.preventDefault();
        }, false);
    }

    private setPanStyle(offsetX: number, offsetY: number) {
        const info = this.getEntityInfo();

        let x = info.left + offsetX;
        let y = info.top + offsetY;

        const tmp = this.keepVisible(x, y, info.width, info.height);
        x = tmp.x;
        y = tmp.y;

        this.setStyle({ x, y });
    }

    private getSourceInfo(ev: MouseEvent) {
        // 求出 鼠标在缩放之后的 interaction 中的位置
        // 映射到原始 container 中的位置
        const interRect = this.$interaction.getBoundingClientRect();
        const tmpX = ev.pageX - interRect.left;
        const tmpY = ev.pageY - interRect.top;

        const originX = tmpX / this.action.state.beforeScaleValue;
        const originY = tmpY / this.action.state.beforeScaleValue;

        const containerRect = this.getContainerRect();
        const offsetX = ev.pageX - containerRect.left - originX;
        const offsetY = ev.pageY - containerRect.top - originY;

        return { originX, originY, offsetX, offsetY};
    }

    private getEntityInfo() {
        const i = this.$interaction;
        const left = parseInt(i.style.left) || 0;
        const top = parseInt(i.style.top) || 0;
        const width = i.offsetWidth;
        const height = i.offsetHeight;
        return { top, left, width, height };
    }

    private getContainerRect() {
        return this.$container.getBoundingClientRect();
    }

    // 相对于 base
    private getTransformStyle(offsetX: number = 0, offsetY: number = 0, originX: number, originY: number, scale: number) {
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

    private setStyle(info) {
        // offset 是相对于 base
        let style = this.$interaction.style;
        info.hasOwnProperty('width') && (style.width = `${info.width}px`);
        info.hasOwnProperty('height') && (style.height = `${info.height}px`);
        // 使用 translate 会变模糊
        info.hasOwnProperty('x') && (style.left = `${info.x}px`);
        info.hasOwnProperty('y') && (style.top = `${info.y}px`);

        Event.trigger(Event.CANVAS_TRANSFORM, info);
    }

    private keepVisible(x, y, entityWidth, entityHeight) {
        const cRect = this.getContainerRect();

        const containerRect = this.getContainerRect();
        const visibleSideWidth = containerRect.width * KEEP_INSIDE;
        const visibleSideHeight = containerRect.height * KEEP_INSIDE;
        
        const tmpX1 = visibleSideWidth - entityWidth;
        (x < tmpX1) && (x = tmpX1);

        const tmpX2 = cRect.width - visibleSideWidth;
        (x > tmpX2) && (x = tmpX2);

        const tmpY1 = visibleSideHeight - entityHeight;
        (y < tmpY1) && (y = tmpY1);

        const tmpY2 = cRect.height - visibleSideHeight;
        (y > tmpY2) && (y = tmpY2);

        return { x, y };
    } 

    private initAction() {
        const self = this;
        this.action = new Action({
            $target: this.$interaction,
            $wheelTarget: this.$container,
            initScaleValue: this.initScaleValue,
            onPointerDown (device, state, ev) {
                if (device.isMouseLeftButtonDown && device.spaceKey) {
                    self.$interaction.style.cursor = Action.CURSOR_GRABBING;
                }
            },
            onPointerUp (device, state, ev) {
                device.isMouseLeftButtonDown = false;
                if (device.spaceKey) {
                    self.$interaction.style.cursor = Action.CURSOR_GRAB;
                } else {
                    self.$interaction.style.cursor = Action.CURSOR_DEFAULT;
                }
            },
            onScale (device, state, ev) {
                const info = self.getSourceInfo(ev); // 先获取位置
                const style = self.getTransformStyle(info.offsetX, info.offsetY, info.originX, info.originY, state.scaleValue); // 变形
                self.setStyle(style);
            },
            onPan (device, state, ev) {
                const movable = self.isMovable();
                if ((state.dragging && device.spaceKey && movable) || (!state.dragging && movable)) { // 平移
                    self.setPanStyle(state.deltaX, state.deltaY);
                }
            },
            onKeyDown (device, state, ev) {
                if (device.spaceKey && !device.isMouseLeftButtonDown) {
                    self.$interaction.style.cursor = Action.CURSOR_GRAB;
                }
            },
            onKeyUp(device, state, ev) {
                self.$interaction.style.cursor = Action.CURSOR_DEFAULT;
            }
        });
    }

    private isMovable(): boolean {
        // interaction 小于容器，且配置 movableWhenContained 为 false，不能移动；其余状况能移动
        return !(this.movableWhenContained === false && this.action.state.scaleValue <= 1);
    }
 
}