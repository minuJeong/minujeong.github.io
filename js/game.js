
let world = null;
let physworld = null;
let sun = null;
let player = null;
let otherPlayers = {};

function spawnOtherPlayer(id, pos)
{
    new WHS.Sphere({
        geometry: {
            radius: 0.25,
            widthSegments: 32,
            heightSegments: 32,
        },
        material: materials.commonMaterial,
        position: {x: pos.x, y: pos.y, z: pos.z},
    }).addTo(world).then((p)=>otherPlayers[id] = p);
}

function init()
{
    clock = new THREE.Clock();
    camera = new WHS.PerspectiveCamera({
        position: new THREE.Vector3(0, 2, 7),
    });

    world = new WHS.App([
        new WHS.ElementModule(document.getElementById("stage")),
        new WHS.SceneModule(),
        new WHS.DefineModule("camera", camera),,
        new WHS.RenderingModule({
            alpha: true,
        }),
        new WHS.ResizeModule(),
    ]);

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
    new WHS.Box({
        geometry: {
            width: 4.0,
            height: 2.0,
            depth: 4.0,
        },

        material: new THREE.MeshStandardMaterial({
            color: 0x454545,
        }),
        position: {x: 0, y: -1.5, z: 0},
    }).addTo(world);

    // char
    new WHS.Sphere({
        geometry: {
            radius: 0.4,
            widthSegments: 32,
            heightSegments: 32,
        },

        material: materials.commonMaterial,
        position: {x: 0, y: 0, z: 0},
    }).addTo(world).then((c) => player = c);
}

let update = new WHS.Loop((clock)=>
{
    let delta = clock.getDelta();
    let input = {x: 0, y: 0, z: 0};
    for (var i = GPADINPUT.length - 1; i >= 0; i--)
    {
        let pad = GPADINPUT[i];
        if(!pad)
        {
            continue;
        }

        if (Math.abs(pad.lstick.x) > 0.1)
        {
            input.x += pad.lstick.x * delta;
        }
        if (Math.abs(pad.lstick.y) > 0.1)
        {
            input.z += pad.lstick.y * delta;
        }

        if (player != null)
        {
            player.position.x += input.x;
            player.position.z += input.z;

            // send position to server
            WSCONNEVENT.dispatchEvent(
                new CustomEvent(
                    "syncpos", {detail: player.position}
                )
            );
        }
    }
});

let GAME = function()
{
    init();
    world.addLoop(update);
    update.start();
    world.start();

    let pressedKeys = [];

    WSCONNEVENT.addEventListener("playingusers", (e)=>
    {
        let playingUsers = e.detail["users"];
        for (var i = playingUsers.length - 1; i >= 0; i--)
        {
            spawnOtherPlayer(playingUsers[i]["id"], playingUsers[i]["pos"]);
        }
    });

    WSCONNEVENT.addEventListener("newuser", (e)=>
    {
        spawnOtherPlayer(e.detail["id"], e.detail["pos"]);
    });

    WSCONNEVENT.addEventListener("pos", (e)=>
    {
        let sender = e.detail;
        if (sender.id in otherPlayers)
        {
            otherPlayers[sender.id].position.x = sender.pos.x;
            otherPlayers[sender.id].position.y = sender.pos.y;
            otherPlayers[sender.id].position.z = sender.pos.z;
        }
    });

    WSCONNEVENT.addEventListener("newchat", (e)=>
    {
    });

    WSCONNEVENT.addEventListener("exit", (e)=>
    {
        console.log("user looged out");
        if (e.detail.id in otherPlayers)
        {
            world.remove(otherPlayers[e.detail.id]);
        }
    });
}
