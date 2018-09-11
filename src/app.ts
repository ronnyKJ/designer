'use strict'
import Designer from './designer/designer.class';
import * as styles from './app.less';

document.querySelector('#app').innerHTML = `
<div class="${styles.container}">
    <div class="canvas">
        <div class="renderer">
            <div class="${styles.object} ${styles.base}"></div>
            <div id="object" class="${styles.object} ${styles.box}"></div>
        </div>

        <div class="${styles.interaction}">
            <div class="${styles.adjuster}">
                <div class="${styles.outline}" data-act="move"></div>
                <div class="${styles.knob} ${styles.nw}" data-act="resize" data-point="nw"></div>
                <div class="${styles.knob} ${styles.n}" data-act="resize" data-point="n"></div>
                <div class="${styles.knob} ${styles.ne}" data-act="resize" data-point="ne"></div>
                <div class="${styles.knob} ${styles.e}" data-act="resize" data-point="e"></div>
                <div class="${styles.knob} ${styles.se}" data-act="resize" data-point="se"></div>
                <div class="${styles.knob} ${styles.s}" data-act="resize" data-point="s"></div>
                <div class="${styles.knob} ${styles.sw}" data-act="resize" data-point="sw"></div>
                <div class="${styles.knob} ${styles.w}" data-act="resize" data-point="w"></div>
            </div>
        </div>
    </div>
</div>
`;

new Designer(document.querySelector(`.${styles.container}`));