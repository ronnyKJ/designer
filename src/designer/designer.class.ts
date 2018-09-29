'use strict'

import Interaction from '../interaction/interaction.class';
import Canvas from '../canvas/canvas.class';
import Navigator from '../navigator/navigator.class';
import IDesignerOptions from '../interface/designerConfig.interface';

export default class Designer {
    constructor ($container:HTMLElement, config: IDesignerOptions) {
        
        let interaction: Interaction = new Interaction($container, config); // 单例
        let canvas: Canvas = new Canvas($container, interaction, config); // 允许多例

        if (config.$navigator) {
            let navigator: Navigator = new Navigator(config.$navigator, {
                $container: $container,
                interaction: interaction,
                canvasOriginWidth: config.canvasOriginWidth,
                canvasOriginHeight: config.canvasOriginHeight
            });
        }

    }
}