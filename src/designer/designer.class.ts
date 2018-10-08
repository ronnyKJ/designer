'use strict'

import Interaction from '../interaction/interaction.class';
import Canvas from '../canvas/canvas.class';
import Navigator from '../navigator/navigator.class';
import IDesignerOptions from '../interface/designerConfig.interface';
import IData from '../interface/data.interface';
import Model from '../core/model.class';
import utils from '../core/utils';
import { MIN_SCALE_VALUE, MAX_SCALE_VALUE } from '../core/config';

export default class Designer {
    constructor (config: IDesignerOptions) {

        let data: IData = {
            canvasOriginWidth: config.canvasOriginWidth,
            canvasOriginHeight: config.canvasOriginHeight,

            scaleValue: 1,
            beforeScaleValue: 1,
            interactionX: 0,
            interactionY: 0,

        };

        let model: Model = new Model({
            data: data,
            computed: {
                scaleValue: {
                    set (newValue: number) {
                        return utils.range(newValue, MIN_SCALE_VALUE, MAX_SCALE_VALUE); // 约束
                    }
                }
            }
        });
        
        let interaction: Interaction = new Interaction(model, config); // 单例
        let canvas: Canvas = new Canvas(model, interaction, config); // 允许多例

        if (config.$navigator) {
            let navigator: Navigator = new Navigator(model, interaction, config);
        }
    }
}