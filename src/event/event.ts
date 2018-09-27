'use strict'

class Event {
    private events;
    public CANVAS_TRANSFORM = 'canvas_transform';
    public SCOPE_PAN = 'scope_pan';
    public SCOPE_SCALE = 'scope_scale'

    constructor () {
        this.events = {};
    }

    on (evt, callback) {
        let evts = this.events[evt] = this.events[evt] || [];
        callback && evts.push(callback);
    }

    trigger (evt, data) {
        const evts = this.events[evt];
        evts && evts.forEach((callback) => {
            callback && callback(data);
        });
    }    
}

export default new Event();