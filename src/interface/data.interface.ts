'use strict'

export default interface IData {
    canvasOriginWidth: number,
    canvasOriginHeight: number,
    scale: number,
    translateX: number,
    translateY: number,
    originX: number,
    originY: number,
    canvasWidth: number, // readonly
    canvasHeight: number, // readonly
    interactionOffsetX: number,
    interactionOffsetY: number,
}