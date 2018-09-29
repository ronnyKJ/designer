'use strict'

import Interaction from '../interaction/interaction.class';
import Canvas from '../canvas/canvas.class';
import Navigator from '../navigator/navigator.class';

export default class Designer {
    constructor ($container, options) {
        
        let interaction = new Interaction($container, options); // 单例
        let canvas = new Canvas($container, interaction, options); // 允许多例

        if (options.$navigator) {
            let navigator = new Navigator(options.$navigator, {
                $container: $container,
                $interaction: interaction.$interaction,
                initCanvasWidth: options.canvasWidth,
                initCanvasHeight: options.canvasHeight
            });
        }

    }
}