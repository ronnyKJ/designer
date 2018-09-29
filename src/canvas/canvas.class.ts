'use strict'

import Interaction from '../interaction/interaction.class';
import * as styles from './canvas.less';
import utils from '../utils/utils';

export default class Renderer {
    private $container: Element;
    private $canvas: Element;
    private interaction: Interaction;
    private width;
    private height;

    constructor ($container, interaction, options) {
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

        options = options || {};
        this.width = options.canvasWidth;
        this.height = options.canvasHeight;
    }
}