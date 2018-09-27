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
    public static POINTER_DOWN = POINTER_DOWN;
    public static POINTER_MOVE = POINTER_MOVE;
    public static POINTER_UP = POINTER_UP;
    public static POINT_CLICK = POINT_CLICK;
    public static WHEEL = WHEEL;
    public static KEY_DOWN = KEY_DOWN;
    public static KEY_UP = KEY_UP;
    public static KEY_PRESS = KEY_PRESS;
    public static CURSOR_DEFAULT = CURSOR_DEFAULT;
    public static CURSOR_GRAB = CURSOR_GRAB;
    public static CURSOR_GRABBING = CURSOR_GRABBING;

    private $target;
    private $wheelTarget;
    private state;
    private device;
    private config;
    
    constructor (config) {
        this.config = config || {};
        this.config.cursor = this.config.cursor || {}; 

        if (!config.$target) {
            return;
        }

        this.$target = config.$target;
        this.$wheelTarget = config.$wheelTarget || this.$target;
        const pointerOverCursor = this.config.cursor.pointerOver;
        if (pointerOverCursor) {
            this.$target.style.cursor = pointerOverCursor;
        }

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
            deltaX: 0,
            deltaY: 0,
            wheelValue: config.initWheelValue || 1000,
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

        const pointerMoveHandler = wrap((device, state, ev) => {
            this.onPointerMove(device, state, ev);
        });

        const pointerUpHandler = wrap((device, state, ev) => {
            this.onPointerUp(device, state, ev);

            window.removeEventListener(POINTER_MOVE, pointerMoveHandler);
            window.removeEventListener(POINTER_UP, pointerUpHandler);
        });

        const pointerDownHandler = wrap((device, state, ev) => {
            this.onPointerDown(device, state, ev);

            window.addEventListener(POINTER_MOVE, pointerMoveHandler, false);
            window.addEventListener(POINTER_UP, pointerUpHandler, false);
        });
        this.$target.addEventListener(POINTER_DOWN, pointerDownHandler, false);

        window.addEventListener(KEY_DOWN, wrap((device, state, ev) => {            
            this.onKeyDown(device, state, ev);
        }), false);

        window.addEventListener(KEY_UP, wrap((device, state, ev) => {
            this.onKeyUp(device, state, ev);
        }), false);
        
        const wheelHandler = wrap((device, state, ev) => {
            this.onWheel(device, state, ev);
        });
        this.$wheelTarget.addEventListener(WHEEL, wheelHandler, false);
    }

    onPointerDown(device, state, ev) {
        // ev.pageY === ev.y
        // ev.layerY 相对于父容器
        // ev.pageY 相对于页面
        // ev.offsetY 相对于target的位置

        const pointerDownCursor = this.config.cursor.pointerDown;
        if (pointerDownCursor && device.isMouseLeftButtonDown) {
            this.$target.style.cursor = pointerDownCursor;
        }

        state.startX = device.pageX;
        state.startY = device.pageY;

        this.config.onPointerDown && this.config.onPointerDown(device, state, ev);
    }

    onPointerMove(device, state, ev) {
        if (this.config.canPointerMove && !this.config.canPointerMove(device, state, ev)) {
            return;
        }

        state.deltaX = device.pageX - state.startX;
        state.deltaY = device.pageY - state.startY;

        this.config.onPointerMove && this.config.onPointerMove(device, state, ev);

        state.startX = device.pageX;
        state.startY = device.pageY;
    }

    onPointerUp(device, state, ev) {
        const pointerUpCursor = this.config.cursor.pointerUp;
        if (pointerUpCursor && !device.isMouseLeftButtonDown) {
            this.$target.style.cursor = pointerUpCursor;
        }        
        this.config.onPointerUp && this.config.onPointerUp(device, state, ev);
    }

    onWheel(device, state, ev) {
        // mac trackpad 双指平移: ev.deltaY * -3 === ev.wheelDeltaY
        // mac trackpad 双指缩放 与 鼠标滚轮 相同: ev.deltaY 为浮点数, ev.wheelDeltaY 为 120 倍数
        if (device.ctrlKey) { // 缩放 ctrl+滚动
            this.onScale(device, state, ev);
        } else { // 平移
            this.onPan(device, state, ev);
        }

        this.config.onWheel && this.config.onWheel(device, state, ev);
    }

    onKeyDown(device, state, ev) {
        this.config.onKeyDown && this.config.onKeyDown(device, state, ev);
    }

    onKeyUp(device, state, ev) {
        this.config.onKeyUp && this.config.onKeyUp(device, state, ev);
    }

    onScale (device, state, ev) {
        this.config.onScale && this.config.onScale(device, state, ev);
    }

    onPan (device, state, ev) {
        this.config.onPan && this.config.onPan(device, state, ev);
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
    }         
}