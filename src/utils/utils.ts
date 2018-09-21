class Util {
    constructor () {}

    range (val, min, max): number {
        return Math.min(Math.max(val, min), max);
    }
}


export default new Util();