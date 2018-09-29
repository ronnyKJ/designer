class Util {
    constructor () {}

    range (val: number, min: number, max: number): number {
        return Math.min(Math.max(val, min), max);
    }

    setStyle ($dom: HTMLElement, style: any): void {
        for (let prop in style) {
            $dom.style[prop] = style[prop];
        }
    }
}


export default new Util();