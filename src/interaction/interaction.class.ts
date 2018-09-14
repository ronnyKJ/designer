'use strict'

import Logger from '../logger/logger';
import * as styles from './interaction.less';
import utils from '../utils/utils';

interface IConfig {
    MAX_WHEEL_VALUE : number;
    INIT_WHEEL_VALUE : number;
    MIN_WHEEL_VALUE : number;
    INIT_SCALE : number;
    WHEEL_SCALE_RATE: number;
    TOUCHPAD_PAN_RATE: number;
    KEEP_INSIDE: number;
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
    private isMouseLeftButtonDown: boolean = false;
    private movableWhenContained: boolean = true;
    private visibleSideWidth: number = 0;
    private visibleSideHeight: number = 0;
    
    constructor (container) {

        this.config = {
            MAX_WHEEL_VALUE : 10000,
            INIT_WHEEL_VALUE : 1000,
            MIN_WHEEL_VALUE : 100,
            INIT_SCALE : 1,
            WHEEL_SCALE_RATE: 1000,
            TOUCHPAD_PAN_RATE: 4,
            KEEP_INSIDE: 0.2
        };

        this.container = container;
        const rect = this.getContainerRect();
        this.visibleSideWidth = rect.width * this.config.KEEP_INSIDE;
        this.visibleSideHeight = rect.height * this.config.KEEP_INSIDE;

        this.interaction = container.querySelector(`.${styles.interaction}`);
        this.act = null;

        this.mx = 0;
        this.my = 0;
        this.scaleValue = this.config.INIT_SCALE;
        this.wheelValue = this.config.INIT_WHEEL_VALUE;

        this.init();
        
        this.setCursorStyleAndMouseMove();
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
                const style = this.getTransformStyle(state.offsetX, state.offsetY, state.originX, state.originY, this.scaleValue); // 变形
                this.setStyle(style);
            } else if (this.isMovable()) {
                const rate = this.config.TOUCHPAD_PAN_RATE;
                this.getPanStyle(ev.wheelDeltaX / rate, ev.wheelDeltaY / rate);
            }
        }, false);

    }

    getPanStyle (offsetX:number, offsetY:number) {
        const info = this.getEntityInfo();

        let x = info.left + offsetX; 
        let y = info.top + offsetY;

        const tmp = this.keepVisible(x, y, info.width, info.height);
        x = tmp.x;
        y = tmp.y;

        this.setStyle({x, y});
    }

    getScaleValue (wheelDeltaY) {
        const config = this.config;

        let w = this.wheelValue;
        w -= wheelDeltaY;
        this.wheelValue = utils.range(w, config.MIN_WHEEL_VALUE, config.MAX_WHEEL_VALUE);
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

    getEntityInfo () {
        const i = this.interaction;
        const left = parseInt(i.style.left) || 0;
        const top = parseInt(i.style.top) || 0;
        const width = i.clientWidth;
        const height = i.clientHeight;
        return {top, left, width, height};
    }

    getContainerRect () {
        return this.container.getBoundingClientRect();
    }

    // 相对于 base
    getTransformStyle (offsetX:number = 0, offsetY:number = 0, originX:number, originY:number, scale:number) {
        const rect = this.getContainerRect();
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        const entityWidth = containerWidth * scale;
        const entityHeight = containerHeight * scale;

        let x;
        let y;

        if (this.isMovable()) {
            x = originX * (1 - scale) + offsetX;
            y = originY * (1 - scale) + offsetY;

            const tmp = this.keepVisible(x, y, entityWidth, entityHeight);
            x = tmp.x;
            y = tmp.y;
        } else {
            x = (containerWidth - entityWidth) / 2;
            y = (containerHeight - entityHeight) / 2;
        }

        return {
            x: x,
            y: y,
            width: entityWidth,
            height: entityHeight
        };
    }

    setStyle (info) {
        // offset 是相对于 base
        let style = this.interaction.style;
        info.hasOwnProperty('width') && (style.width = `${info.width}px`);
        info.hasOwnProperty('height') && (style.height = `${info.height}px`);
        // 使用 translate 会变模糊
        info.hasOwnProperty('x') && (style.left = `${info.x}px`);
        info.hasOwnProperty('y') && (style.top = `${info.y}px`);
    }

    keepVisible (x, y, entityWidth, entityHeight) {
        const cRect = this.getContainerRect();

        const tmp1 = this.visibleSideWidth - entityWidth;
        (x < tmp1) && (x = tmp1);
        
        const tmp2 = cRect.width - this.visibleSideWidth;
        (x > tmp2) && (x = tmp2);

        const tmp3 = this.visibleSideHeight - entityHeight;
        (y < tmp3) && (y = tmp3);
        
        const tmp4 = cRect.height - this.visibleSideHeight;
        (y > tmp4) && (y = tmp4);

        return {x, y};
    }

    setCursorStyleAndMouseMove () {

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
            if (this.isMouseLeftButtonDown && this.isSpaceDown && this.isMovable()) {
                this.getPanStyle(ev.clientX - startX, ev.clientY - startY);
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

    isMovable ():boolean {
        // interaction 小于容器，且配置 movableWhenContained 为 false，不能移动；其余状况能移动
        return !(this.movableWhenContained === false && this.scaleValue <= 1);
    }
}