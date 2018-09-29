'use strict'

export default interface IDesignerConfig {
    canvasOriginWidth: number,
    canvasOriginHeight: number,
    $navigator?: HTMLElement,
    movableWhenContained?: boolean
}