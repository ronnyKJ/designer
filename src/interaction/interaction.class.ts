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
    private scaleValue: number;
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
        this.scaleValue = this.config.INIT_SCALE;
        this.wheel = this.config.INIT_WHEEL_VALUE;

        this.init();

        // window.addEventListener('click', (ev:MouseEvent) => {
        //     ev.preventDefault();
        //     // let rect = this.interaction.getBoundingClientRect();
        //     // let px = ev.pageX - rect.left;
        //     // let py = ev.pageY - rect.top;

        //     const {x, y} = this.getPositionInContainer(ev);

        //     console.log(x, y);
        // }, false);
    }

    init () {

        this.container.addEventListener('wheel', (ev:MouseWheelEvent) => {
            // ev.clientY === ev.y
            // ev.layerY 相对于父容器
            // ev.pageY 相对于页面

            ev.preventDefault();
            const state = this.getOriginState(ev); // 先获取位置
            this.scaleValue = this.getScaleValue(ev.wheelDeltaY); // 后缩放
            const info = this.transform(state.offsetX, state.offsetY, state.originX, state.originY, this.scaleValue); // 变形
            this.setStyle(info);

        }, false);
    }

    getScaleValue (wheelDeltaY) {
        const config = this.config;

        let w = this.wheel;
        w -= wheelDeltaY;
        this.wheel = Math.min(Math.max(w, config.MIN_WHEEL_VALUE), config.MAX_WHEEL_VALUE);
        return this.wheel / config.WHEEL_SCALE_RATE;
    }

    getOriginState (ev:MouseEvent) {
        // 求出 鼠标在缩放之后的 interaction 中的位置
        // 映射到原始 container 中的位置
        const interRect = this.interaction.getBoundingClientRect();
        const tmpX = ev.pageX - interRect.left;
        const tmpY = ev.pageY - interRect.top;

        const originX = tmpX / this.scaleValue;
        const originY = tmpY / this.scaleValue;

        const containerRect = this.getContainerRect();
        const offsetX = ev.pageX - containerRect.left - originX;
        const offsetY = ev.pageY - containerRect.top - originY;

        return {originX, originY, offsetX, offsetY};
    }

    getContainerRect () {
        return this.container.getBoundingClientRect();
    }

    transform (offsetX:number = 0, offsetY:number = 0, originX:number, originY:number, scale:number) {
        const rect = this.getContainerRect();
        const width = rect.width;
        const height = rect.height;
        const newWidth = width * scale;
        const newHeight = height * scale;

        const dx = originX * (1 - scale) + offsetX;
        const dy = originY * (1 - scale) + offsetY;

        return {
            offsetX: dx,
            offsetY: dy,
            width: newWidth,
            height: newHeight
        };
    }

    setStyle (info) {
        let style = this.interaction.style;
        style.width = `${info.width}px`;
        style.height = `${info.height}px`;
        // 使用 translate 会变模糊
        style.left = `${info.offsetX}px`;
        style.top = `${info.offsetY}px`;
    }
}