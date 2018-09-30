'use strict'

export default interface IDesignerConfig {
    $container: HTMLElement,
    $navigator?: HTMLElement,
    canvasOriginWidth: number,
    canvasOriginHeight: number,
    movableWhenContained?: boolean
}