'use strict'

import Interaction from '../interaction/interaction.class';
import Renderer from '../renderer/renderer.class';
import Navigator from '../navigator/navigator.class';
import Action from '../action/action.class';

export default class Designer {
    constructor ($container, options) {
        
        // 在容器上阻止网页默认操作，后退、缩放
        $container.addEventListener(Action.WHEEL, (ev) => {
            ev.preventDefault();
        }, false);

        let interaction = new Interaction($container, options); // 单例
        let renderer = new Renderer($container, interaction, options); // 多例
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