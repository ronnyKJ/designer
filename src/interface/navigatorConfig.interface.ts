'use strict';

import Interaction from '../interaction/interaction.class';

export default interface INavigatorConfig {
    $container: HTMLElement,
    interaction: Interaction,
    canvasOriginWidth: number,
    canvasOriginHeight: number
}