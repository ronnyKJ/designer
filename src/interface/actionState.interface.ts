'use strict'

export default interface IState {
    startX: number,
    startY: number,
    deltaX: number,
    deltaY: number,
    scaleValue: number,
    beforeScaleValue: number,
    dragging: boolean
}