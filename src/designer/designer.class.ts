'use strict'

import Interaction from '../interaction/interaction.class';
import Renderer from '../renderer/renderer.class';

export default class Designer {
    constructor (container) {
        let interaction = new Interaction(container); // 单例
        let renderer = new Renderer(interaction); // 多例
    }
}