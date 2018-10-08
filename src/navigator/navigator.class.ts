'use strict'

import * as styles from './navigator.less';
import Action from '../action/action.class';
import Event from '../core/event';
import Model from '../core/model.class';
import Interaction from '../interaction/interaction.class';
import IDesignerConfig from '../interface/designerConfig.interface';
import IActionDevice from '../interface/actionDevice.interface';
import { MAX_SCALE_VALUE, MIN_SCALE_VALUE, INPUT, POINT_CLICK, CURSOR_GRAB, CURSOR_GRABBING } from '../core/config';


export default class Navigator {
    private $navigator: HTMLElement;
    private $container: HTMLElement;
    private $thumbnail: HTMLElement;
    private $scope: HTMLElement;
    private $range: HTMLInputElement;
    private $minBtn: HTMLInputElement;
    private $maxBtn: HTMLInputElement;
    private interaction: Interaction;
    private model: Model;
    
    constructor (model: Model, interaction: Interaction, config: IDesignerConfig) {
        this.model = model;

        let $dom = config.$navigator;
        $dom.innerHTML = `
            <div class="${styles.navigator}">
                <div class="${styles.thumbnail}">
                    <div class="${styles.scope}"></div>                
                </div>
                <div class="${styles.slider}">
                    <input type="button" class="${styles.min}" value="min" />
                    <input type="range" class="${styles.range}" max="10" min="0.1" defaultValue="1" step="0.1" />
                    <input type="button" class="${styles.max}" value="max" />
                </div>
            </div>
        `;

        this.$container = config.$container;
        this.$navigator = $dom.querySelector(`.${styles.navigator}`);
        this.$thumbnail = $dom.querySelector(`.${styles.thumbnail}`);
        this.$scope = $dom.querySelector(`.${styles.scope}`);
        this.$range = $dom.querySelector(`.${styles.range}`);
        this.$minBtn = $dom.querySelector(`.${styles.min}`);
        this.$maxBtn = $dom.querySelector(`.${styles.max}`);
        this.interaction = interaction;
        this.$range.value = this.model.data.scaleValue.toString();

        this.containThumbnail();
        this.setThumnnail();

        this.setVisibleScope();

        this.panScope();
        this.bindEvent();

        this.render();
    }

    bindEvent (): void {

        Event.on(Event.CANVAS_TRANSFORM, () => {
            this.setVisibleScope();
        });

        this.$range.addEventListener(INPUT, (ev: KeyboardEvent) => {
            Event.trigger(Event.CANVAS_SCALE, Number(this.$range.value));
        }, false);

        this.$minBtn.addEventListener(POINT_CLICK, (ev: MouseEvent) => {
            Event.trigger(Event.CANVAS_SCALE, MIN_SCALE_VALUE);            
        }, false);
        
        this.$maxBtn.addEventListener(POINT_CLICK, (ev: MouseEvent) => {
            Event.trigger(Event.CANVAS_SCALE, MAX_SCALE_VALUE);
        }, false);
    }

    containThumbnail (): void {
        const rect = this.$navigator.getBoundingClientRect();
        const nw = rect.width;
        const nh = rect.height;
        const $in = this.interaction.$interaction;
        const tw = $in.offsetWidth;
        const th = $in.offsetHeight;

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

    setVisibleScope (): void {
        /*
         * 导航器: 
         * 缩略图相当于画布，可视范围框相当于画布的容器
         * 当可视范围框超出缩略图时，限制在缩略图范围内
         */
        const $con = this.$container;
        const $inter = this.interaction.$interaction;
        const $thumbnail = this.$thumbnail;

        const containerWidth = $con.offsetWidth;
        const containerHeight = $con.offsetHeight;
        const interactionWidth = $inter.offsetWidth;
        const interactionHeight = $inter.offsetHeight;
        const interactionOffsetX = $inter.offsetLeft;
        const interactionOffsetY = $inter.offsetTop;
        const thumbnailWidth = $thumbnail.offsetWidth;
        const thumbnailHeight = $thumbnail.offsetHeight;

        let scopeWidth = containerWidth / interactionWidth * thumbnailWidth;
        let scopeHeight = containerHeight / interactionHeight * thumbnailHeight;
        let scopeOffsetX = -interactionOffsetX / interactionWidth * thumbnailWidth;
        let scopeOffsetY = -interactionOffsetY / interactionHeight * thumbnailHeight;
        
        // 以下对超出缩略图范围做限制
        if (scopeOffsetX + scopeWidth > thumbnailWidth) {
            scopeWidth = thumbnailWidth - scopeOffsetX;
        }

        if (scopeOffsetX < 0) {
            scopeWidth = scopeWidth + scopeOffsetX;
            scopeOffsetX = 0;
        }

        if (scopeOffsetY + scopeHeight > thumbnailHeight) {
            scopeHeight = thumbnailHeight - scopeOffsetY;
        }

        if (scopeOffsetY < 0) {
            scopeHeight = scopeHeight + scopeOffsetY;
            scopeOffsetY = 0;
        }        

        let style = this.$scope.style;
        style.width = scopeWidth + 'px';
        style.height = scopeHeight + 'px';
        style.left = scopeOffsetX + 'px';
        style.top = scopeOffsetY + 'px';
    }

    setThumnnail (): void {

    }

    panScope (): void {
        const self = this;
        new Action({
            $target: this.$scope,
            onPan (deltaX: number, deltaY: number, device?: IActionDevice, ev?: MouseEvent) {
                if (device.isMouseLeftButtonDown) {
                    const thumbnailWidth = self.$thumbnail.offsetWidth;
                    const thumbnailHeight = self.$thumbnail.offsetHeight;

                    const $in = self.interaction.$interaction;
                    let tmpX = -deltaX / thumbnailWidth * $in.offsetWidth;
                    let tmpY = -deltaY / thumbnailHeight * $in.offsetHeight;

                    if (thumbnailWidth === self.$scope.offsetWidth) {
                        tmpX = 0;
                    }

                    if (thumbnailHeight === self.$scope.offsetHeight) {
                        tmpY = 0;
                    }

                    Event.trigger(Event.CANVAS_PAN, {
                        deltaX: tmpX,
                        deltaY: tmpY
                    });
                }
            },
            cursor: {
                pointerOver: CURSOR_GRAB,
                pointerDown: CURSOR_GRABBING,
                pointerUp: CURSOR_GRAB
            }
        });

    }

    private render () {
        this.model.watch(['scaleValue'], (newValue: number, oldValue: number) => {
            console.log(newValue, oldValue);
        });        
    }    
}