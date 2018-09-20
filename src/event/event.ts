'use strict'

export default {
    
    CANVAS_TRANSFORM: 'canvas_transform',

    _events: {},

    on (evt, callback) {
        let evts = this._events[evt] = this._events[evt] || [];
        callback && evts.push(callback);
    },

    trigger (evt, data) {
        const evts = this._events[evt];
        evts.forEach((callback) => {
            callback && callback(data);
        });
    }
}