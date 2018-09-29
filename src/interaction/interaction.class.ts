'use strict'

import * as styles from './interaction.less';
import utils from '../utils/utils';
import Event from '../event/event';
import Action from '../action/action.class';
import IDesignerConfig from '../interface/designerConfig.interface';
import IActionDevice from '../interface/actionDevice.interface';
import IActionState from '../interface/actionState.interface';

const KEEP_INSIDE: number = 0.2;
const INIT_CANVAS_MAX_RATIO: number = 0.9; // 初始化canvas长边占容器对应边比例

interface IStyleInfo {
    x: number,
    y: number,
    width?: number,
    height?: number
}

export default class Interaction {
    public $interaction: HTMLElement;
    private $container: HTMLElement;
    private movableWhenContained: boolean = true;
    private canvasOriginWidth: number;
    private canvasOriginHeight: number;
    private initScaleValue: number;
    private action: Action;

    constructor($container: HTMLElement, config: IDesignerConfig) {
        this.movableWhenContained = config.movableWhenContained || true;

        this.$container = $container;
        this.$interaction = $container.querySelector(`.${styles.interaction}`);

        this.preventBrowserDefaultAction();
        this.initCanvas(config);
        this.initAction();

        Event.on(Event.SCOPE_PAN, (delta: any) => {
            this.pan(delta.deltaX, delta.deltaY);
        });

        Event.on(Event.SCOPE_SCALE, (delta: any) => {
            this.pan(delta.deltaX, delta.deltaY);
        });
    }

    private initCanvas (config: IDesignerConfig): void {
        const containerRect = this.$container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        const canvasOriginWidth = this.canvasOriginWidth = config.canvasOriginWidth;
        const canvasOriginHeight = this.canvasOriginHeight = config.canvasOriginHeight;

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

    private scale (scaleValue: number, beforeScaleValue: number, originX?: number, originY?: number): void {
        const $in = this.$interaction;
        const width = this.canvasOriginWidth * scaleValue;
        const height = this.canvasOriginHeight * scaleValue;

        if (!originX) {
            originX = $in.offsetWidth / 2;
        }

        if (!originY) {
            originY = $in.offsetHeight / 2;
        }

        const x = $in.offsetLeft - (scaleValue / beforeScaleValue - 1) * originX;
        const y = $in.offsetTop - (scaleValue / beforeScaleValue - 1) * originY;

        this.setStyle({x, y, width, height});
    }

    private setStyle(info: IStyleInfo): void {
        let style = this.$interaction.style;
        info.hasOwnProperty('width') && (style.width = `${info.width}px`);
        info.hasOwnProperty('height') && (style.height = `${info.height}px`);
        // 使用 translate 会变模糊
        info.hasOwnProperty('x') && (style.left = `${info.x}px`);
        info.hasOwnProperty('y') && (style.top = `${info.y}px`);

        Event.trigger(Event.CANVAS_TRANSFORM, info);
    }

    private keepVisible(x: number, y: number, width: number, height: number) {
        const containerRect = this.$container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        const visibleSideWidth = containerWidth * KEEP_INSIDE;
        const visibleSideHeight = containerHeight * KEEP_INSIDE;
        
        const tmpX1 = visibleSideWidth - width;
        (x < tmpX1) && (x = tmpX1);

        const tmpX2 = containerWidth - visibleSideWidth;
        (x > tmpX2) && (x = tmpX2);

        const tmpY1 = visibleSideHeight - height;
        (y < tmpY1) && (y = tmpY1);

        const tmpY2 = containerHeight - visibleSideHeight;
        (y > tmpY2) && (y = tmpY2);

        return { x, y };
    } 

    private initAction(): void {
        const self = this;
        this.action = new Action({
            $target: this.$interaction,
            $wheelTarget: this.$container,
            initScaleValue: this.initScaleValue,
            onPointerDown (device: IActionDevice, state: IActionState, ev: MouseEvent) {
                if (device.isMouseLeftButtonDown && device.spaceKey) {
                    self.$interaction.style.cursor = Action.CURSOR_GRABBING;
                }
            },
            onPointerUp (device: IActionDevice, state: IActionState, ev: MouseEvent) {
                device.isMouseLeftButtonDown = false;
                if (device.spaceKey) {
                    self.$interaction.style.cursor = Action.CURSOR_GRAB;
                } else {
                    self.$interaction.style.cursor = Action.CURSOR_DEFAULT;
                }
            },
            onScale (device: IActionDevice, state: IActionState, ev: MouseEvent) {

                const rect = self.$interaction.getBoundingClientRect();
                const offsetX = ev.pageX - rect.left;
                const offsetY = ev.pageY - rect.top;
                
                self.scale(state.scaleValue, state.beforeScaleValue, offsetX, offsetY);
            },
            onPan (device: IActionDevice, state: IActionState, ev: MouseEvent) {
                const movable = self.isMovable();
                if ((state.dragging && device.spaceKey && movable) || (!state.dragging && movable)) { // 平移
                    self.pan(state.deltaX, state.deltaY);
                }
            },
            onKeyDown (device: IActionDevice, state: IActionState, ev: KeyboardEvent) {
                if (device.spaceKey && !device.isMouseLeftButtonDown) {
                    self.$interaction.style.cursor = Action.CURSOR_GRAB;
                }
            },
            onKeyUp(device: IActionDevice, state: IActionState, ev: KeyboardEvent) {
                self.$interaction.style.cursor = Action.CURSOR_DEFAULT;
            }
        });
    }

    private isMovable(): boolean {
        // interaction 小于容器，且配置 movableWhenContained 为 false，不能移动；其余状况能移动
        return !(this.movableWhenContained === false && this.action.state.scaleValue <= 1);
    }

}