const POINTER_DOWN = 'mousedown';
const POINTER_MOVE = 'mousemove';
const POINTER_UP = 'mouseup';
const POINT_CLICK = 'click';
const WHEEL = 'wheel';
const KEY_DOWN = 'keydown';
const KEY_UP = 'keyup';
const KEY_PRESS = 'keypress';
const CURSOR_DEFAULT = 'default';
const CURSOR_GRAB = '-webkit-grab';
const CURSOR_GRABBING = '-webkit-grabbing';

export default class Action {
    private $target;
    private state;
    private device;
    
    constructor (config) {

        let device = this.device = {
            altKey: false,
            metaKey: false,
            ctrlKey: false,
            spaceKey: false,
            isMouseLeftButtonDown: false,
            mouseButtonCode: -1, // -1 没有点击， 0左键 1中键 2右键 需要确认下兼容性问题
            wheelDeltaX: 0,
            wheelDeltaY: 0,
            keyCode: -1,
            clientX: 0,
            clientY: 0,
            pageX: 0,
            pageY: 0,
        };

        let state = this.state = {
            startX: 0,
            startY: 0,
            wheelValue: config.initWheelValue || 0,
            scaleValue: config.initScaleValue || 1
        };

        let self = this;
        function wrap (callback) {
            return function (ev) {
                if ([POINTER_DOWN, POINTER_MOVE, POINTER_UP, POINT_CLICK].indexOf(ev.type) >= 0) {
                    ev.preventDefault();
                    self.setMouseAttributes(device, ev);
                } else if ([WHEEL].indexOf(ev.type) >= 0) {
                    ev.preventDefault();
                    self.setMouseAttributes(device, ev);
                    self.setKeyboardAttributes(device, ev);
                } else if ([KEY_DOWN, KEY_UP, KEY_PRESS].indexOf(ev.type) >= 0) {
                    self.setKeyboardAttributes(device, ev);
                }
                device.altKey = ev.altKey;
                callback && callback(device, state, ev);
            }
        }

        this.$target.addEventListener(WHEEL, wrap((device, state, ev) => {
            this.onWheel(device, state, ev);
        }), false);

        this.$target.addEventListener(POINTER_DOWN, wrap((device, state, ev) => {
            this.onMouseDown(device, state, ev);
        }), false);

        window.addEventListener(POINTER_MOVE, wrap((device, state, ev) => {
            this.onMouseMove(device, state, ev);
        }), false);

        window.addEventListener(POINTER_UP, wrap((device, state, ev) => {
            this.onMouseUp(device, state, ev);
        }), false);        

        window.addEventListener(KEY_DOWN, wrap((device, state, ev) => {            
            this.onKeyDown(device, state, ev);
        }), false);

        window.addEventListener(KEY_UP, wrap((device, state, ev) => {
            this.onKeyUp(device, state, ev);
        }), false);        
    }

    onMouseDown(device, state, ev) {
        // ev.pageY === ev.y
        // ev.layerY 相对于父容器
        // ev.pageY 相对于页面
        // ev.offsetY 相对于target的位置

        if (device.isMouseLeftButtonDown && device.spaceKey) {
            this.$target.style.cursor = CURSOR_GRABBING;
        }

        state.startX = device.pageX;
        state.startY = device.pageY;
    }

    onMouseMove(device, state, ev) {
        if (device.isMouseLeftButtonDown && device.spaceKey) {
            state.startX = device.pageX;
            state.startY = device.pageY;
        }
    }

    onMouseUp(device, state, ev) {
        device.isMouseLeftButtonDown = false;
        if (device.spaceKey) {
            this.$target.style.cursor = CURSOR_GRAB;
        } else {
            this.$target.style.cursor = CURSOR_DEFAULT;
        }
    }

    onWheel(device, state, ev) {
        // mac trackpad 双指平移: ev.deltaY * -3 === ev.wheelDeltaY
        // mac trackpad 双指缩放 与 鼠标滚轮 相同: ev.deltaY 为浮点数, ev.wheelDeltaY 为 120 倍数
        if (device.ctrlKey) { // 缩放 ctrl+滚动
            this.onScale();
        } else { // 平移
            this.onPan();
        }
    }

    onKeyDown(device, state, ev) {
        if (device.spaceKey && !device.isMouseLeftButtonDown) {
            this.$target.style.cursor = CURSOR_GRAB;
        }
    }

    onKeyUp(device, state, ev) {
        this.$target.style.cursor = CURSOR_DEFAULT;
    }

    onScale () {

    }

    onPan () {
        
    }

    // 键盘事件属性
    setKeyboardAttributes(device, ev) {
        device.keyCode = ev.keyCode;

        device.altKey = ev.altKey;
        device.metaKey = ev.metaKey;
        device.ctrlKey = ev.ctrlKey;
        
        if (ev.type === KEY_DOWN) {
            device.spaceKey = ev.keyCode === 32;
        } else if (ev.type === KEY_UP) {
            device.spaceKey = false;
        }
    }

    // 鼠标事件属性
    setMouseAttributes(device, ev) {
        if (ev.type === POINTER_UP) {
            device.isMouseLeftButtonDown = false;
            device.mouseButtonCode = -1;
        } else if (ev.type === POINTER_DOWN) {
            device.mouseButtonCode = ev.button;

            if (device.mouseButtonCode === 0) {
                device.isMouseLeftButtonDown = true;
            }
        }

        device.wheelDeltaX = ev.wheelDeltaX;
        device.wheelDeltaY = ev.wheelDeltaY;
        device.deltaX = ev.deltaX;
        device.deltaY = ev.deltaY;
        device.keyCode = ev.keyCode;
        device.pageX = ev.pageX;
        device.pageY = ev.pageY;
        device.pageX = ev.pageX;
        device.pageY = ev.pageY;
    }         
}