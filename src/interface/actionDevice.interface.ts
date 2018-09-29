'use strict'

export default interface IDevice {
    altKey: boolean,
    metaKey: boolean,
    ctrlKey: boolean,
    spaceKey: boolean,
    isMouseLeftButtonDown: boolean,
    mouseButtonCode: number, // -1 没有点击， 0左键 1中键 2右键 需要确认下兼容性问题
    wheelDeltaX: number,
    wheelDeltaY: number,
    keyCode: number,
    clientX: number,
    clientY: number,
    pageX: number,
    pageY: number,
    deltaX: number,
    deltaY: number,    
}