'use strict'

import * as styles from './navigator.less';
import Event from '../event/event';

export default class Navigator {
    private $navigator;
    private $container;
    private $interaction;
    private $thumbnail;
    private $scope;
    
    constructor ($dom, config) {
        $dom.innerHTML = `
            <div class="${styles.navigator}">
                <div class="${styles.thumbnail}">
                    <div class="${styles.scope}"></div>                
                </div>   
            </div>
        `;

        this.$container = config.$container;
        this.$interaction = config.$interaction;
        this.$navigator = $dom.querySelector(`.${styles.navigator}`);
        this.$thumbnail = $dom.querySelector(`.${styles.thumbnail}`);
        this.$scope = $dom.querySelector(`.${styles.scope}`);

        this.containThumbnail();
        this.setThumnnail();

        this.setVisibleScope();
        Event.on(Event.CANVAS_TRANSFORM, () => {
            this.setVisibleScope();
        });

        this.panScope();
    }

    containThumbnail () {
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
            style.top = 0;
        } else {
            style.width = nw + 'px';
            const tmp = nw / tw * th;
            style.height = tmp + 'px';
            style.top = (nh - tmp) / 2 + 'px';
            style.left = 0;
        }
    }

    setVisibleScope () {
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

    setThumnnail () {

    }

    panScope () {
        const POINTER_DOWN = 'mousedown';
        const POINTER_MOVE = 'mousemove';
        const POINTER_UP = 'mouseup';
        const CURSOR_GRAB = '-webkit-grab';
        const CURSOR_GRABBING = '-webkit-grabbing';
        
        let isMouseDown = false;
        let startX = 0;
        let startY = 0;
        this.$scope.addEventListener(POINTER_DOWN, (ev) => {
            isMouseDown = true;
            startX = ev.pageX;
            startY = ev.pageY;
        }, false);

        window.addEventListener(POINTER_MOVE, (ev) => {
            if (isMouseDown) {
                const deltaX = ev.pageX - startX;
                const deltaY = ev.pageY - startY;

                const thumbnailWidth = this.$thumbnail.offsetWidth;
                const thumbnailHeight = this.$thumbnail.offsetHeight;

                let tmpX = -deltaX / thumbnailWidth * this.$interaction.offsetWidth;
                let tmpY = -deltaY / thumbnailHeight * this.$interaction.offsetHeight;

                if (thumbnailWidth === this.$scope.offsetWidth) {
                    tmpX = 0;
                }

                if (thumbnailHeight === this.$scope.offsetHeight) {
                    tmpY = 0;
                }

                Event.trigger(Event.SCOPE_PAN, {
                    deltaX: tmpX,
                    deltaY: tmpY
                });

                startX = ev.pageX;
                startY = ev.pageY;
            }
        }, false);

        window.addEventListener(POINTER_UP, (ev) => {
            isMouseDown = false;
        }, false);        
    }
}