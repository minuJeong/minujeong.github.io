
let world = null;
let physworld = null;
let sun = null;
let player = null;
let otherPlayers = {};
let input = null;
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
        position: new THREE.Vector3(0, 3, 6),
        rotation: new THREE.Vector3(-Math.atan2(3.0, 6.0), 0, 0),
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
        position: [0.0, 4.0, 0.0],
    });

    sun.addTo(world);
    new WHS.AmbientLight({
        color: 0x503090
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
        geometry:
        {
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
            radius: 0.5,
            widthSegments: 32,
            heightSegments: 32,
        },
        position: new THREE.Vector3(0, 0, 0),
        material: materials.commonMaterial,
    }).addTo(world).then((c) =>
    {
        player = c;
        player.position.x = 0;
        player.position.y = 0;
        player.position.z = 0;
        let ox = camera.position.x - player.position.x;
        let oz = camera.position.z - player.position.z;
        var lookX = 0.0;
        var lookZ = 0.0;

        var mouseX = 0.0;
        var mouseY = 0.0;
        document.addEventListener("mousemove", (e)=>
        {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        let update = new WHS.Loop((clock)=>
        {
            let delta = clock.getDelta();

            player.rotation.x += 0.02;
            player.rotation.y += 0.02;
            player.rotation.z += 0.02;

            let dx = camera.position.x - player.position.x;
            let dz = camera.position.z - player.position.z;

            camera.position.x += (ox - dx + lookX) * 0.05;
            camera.position.z += (oz - dz + lookZ) * 0.05;

            input = {x: 0, y: 0};
            if (isMouseDown)
            {
                input.x = (mouseX - mouseDragStart.x) * delta * 0.1;
                input.y = (mouseY - mouseDragStart.y) * delta * 0.1;
            }
            else
            {
                for (var i = GPADINPUT.length - 1; i >= 0; i--)
                {
                    let pad = GPADINPUT[i];
                    if(!pad) { continue; }

                    lookX = (pad.rstick.x * 20.0 - lookX) * 0.2;
                    lookZ = (pad.rstick.y * 20.0 - lookZ) * 0.2;
                    if (Math.abs(pad.lstick.x) > 0.1)
                    {
                        input.x += pad.lstick.x * delta * 2.0;
                    }
                    if (Math.abs(pad.lstick.y) > 0.1)
                    {
                        input.y += pad.lstick.y * delta * 2.0;
                    }
                }
            }

            player.position.x += input.x;
            player.position.z += input.y;

            // send position to server
            if (!isNaN(player.position.x) &&
                !isNaN(player.position.y) &&
                !isNaN(player.position.z))
            {
                WSCONNEVENT.dispatchEvent(
                    new CustomEvent(
                        "syncpos", {detail: player.position}
                    ));
            }
        });
        world.addLoop(update);
        update.start();
        world.start();
    });
}

let GAME = function()
{
    init();
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
        if (e.detail.id in otherPlayers)
        {
            world.remove(otherPlayers[e.detail.id]);
        }
    });
}
