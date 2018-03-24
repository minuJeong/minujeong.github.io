
let world = null;
let sun = null;
let floor = null;
let balls = [];

function init()
{
    clock = new THREE.Clock();
    camera = new THREE.PerspectiveCamera({
        
    });
    world = new WHS.App([
        new WHS.ElementModule({
            container: document.getElementById("stage")
        }),
        new WHS.SceneModule(),
        new WHS.DefineModule("camera", new WHS.PerspectiveCamera({
            position: new THREE.Vector3(0, 2, 7),
        })),
        new PHYSICS.WorldModule({
            ammo: "http://minujeong.com/js/ammo.js",
            gravity: new THREE.Vector3(0, -10, 0),
            softbody: true
        }),
        new WHS.RenderingModule({
            alpha: true,
        }),
        new WHS.ResizeModule(),
    ]);

    // uniforms.V.value = world.camera.position;

    sun = new WHS.DirectionalLight({
        light: {},
        position: [0, 4.0, 0],
        rotation: [0, 0, 0],
    });
    sun.addTo(world);
    new WHS.AmbientLight({
        color: 0x404090
    }).addTo(world);

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
    floor.addTo(world).then(()=>world.start());
}

let update = new WHS.Loop((clock)=>
{
    uniforms.L.value.copy(sun.position);
    uniforms.L.value.normalize();

    balls.map((b)=>{
        if (b.position.y < -3)
        {
            world.remove(b);
        }
    });
});

let GAME = function()
{
    init();
    world.addLoop(update);
    update.start();

    let pressedKeys = [];

    CHATEVENT.addEventListener("send", (e)=>
    {
    });

    CHATEVENT.addEventListener("newmessage", (e)=>
    {
        let rad = Math.min(Math.sqrt(e.detail.length)) * 0.11;
        new WHS.Sphere({
            geometry: {
                radius: rad,
                widthSegments: 32,
                heightSegments: 32
            },
            material: materials.commonMaterial,
            modules: [
                new PHYSICS.SphereModule({
                    mass: rad,
                    restitution: 0.85,
                })
            ],
            position: [Math.random() - 0.5, 5.0, Math.random() - 0.5],
        }).addTo(world).then((b)=>balls.push(b));
    });
}
