'use strict'

import Logger from '../logger/logger';
import * as styles from './interaction.less';

interface IConfig {
    MAX_WHEEL_VALUE : number;
    INIT_WHEEL_VALUE : number;
    MIN_WHEEL_VALUE : number;
    INIT_SCALE : number;
    WHEEL_SCALE_RATE: number;
    TOUCHPAD_PAN_RATE: number;
}

// 概念
// base 初始化时的状态
// source 每个状态对应的原始大小的状态，主要信息是 offset origin
// entity 当前实时的状态
// state 属性集合
// origin 缩放的原点

export default class Interaction {
    private config: IConfig;
    private mx: number;
    private my: number;
    private container: HTMLElement;
    private interaction: HTMLElement;
    private act: String;
    private scaleValue: number;
    private wheelValue: number;
    private isSpaceDown: boolean = false;
    private isMouseLeftButtonDown: Boolean = false;
    private movableWhenContained: Boolean = false;
    
    constructor (container) {

        this.config = {
            MAX_WHEEL_VALUE : 10000,
            INIT_WHEEL_VALUE : 1000,
            MIN_WHEEL_VALUE : 100,
            INIT_SCALE : 1,
            WHEEL_SCALE_RATE: 1000,
            TOUCHPAD_PAN_RATE: 4,
        };

        this.container = container;
        this.interaction = container.querySelector(`.${styles.interaction}`);
        this.act = null;

        this.mx = 0;
        this.my = 0;
        this.scaleValue = this.config.INIT_SCALE;
        this.wheelValue = this.config.INIT_WHEEL_VALUE;

        this.init();
        
        this.setCursorStyle();
    }

    init () {

        this.container.addEventListener('wheel', (ev:MouseWheelEvent) => {
            // ev.clientY === ev.y
            // ev.layerY 相对于父容器
            // ev.pageY 相对于页面
            // ev.offsetY 相对于target的位置
            
            ev.preventDefault();
            if (ev.altKey) { // 对齐 PS
                const state = this.getSourceState(ev); // 先获取位置
                this.scaleValue = this.getScaleValue(ev.wheelDeltaY); // 后缩放
                const style = this.transform(state.offsetX, state.offsetY, state.originX, state.originY, this.scaleValue); // 变形
                this.setStyle(style);
            } else {
                const rate = this.config.TOUCHPAD_PAN_RATE;
                this.pan(ev.wheelDeltaX / rate, ev.wheelDeltaY / rate);
            }
        }, false);

    }

    pan (offsetX:number, offsetY:number) {
        const position = this.getEntityPosition();
        const state = {
            offsetX: position.left + offsetX,
            offsetY: position.top + offsetY
        };
        this.setStyle(state);  
    }

    getScaleValue (wheelDeltaY) {
        const config = this.config;

        let w = this.wheelValue;
        w -= wheelDeltaY;
        this.wheelValue = Math.min(Math.max(w, config.MIN_WHEEL_VALUE), config.MAX_WHEEL_VALUE);
        return this.wheelValue / config.WHEEL_SCALE_RATE;
    }

    getSourceState (ev:MouseEvent) {
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

    getEntityPosition () {
        const left = parseInt(this.interaction.style.left) || 0;
        const top = parseInt(this.interaction.style.top) || 0;
        return {top, left};
    }

    getContainerRect () {
        return this.container.getBoundingClientRect();
    }

    // 相对于 base
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
        // offset 是相对于 base
        let style = this.interaction.style;
        info.width && (style.width = `${info.width}px`);
        info.height && (style.height = `${info.height}px`);
        // 使用 translate 会变模糊
        info.offsetX && (style.left = `${info.offsetX}px`);
        info.offsetY && (style.top = `${info.offsetY}px`);
    }

    setCursorStyle () {
        // space mouse
        this.isSpaceDown = false;
        this.isMouseLeftButtonDown = false;

        let startX = 0;
        let startY = 0;

        this.container.addEventListener('mousedown', (ev)=>{
            this.isMouseLeftButtonDown = ev.button === 0; // ev.button 的值要考虑兼容性问题

            if (this.isMouseLeftButtonDown && this.isSpaceDown) {
                this.container.style.cursor = '-webkit-grabbing';
            }

            startX = ev.clientX;
            startY = ev.clientY;

        }, false);

        window.addEventListener('mouseup', (ev)=>{
            this.isMouseLeftButtonDown = false;
            if (this.isSpaceDown) {
                this.container.style.cursor = '-webkit-grab';            
            } else {
                this.container.style.cursor = 'default';
            }
        }, false);        

        window.addEventListener('mousemove', (ev:MouseEvent) => {
            ev.preventDefault();
            if (this.isMouseLeftButtonDown && this.isSpaceDown) {
                this.pan(ev.clientX - startX, ev.clientY - startY);
                startX = ev.clientX;
                startY = ev.clientY;
            }
        }, false);

        window.addEventListener('keydown', (ev)=>{
            this.isSpaceDown = ev.keyCode === 32;
            if(this.isSpaceDown && !this.isMouseLeftButtonDown){
                this.container.style.cursor = '-webkit-grab';
            }
        }, false);

        window.addEventListener('keyup', (ev)=>{
            this.isSpaceDown = false;
            this.container.style.cursor = 'default';
        }, false);
    }    
}