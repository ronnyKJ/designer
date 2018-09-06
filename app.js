(()=>{

    function log(str){
        logger.innerHTML = str;
    }

    class Designer {
        constructor (container) {
            
            let interaction = new Interaction(container); // 单例
            let renderer = new Renderer(interaction); // 多例

        }
    }

    class Renderer {
        constructor (interaction) {
            this.interaction = interaction;
        }
    }

    class Interaction {
        constructor (container) {

            this.config = {
                MAX_WHEEL_VALUE : 10000,
                INIT_WHEEL_VALUE : 1000,
                MIN_WHEEL_VALUE : 100,
                MAX_SCALE : 10,
                INIT_SCALE : 1,
                MIN_SCALE : 0.1,
                WHEEL_SCALE_RATE: 1000
            };

            this.container = container;
            this.act = null;

            this.mx = 0;
            this.my = 0;
            this.isMouseDown = false;
            this.scale = this.config.INIT_SCALE;
            this.wheel = this.config.INIT_WHEEL_VALUE;

            this.init();
        }

        init () {
            this.container.addEventListener('click', (ev) => {

                
                ev.preventDefault();
                console.log(ev.clientY, ev.layerY, ev.pageY, ev.y);
            }, false);

            this.container.addEventListener('wheel', (ev) => {
                // ev.clientY === ev.y
                // ev.layerY 相对于父容器
                // ev.pageY 相对于页面

                ev.preventDefault();
                this.scale = this.getScale(ev.wheelDeltaY);
                const rect = getPosition(ev);

                this.scaleInteraction(rect.x, rect.y, this.scale);


                log(this.scale);
            }, false);
        }

        getScale (wheelDeltaY) {
            const config = this.config;

            let w = this.wheel;
            w -= wheelDeltaY;
            this.wheel = Math.min(Math.max(w, config.MIN_WHEEL_VALUE), config.MAX_WHEEL_VALUE);
            return this.wheel / config.WHEEL_SCALE_RATE;
        }

        scaleInteraction (scale, x, y) {

        }

        getPosition (ev) {
            const rect = this.container.getBoundingClientRect();
            const x = ev.pageX - rect.top;
            const y = ev.pageY - rect.left;

            return {x, y}
        }
    }

    new Designer(document.querySelector('.container'));

})()