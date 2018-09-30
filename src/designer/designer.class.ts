'use strict'

import Interaction from '../interaction/interaction.class';
import Canvas from '../canvas/canvas.class';
import Navigator from '../navigator/navigator.class';
import IDesignerOptions from '../interface/designerConfig.interface';
import IData from '../interface/data.interface';

export default class Designer {
    constructor (config: IDesignerOptions) {

        let data: IData = {
            startX: 0,
            startY: 0,
            deltaX: 0,
            deltaY: 0,
            scaleValue: 1,
            beforeScaleValue: 1,
            dragging: false
        };   
        
        let interaction: Interaction = new Interaction(data, config); // 单例
        let canvas: Canvas = new Canvas(data, interaction, config); // 允许多例

        if (config.$navigator) {
            let navigator: Navigator = new Navigator(data, interaction, config);
        }

    }
}