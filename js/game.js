
var W = stage.clientWidth;
var H = stage.clientHeight;

const INPUT_SPEED = 3.0;
const FORWARD_TO_RIGHT = new THREE.Euler(0, Math.PI * 0.5, 0);

let input = new THREE.Vector3();
var mouseX = 0.0;
var mouseY = 0.0;
let camY = 3.0;
let camZ = 7.0;
let camCenter = null;
var camdir = new THREE.Vector3();

let clock = null;

let renderer = null;
let world = null;
let sun = null;
let player = null;
let otherPlayers = {};

let objLoader = new THREE.OBJLoader();

function spawnOtherPlayer(id, pos)
{
    let otherPlayer = new THREE.Object3D();
    {
        objLoader.load("res/mesh/body_ank.obj", (g)=>
        {
            g.traverse((c)=>
            {
                if(c instanceof THREE.Mesh)
                {
                    c.material = materials.otherPlayerMaterial;
                }
            });
            otherPlayer.add(g);
        });
    }
    world.add(otherPlayer);
    otherPlayers[id] = otherPlayer;
}

function init()
{
    clock = new THREE.Clock();
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
    });
    renderer.setSize(W, H);
    stage.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 1000);
    camera.position.x = 0;
    camera.position.y = camY;
    camera.position.z = camZ;
    camera.rotation.x = -Math.atan2(camY - 0.75, camZ);
    world = new THREE.Scene();

    sun = new THREE.DirectionalLight();
    sun.position.copy(new THREE.Vector3(-13.0, 40.0, 13.0))
    world.add(sun);
    baseUniform.L.value.copy(sun.position);
    baseUniform.L.value.normalize();

    world.add(new TERRAIN());

    // player view
    player = new THREE.Object3D();
    {
        world.add(player);
        objLoader.load("res/mesh/body_ank.obj", (g)=>
        {
            g.traverse((c)=>
            {
                if(c instanceof THREE.Mesh)
                {
                    c.material = materials.playerMaterial;
                }
            });
            player.add(g);
        });

        camCenter = new THREE.Object3D();
        camCenter.add(camera);
        world.add(camCenter);
    }

    ox = camera.position.x;
    oz = camera.position.z;
}


function animate()
{
    requestAnimationFrame(animate);
    renderer.render(world, camera);

    let delta = clock.getDelta();
    baseUniform.T.value += delta;

    let dx = camera.position.x - player.position.x;
    let dz = camera.position.z - player.position.z;

    input.set(0, 0, 0);
    {
        front = camCenter.getWorldDirection();
        right = front.clone().applyEuler(FORWARD_TO_RIGHT);
        for (var i = GPADINPUT.length - 1; i >= 0; i--)
        {
            let pad = GPADINPUT[i];
            if(!pad) { continue; }

            if (Math.abs(pad.rstick.x) > 0.25 ||
                Math.abs(pad.rstick.y) > 0.25)
            {
                camCenter.rotateY(-pad.rstick.x * delta * 7.5);
            }

            if (Math.abs(pad.lstick.x) > 0.25 ||
                Math.abs(pad.lstick.y) > 0.25)
            {
                let inx = pad.lstick.x * delta * INPUT_SPEED;
                let iny = pad.lstick.y * delta * INPUT_SPEED;
                input.addVectors(
                    right.multiplyScalar(inx),
                    front.multiplyScalar(iny)
                );
            }
        }
    }

    player.position.x += input.x;
    player.position.z += input.z;
    camCenter.position.x += (player.position.x - camCenter.position.x) * 0.1;
    camCenter.position.y += (player.position.y - camCenter.position.y) * 0.1;
    camCenter.position.z += (player.position.z - camCenter.position.z) * 0.1;
    baseUniform.V.value.copy(camCenter.position);
    baseUniform.V.value.add(camera.position);
    baseUniform.V.value.normalize();

    if ((input.x * input.x + input.z * input.z) > 0.0)
    {
        let tq = new THREE.Quaternion();
        tq.setFromEuler(new THREE.Euler(0, -Math.atan2(input.z, input.x) + Math.PI * 0.5, 0));
        player.quaternion.slerp(tq, 0.2);
    }

    // send position to server
    WSCONNEVENT.dispatchEvent(new CustomEvent(
        "sync", {
            detail: {
                position: player.position,
                rotation: player.rotation,
            }
        }
    ));
}

let GAME = function()
{
    init();
    animate();

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

    WSCONNEVENT.addEventListener("sync", (e)=>
    {
        let sender = e.detail;
        if (sender.id in otherPlayers)
        {
            otherPlayers[sender.id].position.x = sender.pos.x;
            otherPlayers[sender.id].position.y = sender.pos.y;
            otherPlayers[sender.id].position.z = sender.pos.z;

            otherPlayers[sender.id].rotation.x = sender.rot._x;
            otherPlayers[sender.id].rotation.y = sender.rot._y;
            otherPlayers[sender.id].rotation.z = sender.rot._z;
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

    document.addEventListener("mousemove", (e)=>
    {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    window.addEventListener("resize", (e)=>
    {
        W = stage.clientWidth;
        H = stage.clientHeight;
        renderer.setSize(W, H);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
    });
}
