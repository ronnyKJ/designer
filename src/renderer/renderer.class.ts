'use strict'

import Interaction from '../interaction/interaction.class';

export default class Renderer {
    interaction: Interaction;
    constructor (interaction) {
        this.interaction = interaction;
    }
}