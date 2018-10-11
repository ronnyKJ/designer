'use strict'

import Interaction from '../interaction/interaction.class';
import * as interactionStyles from '../interaction/interaction.less';
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

            scale: 1,
            translateX: 0,
            translateY: 0,
            originX: config.canvasOriginWidth / 2, // 永远都是相对于原始状态的画布宽高
            originY: config.canvasOriginHeight / 2, // 永远都是相对于原始状态的画布宽高

            canvasWidth: config.canvasOriginWidth, // readonly
            canvasHeight: config.canvasOriginHeight, // readonly

            interactionOffsetX: 0,
            interactionOffsetY: 0,

        };

        let model: Model = new Model({
            data: data,
            computed: {
                scale: {
                    set (newValue: number) {
                        return utils.range(newValue, MIN_SCALE_VALUE, MAX_SCALE_VALUE); // 约束
                    }
                },
                canvasWidth () {
                    const {canvasOriginWidth, scale} = this.data;
                    return canvasOriginWidth * scale;
                },
                canvasHeight () {
                    const {canvasOriginHeight, scale} = this.data;
                    return canvasOriginHeight * scale;
                },
                interactionOffsetX () {
                    return $interactionDom.offsetLeft;
                },
                interactionOffsetY () {
                    return $interactionDom.offsetTop;
                }
            }
        });
        
        const $interactionDom: HTMLElement = config.$container.querySelector(`.${interactionStyles.interaction}`);
        let interaction: Interaction = new Interaction(model, $interactionDom, config); // 单例
        let canvas: Canvas = new Canvas(model, config); // 允许多例

        if (config.$navigator) {
            let navigator: Navigator = new Navigator(model, config.$navigator, config);
        }
    }
}