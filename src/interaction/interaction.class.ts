'use strict'

import * as styles from './interaction.less';
import utils from '../utils/utils';
import Event from '../event/event';
import Action from '../action/action.class';

const KEEP_INSIDE = 0.2;
const INIT_CANVAS_MAX_RATIO = 0.9; // 初始化canvas长边占容器对应边比例

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
            this.pan(delta.deltaX, delta.deltaY);
        });

        Event.on(Event.SCOPE_SCALE, (delta) => {
            this.pan(delta.deltaX, delta.deltaY);
        });
    }

    private initCanvas (options) {
        const containerRect = this.$container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        const canvasOriginWidth = this.canvasOriginWidth = options.canvasOriginWidth;
        const canvasOriginHeight = this.canvasOriginHeight = options.canvasOriginHeight;

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

    private pan(offsetX: number, offsetY: number) {
        const $in = this.$interaction;
        
        let x = $in.offsetLeft + offsetX;
        let y = $in.offsetTop + offsetY;

        const tmp = this.keepVisible(x, y, $in.offsetWidth, $in.offsetHeight);
        x = tmp.x;
        y = tmp.y;

        this.setStyle({ x, y });
    }

    private scale (scaleValue, beforeScaleValue, originX, originY) {
        const $in = this.$interaction;

        const width = this.canvasOriginWidth * scaleValue;
        const height = this.canvasOriginHeight * scaleValue;

        const x = $in.offsetLeft - (scaleValue / beforeScaleValue - 1) * originX;
        const y = $in.offsetTop - (scaleValue / beforeScaleValue - 1) * originY;

        this.setStyle({x, y, width, height});
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
        const containerRect = this.$container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const visibleSideWidth = containerWidth * KEEP_INSIDE;
        const visibleSideHeight = containerHeight * KEEP_INSIDE;
        
        const tmpX1 = visibleSideWidth - entityWidth;
        (x < tmpX1) && (x = tmpX1);

        const tmpX2 = containerWidth - visibleSideWidth;
        (x > tmpX2) && (x = tmpX2);

        const tmpY1 = visibleSideHeight - entityHeight;
        (y < tmpY1) && (y = tmpY1);

        const tmpY2 = containerHeight - visibleSideHeight;
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

                const rect = self.$interaction.getBoundingClientRect();
                const offsetX = ev.pageX - rect.left;
                const offsetY = ev.pageY - rect.top;
                
                self.scale(state.scaleValue, state.beforeScaleValue, offsetX, offsetY);
            },
            onPan (device, state, ev) {
                const movable = self.isMovable();
                if ((state.dragging && device.spaceKey && movable) || (!state.dragging && movable)) { // 平移
                    self.pan(state.deltaX, state.deltaY);
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