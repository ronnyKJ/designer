'use strict'
import Designer from './designer/designer.class';
import * as appStyles from './app.less'; // 需要有真正引用，才会编译生成app.less.d.ts
import * as interactionStyles from './interaction/interaction.less';
import * as canvasStyles from './canvas/canvas.less';

document.querySelector('#app').innerHTML = `
<div class="${appStyles.container}">
    <!-- <div class="${canvasStyles.canvas}"></div> -->
    <div class="${interactionStyles.interaction}"></div>
</div>
<div class="${appStyles.navigator}"></div>
`;

new Designer({
    $container: document.querySelector(`.${appStyles.container}`),
    canvasOriginWidth: 400,
    canvasOriginHeight: 200,
    $navigator: document.querySelector(`.${appStyles.navigator}`)
});