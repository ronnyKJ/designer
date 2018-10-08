class Util {
    constructor () {}

    range (val: number, min: number, max: number): number {
        return Math.min(Math.max(val, min), max);
    }

    setStyle ($dom: HTMLElement, style: Partial<CSSStyleDeclaration>): void {
        for (let prop in style) {
            $dom.style[prop] = style[prop];
        }
    }

    debounce (func: Function) {
        let timer: number;
        return function () {
            if (timer) {
                clearTimeout(timer);
            }
            const args = Array.prototype.slice.call(arguments, 0);
            timer = setTimeout(() => {
                func && func.apply(this, args);
            }, 0);
        }
    }
}

export default new Util();