'use strict'

import Interaction from '../interaction/interaction.class';

export default class Renderer {
    private container: Element;
    private interaction: Interaction;
    private width;
    private height;

    constructor (container, interaction, options) {
        this.container = container;
        this.interaction = interaction;

        options = options || {};
        this.width = options.width || 100;
        this.height = options.height || 100;
    }
}