'use strict'

import Interaction from '../interaction/interaction.class';
import * as styles from './canvas.less';
import utils from '../utils/utils';
import IDesignerConfig from '../interface/designerConfig.interface';

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
        utils.setStyle(this.$canvas, {
            width: interRect.width + 'px',
            height: interRect.height + 'px',
            left: interRect.x + 'px',
            top: interRect.y + 'px'
        });

        this.width = config.canvasOriginWidth;
        this.height = config.canvasOriginHeight;
    }
}