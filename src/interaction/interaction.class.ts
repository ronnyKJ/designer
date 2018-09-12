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

        window.addEventListener('click', (ev:MouseEvent) => {
            ev.preventDefault();
            // let rect = this.interaction.getBoundingClientRect();
            // let px = ev.pageX - rect.left;
            // let py = ev.pageY - rect.top;

            const {x, y} = this.getPositionInContainer(ev);

            console.log(x, y);
        }, false);
    }

    init () {

        this.container.addEventListener('wheel', (ev:MouseWheelEvent) => {
            // ev.clientY === ev.y
            // ev.layerY 相对于父容器
            // ev.pageY 相对于页面

            ev.preventDefault();
            const position = this.getPositionInContainer(ev); // 先获取位置
            this.scale = this.getScale(ev.wheelDeltaY); // 后缩放
            // this.scale = Math.floor(this.scale)
            
            console.log(position.x, position.y);
            this.scaleInteractionFromOrigin(position, this.scale);

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

    scaleInteractionFromOrigin (info, scale) {
        const rect = this.getContainerRect();
        const width = rect.width;
        const height = rect.height;
        const newWidth = width * scale;
        const newHeight = height * scale;

        const inter = this.interaction;
        inter.style.width = `${newWidth}px`;
        inter.style.height = `${newHeight}px`;

        const dx = info.x * (1 - scale) + info.offsetX;
        const dy = info.y * (1 - scale) + info.offsetY;

        // 使用 translate 会变模糊
        inter.style.left = `${dx}px`;
        inter.style.top = `${dy}px`;

    }

    getPositionInContainer (ev:MouseEvent) {
        // 求出 鼠标在缩放之后的 interaction 中的位置
        // 映射到原始 container 中的位置
        const interRect = this.interaction.getBoundingClientRect();
        const tmpX = ev.pageX - interRect.left;
        const tmpY = ev.pageY - interRect.top;

        const x = tmpX / this.scale;
        const y = tmpY / this.scale;

        const containerRect = this.container.getBoundingClientRect();
        const offsetX = ev.pageX - containerRect.left - x;
        const offsetY = ev.pageY - containerRect.top - y;

        return {x, y, offsetX, offsetY};
    }

    getContainerRect () {
        return this.container.getBoundingClientRect();
    }
}