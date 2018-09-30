'use strict'

class Watcher {
    public mapping: Map<any, any>;

    constructor () {
        this.mapping = new Map();
    }
    
    public register (obj: any, prop: string): void {
        let mapObj = this.mapping.get(obj);
        if (mapObj && Array.isArray(mapObj[prop])) {
            return;
        } else {

            if (!mapObj) {
                mapObj = {};
                this.mapping.set(obj, mapObj);
            }
            mapObj[prop] = [];
            let callbacks: Array<Function> = mapObj[prop];

            let value: any = obj[prop]; // 设定初始值
            Object.defineProperty(obj, prop, {
                get : function(){
                    return value;
                },
                set : function(newValue){
                    callbacks.forEach((callback) => {
                        callback && callback(newValue, value);
                    });

                    value = newValue;
                },
                enumerable : true,
                configurable : true
            });
        }
    }

    public watch (obj: any, prop: string, callback: Function): void {
        let callbacks = this.mapping.get(obj)[prop];
        if (Array.isArray(callbacks)) {
            callbacks.push(callback);
        } else {
            console.log(obj, prop,  'has not yet registered.');
            throw new Error('Variable not registered.');
        }
    }
}

export default new Watcher();