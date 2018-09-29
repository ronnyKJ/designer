class Util {
    constructor () {}

    range (val, min, max): number {
        return Math.min(Math.max(val, min), max);
    }

    setStyle (dom, style) {
        for (let prop in style) {
            dom.style[prop] = style[prop];
        }
    }
}


export default new Util();