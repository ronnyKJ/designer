export default {
    log: function (msg): void {
        let div = document.querySelector('#logger');
        if(!div){
            div = document.createElement('div');
            div.id = 'logger';
            document.querySelector('#app').appendChild(div);
        }
        div.innerHTML = msg;
    }
}