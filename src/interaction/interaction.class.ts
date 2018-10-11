'use strict'

import RX from '../core/rx.class';
import * as styles from './interaction.less';
import Model from '../core/model.class';
import Action from '../action/action.class';
import IDesignerConfig from '../interface/designerConfig.interface';
import IActionDevice from '../interface/actionDevice.interface';
import IInteractionState from '../interface/interactionState.interface';
import { INIT_CANVAS_MAX_RATIO, KEEP_INSIDE, WHEEL, CURSOR_DEFAULT, CURSOR_GRAB, CURSOR_GRABBING, CONTEXTMENU } from '../core/config';


export default class Interaction extends RX {

    private movableWhenContained: boolean = true;

    constructor(model: Model, $dom: HTMLElement, config: IDesignerConfig) {
        super(model, $dom, config);
    }

    create (): void {
        this.$dom.innerHTML = `
            <!-- <div class="${styles.adjuster}">
                <div class="${styles.outline}" data-act="move"></div>
                <div class="${styles.knob} ${styles.nw}" data-act="resize" data-point="nw"></div>
                <div class="${styles.knob} ${styles.n}" data-act="resize" data-point="n"></div>
                <div class="${styles.knob} ${styles.ne}" data-act="resize" data-point="ne"></div>
                <div class="${styles.knob} ${styles.e}" data-act="resize" data-point="e"></div>
                <div class="${styles.knob} ${styles.se}" data-act="resize" data-point="se"></div>
                <div class="${styles.knob} ${styles.s}" data-act="resize" data-point="s"></div>
                <div class="${styles.knob} ${styles.sw}" data-act="resize" data-point="sw"></div>
                <div class="${styles.knob} ${styles.w}" data-act="resize" data-point="w"></div>
            </div> -->
        `;

        this.preventBrowserDefaultAction();
        this.initProperties();
        this.init();
        this.action();
    }

    private transform(): void {
        const {
            offsetX, offsetY, width, height
        } = this.getState();

        let style = this.$dom.style;
        style.width = `${width}px`;
        style.height = `${height}px`;
        // 使用 translate 会变模糊
        style.left = `${offsetX}px`;
        style.top = `${offsetY}px`;
    }

    private getState (): IInteractionState {
        const {scale, translateX, translateY, originX, originY, canvasWidth, canvasHeight} = this.model.data;

        const originState: IInteractionState = this.getOriginState();
        const deltaX = (scale - 1) * originX;
        const deltaY = (scale - 1) * originY;
        let x = originState.offsetX + translateX - deltaX;
        let y = originState.offsetY + translateY - deltaY;

        return {
            offsetX: x, 
            offsetY: y, 
            width: canvasWidth,
            height: canvasHeight
        }
    }

    private getOriginState(): IInteractionState {
        const {canvasOriginWidth, canvasOriginHeight} = this.model.data;
        const {width, height} = this.$container.getBoundingClientRect();

        return {
            offsetX: (width - canvasOriginWidth) / 2,
            offsetY: (height - canvasOriginHeight) / 2,
            width: canvasOriginWidth,
            height: canvasOriginHeight
        };
    }

    private initProperties (): void {
        this.movableWhenContained = this.config.movableWhenContained || true;
    }

    private init (): void {
        const {
            width: containerWidth,
            height: containerHeight
        } = this.$container.getBoundingClientRect();
        const { canvasOriginWidth, canvasOriginHeight } = this.model.data;

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

        this.model.data.scale = initWidth / canvasOriginWidth;
    }

