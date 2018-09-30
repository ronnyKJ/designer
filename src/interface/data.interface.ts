'use strict'

export default interface IData {
    startX: number,
    startY: number,
    deltaX: number,
    deltaY: number,
    scaleValue: number,
    beforeScaleValue: number,
    dragging: boolean
}