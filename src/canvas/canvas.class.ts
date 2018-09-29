'use strict'

import Interaction from '../interaction/interaction.class';
import * as styles from './canvas.less';
import utils from '../utils/utils';
import IDesignerConfig from '../interface/designerConfig.interface';
import ICanvasStyle from '../interface/canvasRectInfo.interface';
import Event from '../event/event';


export default class Canvas {
    private $container: HTMLElement;
    private $canvas: HTMLElement;
    private interaction: Interaction;
    private width: number;
    private height: number;

    constructor ($container: HTMLElement, interaction: Interaction, config: IDesignerConfig) {
        this.$container = $container;
        this.interaction = interaction;
        this.$canvas = $container.querySelector(`.${styles.canvas}`);

        const interRect = this.interaction.getInteractionRect();
        this.setStyle(interRect);

        this.width = config.canvasOriginWidth;
        this.height = config.canvasOriginHeight;

        Event.on(Event.CANVAS_TRANSFORM, (rectInfo: ICanvasStyle) => {
            this.setStyle(rectInfo);
        });        
    }

    private setStyle (style: ICanvasStyle): void {
        utils.setStyle(this.$canvas, {
            width: style.width + 'px',
            height: style.height + 'px',
            left: style.x + 'px',
            top: style.y + 'px'
        });        
    }
}