'use strict'

import * as styles from './navigator.less';
import Action from '../action/action.class';
import Event from '../event/event';
import INavigatorOptions from '../interface/navigatorConfig.interface';
import IActionDevice from '../interface/actionDevice.interface';
import IActionState from '../interface/actionState.interface';

export default class Navigator {
    private $navigator: HTMLElement;
    private $container: HTMLElement;
    private $interaction: HTMLElement;
    private $thumbnail: HTMLElement;
    private $scope: HTMLElement;
    private $slider: HTMLInputElement;
    
    constructor ($dom: HTMLElement, config: INavigatorOptions) {
        $dom.innerHTML = `
            <div class="${styles.navigator}">
                <div class="${styles.thumbnail}">
                    <div class="${styles.scope}"></div>                
                </div>
                <div class="${styles.slider}">
                    <input type="range" max="10" min="0.1" defaultValue="1" step="0.1" />
                </div>
            </div>
        `;

        this.$container = config.$container;
        this.$interaction = config.$interaction;
        this.$navigator = $dom.querySelector(`.${styles.navigator}`);
        this.$thumbnail = $dom.querySelector(`.${styles.thumbnail}`);
        this.$scope = $dom.querySelector(`.${styles.scope}`);
        this.$slider = $dom.querySelector(`.${styles.slider} input`);

        this.containThumbnail();
        this.setThumnnail();

        this.setVisibleScope();
        Event.on(Event.CANVAS_TRANSFORM, () => {
            this.setVisibleScope();
        });

        this.panScope();

        this.$slider.addEventListener('input', (ev: KeyboardEvent) => {
            Event.trigger(Event.SCOPE_SCALE, this.$slider.value);            
        }, false);
    }

    containThumbnail (): void {
        const rect = this.$navigator.getBoundingClientRect();
        const nw = rect.width;
        const nh = rect.height;
        const tw = this.$interaction.offsetWidth;
        const th = this.$interaction.offsetHeight;

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
        const $inter = this.$interaction;
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
            onPointerMove (device: IActionDevice, state: IActionState, ev: MouseEvent) {
                if (device.isMouseLeftButtonDown) {
                    const thumbnailWidth = self.$thumbnail.offsetWidth;
                    const thumbnailHeight = self.$thumbnail.offsetHeight;

                    let tmpX = -state.deltaX / thumbnailWidth * self.$interaction.offsetWidth;
                    let tmpY = -state.deltaY / thumbnailHeight * self.$interaction.offsetHeight;

                    if (thumbnailWidth === self.$scope.offsetWidth) {
                        tmpX = 0;
                    }

                    if (thumbnailHeight === self.$scope.offsetHeight) {
                        tmpY = 0;
                    }

                    Event.trigger(Event.SCOPE_PAN, {
                        deltaX: tmpX,
                        deltaY: tmpY
                    });
                }
            },
            cursor: {
                pointerOver: Action.CURSOR_GRAB,
                pointerDown: Action.CURSOR_GRABBING,
                pointerUp: Action.CURSOR_GRAB
            }
        });

    }
}