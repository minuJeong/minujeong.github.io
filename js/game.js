
var W = stage.clientWidth;
var H = stage.clientHeight;

let input = null;
var mouseX = 0.0;
var mouseY = 0.0;
let camY = 5.0;
let camZ = 10.0;

let clock = null;

let renderer = null;
let world = null;
let sun = null;
let player = null;
let otherPlayers = {};


function spawnOtherPlayer(id, pos)
{
    let otherPlayer = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 32, 32),
        materials.otherPlayerMaterial
    );
    otherPlayer.position.copy(pos);
    let dirDisp = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        materials.otherPlayerMaterial
    );
    dirDisp.position.z = 1;
    otherPlayer.add(dirDisp);
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

    camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.x = 0;
    camera.position.y = camY;
    camera.position.z = camZ;
    camera.rotation.x = -Math.atan2(camY - 1.5, camZ);
    world = new THREE.Scene();

    baseUniform.V.value.copy(camera.position);
    baseUniform.V.value.normalize();

    sun = new THREE.DirectionalLight({
        position: new THREE.Vector3(-3.0, 4.0, 6.0),
    });
    world.add(sun);
    baseUniform.L.value.copy(sun.position);
    baseUniform.L.value.normalize();

    // materials
    materials.playerMaterial = new THREE.ShaderMaterial({
        uniforms: Object.assign(playerUniform, baseUniform),
        vertexShader: commonVertexShader,
        fragmentShader: commonFragmentShader,
    });

    materials.otherPlayerMaterial = new THREE.ShaderMaterial({
        uniforms: Object.assign(otherPlayerUniform, baseUniform),
        vertexShader: commonVertexShader,
        fragmentShader: commonFragmentShader,
    });

    materials.playerMaterial.uniforms.C.value.set(1, 0, 0);
    materials.otherPlayerMaterial.uniforms.C.value.set(0, 0, 1);

    // player view
    player = new THREE.Object3D();
    {
        world.add(player);
        let loader = new THREE.OBJLoader();
        loader.load("res/mesh/body.obj", (g)=>
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

    input = {x: 0, y: 0};
    if (isMouseDown)
    {
        input.x = (mouseX - mouseDragStart.x) * delta * 0.005;
        input.y = (mouseY - mouseDragStart.y) * delta * 0.005;
    }
    else
    {
        for (var i = GPADINPUT.length - 1; i >= 0; i--)
        {
            let pad = GPADINPUT[i];
            if(!pad) { continue; }

            if (Math.abs(pad.lstick.x) > 0.25)
            {
                input.x += pad.lstick.x * delta * 2.0;
            }
            if (Math.abs(pad.lstick.y) > 0.25)
            {
                input.y += pad.lstick.y * delta * 2.0;
            }
        }
    }

    player.position.x += input.x;
    player.position.z += input.y;
    camera.position.x += (player.position.x - camera.position.x) * 0.05;
    camera.position.y += ((player.position.y + camY) - camera.position.y) * 0.05;
    camera.position.z += ((player.position.z + camZ) - camera.position.z) * 0.05;

    if ((input.x * input.x + input.y * input.y) > 0.0)
    {
        let tq = new THREE.Quaternion();
        tq.setFromEuler(new THREE.Euler(0, -Math.atan2(input.y, input.x) + Math.PI * 0.5, 0));
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
}

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
