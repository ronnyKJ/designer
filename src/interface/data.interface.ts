import { interaction } from "../interaction/interaction.less";

'use strict'

export default interface IData {
    canvasOriginWidth: number,
    canvasOriginHeight: number,
    scaleValue: number,
    beforeScaleValue: number,
    interactionX: number,
    interactionY: number,
}