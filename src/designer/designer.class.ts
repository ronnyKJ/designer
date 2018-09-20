'use strict'

import Interaction from '../interaction/interaction.class';
import Renderer from '../renderer/renderer.class';

export default class Designer {
    constructor (container, options) {
        let interaction = new Interaction(container, options); // 单例
        let renderer = new Renderer(container, interaction, options); // 多例
    }
}