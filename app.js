(()=>{

    let act;
    let mx = 0;
    let my = 0;
    let isMouseDown = false;

    window.addEventListener('mousedown', function(ev){
    ev.preventDefault();
    isMouseDown = true;

    mx = ev.clientX;
    my = ev.clientY;
    act = ev.target.getAttribute('data-act');

    act && console.log(act);
    }, false);

    window.addEventListener('mousemove', function(ev){
    ev.preventDefault();

    if(isMouseDown === false){
        return;
    }

    if(act === 'move'){
        object.style.transform = `translate(${ev.clientX - mx}px, ${ev.clientY - my}px)`;
    }else if(act === 'resize' && ev.metaKey){
        var rotate = Math.atan2(ev.clientY - 400, ev.clientX - 500) / Math.PI * 180;
        object.style.transformOrigin = `0 0`;
        object.style.transform = `rotate(${rotate}deg)`;
    }else if(act === 'resize'){
        var scale = Math.abs(ev.clientX - mx + 100) / 100;
        object.style.transformOrigin = `0 0`;
        object.style.transform = `scale(${scale})`;
    }    

    }, false);

    window.addEventListener('mouseup', function(ev){
        ev.preventDefault();
        isMouseDown = false;
    }, false); 



})()