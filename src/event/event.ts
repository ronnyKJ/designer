'use strict'

class Event {
    private events: any;
    public CANVAS_TRANSFORM: string = 'canvas_transform';
    public SCOPE_PAN: string = 'scope_pan';
    public SCOPE_SCALE: string = 'scope_scale'

    constructor () {
        this.events = {};
    }

    on (evt: string, callback: Function): void {
        let evts = this.events[evt] = this.events[evt] || [];
        evts.push(callback);
    }

    trigger (evt: string, data: any): void {
        const callbacks = this.events[evt];
        callbacks && callbacks.forEach((callback: Function) => {
            callback && callback(data);
        });
    }    
}

export default new Event();