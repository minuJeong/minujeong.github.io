
let GPADINPUT = [null, null, null, null];
let GPAD = ()=>{
    let poll = ()=>
    {
        var pads = [];
        if (navigator.getGamepads)
        {
            pads = navigator.getGamepads();
        } else if (navigator.webkitGetGamepads)
        {
            pads = navigator.webkitGetGamepads;
        }

        for (var i = pads.length - 1; i >= 0; i--)
        {
            let pad = pads[i];
            if (pad == null)
            {
                GPADINPUT[i] = null;
                continue;
            }

            GPADINPUT[i] = {};
            GPADINPUT[i].lstick = new THREE.Vector2(pad.axes[0], pad.axes[1]);
            GPADINPUT[i].rstick = new THREE.Vector2(pad.axes[2], pad.axes[3]);
            GPADINPUT[i].buttons = pad.buttons;
        }
    }

    let loop = ()=>
    {
        requestAnimationFrame(loop);
        poll();
    };
    loop();
};