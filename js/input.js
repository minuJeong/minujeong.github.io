
let pressedButtons = [];
let KEYBOARDINPUT = {
    movement: new THREE.Vector2(),
};

let GPADINPUT = [null, null, null, null];

let GPAD = ()=>{
    let poll_pad = ()=>
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

    let poll_keyboard = ()=>
    {
        var dx = 0;
        var dy = 0;
        pressedButtons.forEach((k)=>{
            switch(k)
            {
                case 37:
                    dx = -1;
                    break;
                case 38:
                    dy = -1;
                    break;
                case 39:
                    dx = 1;
                    break;
                case 40:
                    dy = 1;
                    break;
            }

            KEYBOARDINPUT.movement.x = dx;
            KEYBOARDINPUT.movement.y = dx;
            KEYBOARDINPUT.movement.normalize();
        });
    };

    let loop = ()=>
    {
        requestAnimationFrame(loop);
        poll_pad();
        poll_keyboard();
    };
    loop();

    document.addEventListener("keydown", (e)=>pressedButtons.push(e.keyCode));
    document.addEventListener("keyup", (e)=>pressedButtons.pop(pressedButtons.indexOf(e.keyCode)));
};
