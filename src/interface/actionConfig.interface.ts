'use strict'

export default interface IActionConfig {
    $target: HTMLElement,
    $wheelTarget: HTMLElement,
    initScaleValue?: number,
    onPointerDown: Function,
    onPointerMove: Function,
    onPointerUp: Function,
    onKeyDown: Function,
    onKeyUp: Function
}