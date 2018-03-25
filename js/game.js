
let world = null;
let physworld = null;
let sun = null;
let floor = null;
let balls = [];

function addBall(rad)
{
    let body = new PHYSICS.SphereModule({
        mass: rad,
        viterations: 2,
        diterations: 2,
        pressure: 1000
    });

    let ball = new WHS.Sphere({
        geometry: {
            radius: rad,
            widthSegments: 32,
            heightSegments: 32,
        },
        material: materials.commonMaterial,
        modules: [body],
        position: [Math.random() - 0.5, 5.0, Math.random() - 0.5],
        rotation: [
            Math.random() * Math.PI * 2.0,
            Math.random() * Math.PI * 2.0,
            Math.random() * Math.PI * 2.0
        ]
    });

    ball.body = body;
    ball.addTo(world).then((b)=>balls.push(b));
}

function init()
{
    clock = new THREE.Clock();
    camera = new WHS.PerspectiveCamera({
        position: new THREE.Vector3(0, 2, 7),
    });

    physworld = new PHYSICS.WorldModule({
        ammo: "https://rawgit.com/WhitestormJS/physics-module-ammonext/master/vendor/ammo.js",
        gravity: new THREE.Vector3(0, -10, 0),
        softbody: true
    });

    world = new WHS.App([
        new WHS.ElementModule(document.getElementById("stage")),
        new WHS.SceneModule(),
        new WHS.DefineModule("camera", camera),
        physworld,
        new WHS.RenderingModule({
            alpha: true,
        }),
        new WHS.ResizeModule(),
    ]);

    physworld.addEventListener("ready", (e)=>{
        anime({
            targets: stageloading,
            translateY: "-100%",
            complete: ()=>
            {
                stageloading.style.visibility = "hidden";
            }
        });
        world.start();
    });

    uniforms.V.value.copy(camera.position);
    uniforms.V.value.normalize();
    sun = new WHS.DirectionalLight({
        light: {},
        position: [0, 4.0, 0],
        rotation: [0, 0, 0],
    });
    sun.addTo(world);
    new WHS.AmbientLight({
        color: 0x404090
    }).addTo(world);
    uniforms.L.value.copy(sun.position);
    uniforms.L.value.normalize();

    // materials
    materials.commonMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: commonVertexShader,
        fragmentShader: commonFragmentShader,
    });

    // floor
    let floorBoxModule = new PHYSICS.BoxModule({
        mass: 0,
        restitution: 0.34,
    });
    floor = new WHS.Box({
        geometry: {
            width: 4.0,
            height: 2.0,
            depth: 4.0,
        },

        material: new THREE.MeshStandardMaterial({
            color: 0x454545,
        }),
        position: [0, -1.0, 0],
        modules: [floorBoxModule],
    });
    floor.body = floorBoxModule;
    floor.addTo(world);
}

var newBallFromControllerCooldown = 2.0;
let update = new WHS.Loop((clock)=>
{
    newBallFromControllerCooldown -= clock.getDelta();

    let force = {x: 0, y: 0, z: 0};
    let offset = {x: 0, y: 0, z: 0};
    for (var i = GPADINPUT.length - 1; i >= 0; i--)
    {
        let pad = GPADINPUT[i];
        if(!pad)
        {
            continue;
        }

        force.x += pad.lstick.x * 4.0;
        force.y = pad.buttons[0].value * 4.0;
        force.z += pad.lstick.y * 4.0;

        if (pad.buttons[1].pressed && newBallFromControllerCooldown <= 0)
        {
            newBallFromControllerCooldown = 2.0;
            addBall(Math.random() * 0.25 + 0.1);
        }
    }
    balls.map((b)=>{
        if (b.position.y < -10)
        {
            world.remove(b);
            balls.splice(balls.indexOf(b), 1);
            delete b;
            return;
        }

        b.body.applyForce(force, offset);
    });
});

let GAME = function()
{
    init();
    world.addLoop(update);
    update.start();

    let pressedKeys = [];

    WSCONNEVENT.addEventListener("send", (e)=>
    {
    });

    WSCONNEVENT.addEventListener("newchat", (e)=>
    {
        addBall(Math.min(Math.sqrt(e.detail["content"].length)) * 0.11);
    });
}
