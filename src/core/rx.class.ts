'use strict'

import Model from './model.class';

abstract class RX {
    protected model: Model;
    protected $dom: HTMLElement;
    protected config: any;
    protected $container: HTMLElement;

    constructor (model: Model, $dom: HTMLElement, config?: any) {
        this.model = model;
        this.$dom = $dom;
        this.config = config;
        this.$container = config.$container;

        // 以下3个方法需按顺序执行
        this.create();
        this.updateView();
        this.watch();
    }

    abstract create (): void
    abstract updateView (): void
    abstract watch (): void
}

export default RX;