    private action(): void {
        const self = this;
        new Action({
            $target: this.$dom,
            $wheelTarget: this.$container,
            onPointerDown (device: IActionDevice, ev: MouseEvent) {
                if (device.isMouseLeftButtonDown && device.spaceKey) {
                    self.$dom.style.cursor = CURSOR_GRABBING;
                }
            },
            onPointerUp (device: IActionDevice, ev: MouseEvent) {
                device.isMouseLeftButtonDown = false;
                if (device.spaceKey) {
                    self.$dom.style.cursor = CURSOR_GRAB;
                } else {
                    self.$dom.style.cursor = CURSOR_DEFAULT;
                }
            },
            onScale (deltaScaleValue: number, device?: IActionDevice, ev?: MouseEvent) {
                const {left, top, width, height} = self.$dom.getBoundingClientRect();

                let originXRate;
                let originYRate;
                if (ev) {
                    originXRate = (ev.pageX - left) / width;
                    originYRate = (ev.pageY - top) / height;
                } else {
                    originXRate = 0.5;
                    originYRate = 0.5;
                }

                self.scale(self.model.data.scale + deltaScaleValue, originXRate, originYRate);
            },
            onPan (deltaX: number, deltaY: number, device?: IActionDevice, ev?: MouseEvent) {
                const movable = self.isMovable();
                if ((device.dragging && device.spaceKey && movable) || (!device.dragging && movable)) { // 平移
                    self.pan(deltaX, deltaY);
                }
            },
            onKeyDown (device: IActionDevice, ev: KeyboardEvent) {
                if (device.spaceKey && !device.isMouseLeftButtonDown) {
                    self.$dom.style.cursor = CURSOR_GRAB;
                }
            },
            onKeyUp(device: IActionDevice, ev: KeyboardEvent) {
                self.$dom.style.cursor = CURSOR_DEFAULT;
            }
        });
    }

    beforeUpdateView (): void {
        this.keepVisible();
    }

    updateView (): void {
        this.transform();
    }

    watch (): void {
        this.model.watch(['scale', 'originX', 'originY', 'translateX', 'translateY'], (newValue: number, oldValue: number) => {
            this.beforeUpdateView();
            this.updateView();
        });        
    }

    private preventBrowserDefaultAction () {
        // 在容器上阻止网页默认操作，后退、缩放
        this.$container.addEventListener(WHEEL, (ev) => {
            ev.preventDefault();
        }, false);

        this.$container.addEventListener(CONTEXTMENU, (ev) => {
            ev.preventDefault();
        }, false)
    }

    private pan(deltaX: number, deltaY: number) {
        let data = this.model.data;
        data.translateX += deltaX;
        data.translateY += deltaY;
    }

    private scale (newScaleValue: number, originXRate?: number, originYRate?: number): void {
        if (!originXRate) {
            originXRate = 0.5;
        }

        if (!originYRate) {
            originYRate = 0.5;
        }

        let data = this.model.data;
        const { scale: beforeScale, canvasOriginWidth, canvasOriginHeight } = data;
        data.scale = newScaleValue;
        data.originX = canvasOriginWidth * originXRate;
        data.originY = canvasOriginHeight * originYRate;

        const { left, top, width, height } = this.$dom.getBoundingClientRect();
        const { left: containerLeft, top: containerTop } = this.$container.getBoundingClientRect();
        const { offsetX, offsetY, width: originWidth, height: originHeight } = this.getOriginState();
        // 算出 origin 和 当前$dom 的 差值
        data.translateX = (left + width * originXRate) - (containerLeft + offsetX + originWidth * originXRate);
        data.translateY = (top + height * originYRate) - (containerTop + offsetY + originHeight * originYRate);
    }

    private keepVisible() {
        let {offsetX: x, offsetY: y, width, height} = this.getState();

        const {
            width: containerWidth,
            height: containerHeight
        } = this.$container.getBoundingClientRect();
        const visibleSideWidth = containerWidth * KEEP_INSIDE;
        const visibleSideHeight = containerHeight * KEEP_INSIDE;
        
        const originX = x;
        const originY = y;

        const tmpX1 = visibleSideWidth - width;
        (x < tmpX1) && (x = tmpX1);

        const tmpX2 = containerWidth - visibleSideWidth;
        (x > tmpX2) && (x = tmpX2);

        const tmpY1 = visibleSideHeight - height;
        (y < tmpY1) && (y = tmpY1);

        const tmpY2 = containerHeight - visibleSideHeight;
        (y > tmpY2) && (y = tmpY2);


        const diffX = x - originX;
        const diffY = y - originY;

        let data = this.model.data;
        this.model.pureSet('translateX', data.translateX + diffX);
        this.model.pureSet('translateY', data.translateY + diffY);
    }

    private isMovable(): boolean {
        // interaction 小于容器，且配置 movableWhenContained 为 false，不能移动；其余状况能移动
        return !(this.movableWhenContained === false && this.model.data.scale <= 1);
    }
}