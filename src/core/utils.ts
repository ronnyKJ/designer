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
        // const setTimerFunc = setTimeout;
        // const cancelTimerFunc = clearTimeout;
        const setTimerFunc = requestAnimationFrame;
        const cancelTimerFunc = cancelAnimationFrame;
        return function () {
            if (timer) {
                cancelTimerFunc(timer);
            }
            const args = Array.prototype.slice.call(arguments, 0);
            timer = setTimerFunc(() => {
                func && func.apply(this, args);
            });
        }
    }
}

export default new Util();