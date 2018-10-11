'use strict'

import RX from '../core/rx.class';
import * as styles from './navigator.less';
import Action from '../action/action.class';
import Model from '../core/model.class';
import IDesignerConfig from '../interface/designerConfig.interface';
import IActionDevice from '../interface/actionDevice.interface';
import IData from '../interface/data.interface';
import { MAX_SCALE_VALUE, MIN_SCALE_VALUE, TEXT_INPUT, TEXT_CHANGE, POINT_CLICK, CURSOR_GRAB, CURSOR_GRABBING } from '../core/config';


export default class Navigator extends RX {
    private $navigator: HTMLElement;
    private $thumbnail: HTMLElement;
    private $scope: HTMLElement;
    private $range: HTMLInputElement;
    private $minBtn: HTMLInputElement;
    private $maxBtn: HTMLInputElement;
    private $text: HTMLInputElement;

    constructor (model: Model, $dom: HTMLElement, config: IDesignerConfig) {
        super(model, $dom, config);
    }

    create (): void {
        this.$dom.innerHTML = `
            <div class="${styles.navigator}">
                <div class="${styles.thumbnail}">
                    <div class="${styles.scope}"></div>                
                </div>
                <div class="${styles.slider}">
                    <input type="button" class="${styles.min}" value="min" />
                    <input type="range" class="${styles.range}" max="10" min="0.1" defaultValue="1" step="0.1" />
                    <input type="button" class="${styles.max}" value="max" />
                </div>
                <input type="number" step="0.1" class="${styles.text}" value="${this.model.data.scale}" />
            </div>
        `;

        this.initProperties();
        this.containThumbnail();
        this.action();
    }

    private initProperties (): void {
        const $dom = this.$dom;
        this.$navigator = $dom.querySelector(`.${styles.navigator}`);
        this.$thumbnail = $dom.querySelector(`.${styles.thumbnail}`);
        this.$scope = $dom.querySelector(`.${styles.scope}`);
        this.$range = $dom.querySelector(`.${styles.range}`);
        this.$minBtn = $dom.querySelector(`.${styles.min}`);
        this.$maxBtn = $dom.querySelector(`.${styles.max}`);
        this.$text = $dom.querySelector(`.${styles.text}`);
    }

    watch (): void {
        this.model.watch(['scale', 'originX', 'originY', 'translateX', 'translateY'], (newValue: number, oldValue: number) => {
            this.updateView();
        });
    }

    updateView (): void {
        this.scope();
        const scale = this.model.data.scale.toFixed(1);
        this.$range.value = scale.toString();
        this.$text.value = scale.toString();
    }

    private containThumbnail (): void {
        const rect = this.$navigator.getBoundingClientRect();
        const nw = rect.width;
        const nh = rect.height;

        let data: IData = this.model.data;
        const tw = data.canvasOriginWidth;
        const th = data.canvasOriginHeight;

        let style = this.$thumbnail.style;
        if (nw / nh > tw / th) {
            style.height = nh + 'px';
            const tmp = nh / th * tw;
            style.width = tmp + 'px';
            style.left = (nw - tmp) / 2 + 'px';
            style.top = 0 + 'px';
        } else {
            style.width = nw + 'px';
            const tmp = nw / tw * th;
            style.height = tmp + 'px';
            style.top = (nh - tmp) / 2 + 'px';
            style.left = 0 + 'px';
        }
    }

    private scope (): void {
        /*
         * 导航器: 
         * 缩略图相当于画布，可视范围框相当于画布的容器
         * 当可视范围框超出缩略图时，限制在缩略图范围内
         */
        const {
            offsetWidth: containerWidth,
            offsetHeight: containerHeight
        } = this.$container;
        const {
            canvasWidth, canvasHeight, interactionOffsetX, interactionOffsetY
        } = this.model.data;

        const {
            offsetWidth: thumbnailWidth,
            offsetHeight: thumbnailHeight
        } = this.$thumbnail;

        let scopeWidth = containerWidth / canvasWidth * thumbnailWidth;
        let scopeHeight = containerHeight / canvasHeight * thumbnailHeight;
        let scopeOffsetX = -interactionOffsetX / canvasWidth * thumbnailWidth;
        let scopeOffsetY = -interactionOffsetY / canvasHeight * thumbnailHeight;
        
        // 以下对超出缩略图范围做限制
        if (scopeOffsetX + scopeWidth > thumbnailWidth) {
            scopeWidth = thumbnailWidth - scopeOffsetX;
        }

        if (scopeOffsetX < 0) {
            scopeWidth = scopeWidth + scopeOffsetX;
            scopeOffsetX = 0;
        }

        if (scopeOffsetY + scopeHeight >= thumbnailHeight) {
            scopeHeight = thumbnailHeight - scopeOffsetY;
        }

        if (scopeOffsetY < 0) {
            scopeHeight = scopeHeight + scopeOffsetY;
            scopeOffsetY = 0;
        }

        let style = this.$scope.style;
        style.width = `${scopeWidth}px`;
        style.height = `${scopeHeight}px`;
        style.left = `${scopeOffsetX}px`;
        style.top = `${scopeOffsetY}px`;
    }

    private setThumbnail (): void {

    }

    private action (): void {
        const self = this;
        new Action({
            $target: this.$scope,
            $wheelTarget: this.$navigator,
            onPan (deltaX: number, deltaY: number, device?: IActionDevice, ev?: MouseEvent) {
                /*
                    * 将当前鼠标位移按照比例换算到原画布上
                    */
                const { offsetWidth: thumbnailWidth, offsetHeight: thumbnailHeight } =  self.$thumbnail;
                let data = self.model.data;
                data.translateX -= deltaX * data.canvasWidth / thumbnailWidth;
                data.translateY -= deltaY * data.canvasHeight / thumbnailHeight;
            },
            cursor: {
                pointerOver: CURSOR_GRAB,
                pointerDown: CURSOR_GRABBING,
                pointerUp: CURSOR_GRAB
            }
        });

        this.$minBtn.addEventListener(POINT_CLICK, (ev: MouseEvent) => {
            this.model.data.scale = MIN_SCALE_VALUE.toString();
        });

        this.$maxBtn.addEventListener(POINT_CLICK, (ev: MouseEvent) => {
            this.model.data.scale = MAX_SCALE_VALUE.toString();
        });

        this.$range.addEventListener(TEXT_INPUT, () => {
            this.model.data.scale = Number(this.$range.value);
        });

        this.$text.addEventListener(TEXT_CHANGE, () => {
            this.model.data.scale = Number(this.$text.value);
        });
    }
}