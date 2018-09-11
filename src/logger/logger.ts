import * as styles from './logger.less';

export default {
    log: function (msg): void {
        let div = document.querySelector(`.${styles.logger}`);
        if(!div){
            div = document.createElement('div');
            div.className = styles.logger;
            document.querySelector('#app').appendChild(div);
        }
        div.innerHTML = msg;
    }
}