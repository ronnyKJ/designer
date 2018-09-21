'use strict'
import Designer from './designer/designer.class';
import * as appStyles from './app.less'; // 需要有真正引用，才会编译生成app.less.d.ts
import * as interactionStyles from './interaction/interaction.less';
import * as rendererStyles from './renderer/renderer.less';

document.querySelector('#app').innerHTML = `
<div class="${appStyles.container}">
    <!-- <div class="${rendererStyles.renderer}">
        <div class="${rendererStyles.object} ${rendererStyles.base}"></div>
        <div id="object" class="${rendererStyles.object} ${rendererStyles.box}"></div>
    </div> -->

    <div class="${interactionStyles.interaction}">
        <!-- <div class="${interactionStyles.adjuster}">
            <div class="${interactionStyles.outline}" data-act="move"></div>
            <div class="${interactionStyles.knob} ${interactionStyles.nw}" data-act="resize" data-point="nw"></div>
            <div class="${interactionStyles.knob} ${interactionStyles.n}" data-act="resize" data-point="n"></div>
            <div class="${interactionStyles.knob} ${interactionStyles.ne}" data-act="resize" data-point="ne"></div>
            <div class="${interactionStyles.knob} ${interactionStyles.e}" data-act="resize" data-point="e"></div>
            <div class="${interactionStyles.knob} ${interactionStyles.se}" data-act="resize" data-point="se"></div>
            <div class="${interactionStyles.knob} ${interactionStyles.s}" data-act="resize" data-point="s"></div>
            <div class="${interactionStyles.knob} ${interactionStyles.sw}" data-act="resize" data-point="sw"></div>
            <div class="${interactionStyles.knob} ${interactionStyles.w}" data-act="resize" data-point="w"></div>
        </div> -->
    </div>
</div>
<div class="${appStyles.navigator}"></div>
`;

new Designer(document.querySelector(`.${appStyles.container}`), {
    canvasWidth: 200,
    canvasHeight: 100,
    $navigator: document.querySelector(`.${appStyles.navigator}`)
});