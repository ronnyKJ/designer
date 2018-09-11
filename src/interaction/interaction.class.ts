'use strict'

import Logger from '../logger/logger';
import * as styles from './interaction.less';

interface IConfig {
    MAX_WHEEL_VALUE : number;
    INIT_WHEEL_VALUE : number;
    MIN_WHEEL_VALUE : number;
    MAX_SCALE : number;
    INIT_SCALE : number;
    MIN_SCALE : number;
    WHEEL_SCALE_RATE: number;    
}

export default class Interaction {
    private config: IConfig;
    private mx: number;
    private my: number;
    private container: HTMLElement;
    private interaction: HTMLElement;
    private act: String;
    private isMouseDown: Boolean;
    private scale: number;
    private wheel: number;
    
    constructor (container) {

        this.config = {
            MAX_WHEEL_VALUE : 10000,
            INIT_WHEEL_VALUE : 1000,
            MIN_WHEEL_VALUE : 100,
            MAX_SCALE : 10,
            INIT_SCALE : 1,
            MIN_SCALE : 0.1,
            WHEEL_SCALE_RATE: 1000
        };

        this.container = container;
        this.interaction = container.querySelector(`.${styles.interaction}`);
        this.act = null;

        this.mx = 0;
        this.my = 0;
        this.isMouseDown = false;
        this.scale = this.config.INIT_SCALE;
        this.wheel = this.config.INIT_WHEEL_VALUE;

        this.init();
    }

    init () {

        this.container.addEventListener('wheel', (ev:MouseWheelEvent) => {
            // ev.clientY === ev.y
            // ev.layerY 相对于父容器
            // ev.pageY 相对于页面

            ev.preventDefault();
            this.scale = this.getScale(ev.wheelDeltaY);
            const rect = this.getPositionInContainer(ev);

            this.scaleInteraction(rect.x, rect.y, this.scale);


            Logger.log(this.scale);
        }, false);
    }

    getScale (wheelDeltaY) {
        const config = this.config;

        let w = this.wheel;
        w -= wheelDeltaY;
        this.wheel = Math.min(Math.max(w, config.MIN_WHEEL_VALUE), config.MAX_WHEEL_VALUE);
        return this.wheel / config.WHEEL_SCALE_RATE;
    }

    scaleInteraction (x, y, scale) {
        const conInfo = this.getContainerInfo();
        const width = conInfo.width;
        const height = conInfo.height;
        const newWidth = width * scale;
        const newHeight = height * scale;

        const inter = this.interaction;
        inter.style.width = `${newWidth}px`;
        inter.style.height = `${newHeight}px`;

        const dx = -(newWidth / width - 1) * x;
        const dy = -(newHeight / height - 1) * y;
        // 使用 translate 会变模糊
        inter.style.left = `${dx}px`;
        inter.style.top = `${dy}px`;

    }

    getInteractionInfo () {
        // const rect = this.container.getBoundingClientRect();
        // const x = ev.pageX - rect.left;
        // const y = ev.pageY - rect.top;

        // const scale = this.scale;

        // return {offsetX, offsetY, scale};
    }

    getPositionInContainer (ev:MouseEvent) {
        const rect = this.container.getBoundingClientRect();
        const x = ev.pageX - rect.left;
        const y = ev.pageY - rect.top;

        return {x, y}
    }

    getContainerInfo () {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        return {width, height};
    }
}