'use strict'

import utils from './utils';

interface IModelConfig {
    data: any,
    computed?: any
}

class Model {
    public data: any;
    private computed: any;
    private queues: any;

    constructor (config: IModelConfig) {
        this.data = config.data;
        this.queues = {};

        config.computed && (this.computed = config.computed);

        this.observe();
    }

    private observe (): void {
        let self = this;
        let data = this.data;
        for (let prop in data) {
            if (data.hasOwnProperty(prop)) {
                let value: any = data[prop]; // 设定初始值
                let computed = this.computed;
                Object.defineProperty(data, prop, {
                    get () {
                        if (computed && prop in computed) {
                            let computedProp = computed[prop];
                            let getter = typeof computedProp === 'function' ? computedProp : computedProp.get;
                            return getter ? getter.bind(self)(value) : value;
                        } else {
                            return value;
                        }
                    },
                    set (newValue){
                        if (computed && prop in computed) {
                            let setter = computed[prop].set;
                            if (typeof setter === 'function') {
                                value = setter.bind(self)(newValue);
                            } else  {
                                value = newValue;
                            }
                        } else {
                            value = newValue;
                        }

                        let propQueue = self.queues[prop];
                        if (Array.isArray(propQueue)) {
                            propQueue.forEach((callback) => {
                                callback.bind(self)(newValue, value);
                            });
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        }
    }

    public get (prop: string) {
        return this.data[prop];
    }

    public set (prop: string, value: any) {
        this.data[prop] = value;
    }

    public watch (props: Array<string>, callback: Function): void {
        let dCallback = utils.debounce(callback);

        props.forEach((prop) => {
            this.queues[prop] = this.queues[prop] || [];
            this.queues[prop].push(dCallback);
        });
    }
}

export default Model;