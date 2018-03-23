
let renderer = null;
let scene = null;
let clock = null;
let camera = null;
let composer = null;
let uniforms =
{
    T:
    {
        value: 0.0,
    },

    L:
    {
        type: 'v3',
        value: new THREE.Vector3(0, 1, 0),
    },

    V:
    {
        type: 'v3',
        value: new THREE.Vector3(0, 0, -1),
    }
};

let ammoWorld = null;
let bodies = [];
let outline = {};
let materials = {};

var W = stage.clientWidth;
var H = stage.clientHeight;

function readStageSize()
{
    W = stage.clientWidth;
    H = stage.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
}

function initThree()
{
    outline.dynamics = [];

    renderer = new THREE.WebGLRenderer({
        alpha: true,
    });

    clock = new THREE.Clock();
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 10000);
    camera.position.y = 3.0;
    camera.position.z = 7.0;
    camera.rotation.x = Math.atan2(-camera.position.y + 1.0, camera.position.z);
    uniforms.V.value = camera.getWorldDirection();
    readStageSize();

    composer = new POSTPROCESSING.EffectComposer(renderer);
    composer.addPass(new POSTPROCESSING.RenderPass(scene, camera));
    let bloom = new POSTPROCESSING.BloomPass();
    bloom.renderToScreen = true;
    composer.addPass(bloom);

    let sun = new THREE.PointLight();
    sun.position.y = 4.0;
    uniforms.L.value.copy(sun.position);
    uniforms.L.value.normalize();
    outline.sun = sun;
    scene.add(sun);
    stage.appendChild(renderer.domElement);
}

function initAmmo()
{
    let config = new Ammo.btDefaultCollisionConfiguration();
    let dispatcher = new Ammo.btCollisionDispatcher(config);
    let broadphase = new Ammo.btDbvtBroadphase();
    let solver = new Ammo.btSequentialImpulseConstraintSolver();
    ammoWorld = new Ammo.btDiscreteDynamicsWorld(
        dispatcher, broadphase, solver, config
    );

    ammoWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));
}

function initScene()
{
    materials.commonMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: commonVertexShader,
        fragmentShader: commonFragmentShader,
    });

    // floor
    {
        let mesh = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.0, 4),
            new THREE.MeshStandardMaterial({
                color: 0x606060,
            }));
        mesh.position.y = -1.0;
        scene.add(mesh);
        outline.floor = mesh;

        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0, -0.5, 0));
        let motion = new Ammo.btDefaultMotionState(transform);
        let inertia = new Ammo.btVector3(0, 0, 0);
        let shape = new Ammo.btBoxShape(4.0, 1.0, 4.0);
        shape.calculateLocalInertia(0, inertia);
        let body = new Ammo.btRigidBody(
            new Ammo.btRigidBodyConstructionInfo(0, motion, shape, inertia));
        body.mesh = mesh;
        mesh.body = body;
        bodies.push(body);
        ammoWorld.addRigidBody(body);
        body.setActivationState(4);

        // setInterval(()=>
        // {
        //     let s = body.getMotionState();
        //     let t = new Ammo.btTransform();
        //     s.getWorldTransform(t);
        //     console.log(t.getOrigin().x());
        // }, 1000);
    }

    // add preview ball
    {
        let size = 1.0;
        let sphereGeo = new THREE.SphereGeometry(size, 28, 28);
        
        let ball = new THREE.Mesh(sphereGeo, materials.commonMaterial);
        outline.ball = ball;
        scene.add(ball);

        let ballTransform = new Ammo.btTransform();
        ballTransform.setOrigin(new Ammo.btVector3(0, 10, 0));
        let motion = new Ammo.btDefaultMotionState(ballTransform);
        let shape = new Ammo.btSphereShape(size);
        let inertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(size, inertia)
        let body = new Ammo.btRigidBody(
            new Ammo.btRigidBodyConstructionInfo(size, motion, shape, inertia));
        body.mesh = ball;
        ball.body = body;
        bodies.push(body);
        ammoWorld.addRigidBody(body);

        setInterval(()=>body.applyCentralImpulse(
            new Ammo.btVector3(
                Math.random() - 0.5,
                Math.random() + 5.5,
                Math.random() - 0.5
            )
        ), 3000);
    }
}

function simulatePhys(t)
{
    ammoWorld.stepSimulation(t, 10);
    let trans = new Ammo.btTransform();
    bodies.map((body)=>
    {
        let state = body.getMotionState();
        if (state)
        {
            state.getWorldTransform(trans);
            let bpos = trans.getOrigin();
            let bquat = trans.getRotation();
            if (bpos.y() < -3)
            {
                trans.setOrigin(new Ammo.btVector3(0, 10, 0));
                body.setWorldTransform(trans);
                body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
            }

            body.mesh.position.set(
                bpos.x(), bpos.y(), bpos.z());
            body.mesh.quaternion.set(
                bquat.x(), bquat.y(), bquat.z(), bquat.w());
        }
    });
}

var a = 0;
function rotateSun(t)
{
    a = (a + 0.75 * t) % (Math.PI * 2.0);
    outline.sun.position.x = Math.cos(a) * 4.0;
    outline.sun.position.z = (Math.sin(a) * 0.5 + 0.75) * 4.0;
    uniforms.L.value.copy(outline.sun.position);
    uniforms.L.value.normalize();
}

var i = 1;
var framerates = [];
function render()
{
    requestAnimationFrame(render);
    composer.render(scene, camera);

    let deltaTime = clock.getDelta();
    uniforms.T.value += deltaTime;
    rotateSun(deltaTime);
    simulatePhys(deltaTime);

    // update framerate
    if (i++ % 25 == 0)
    {
        let avg = Math.round(framerates.reduce((a, b) => a + b) / framerates.length);
        framerate_display.innerText = avg + " fps";
        framerates = [];
    }
    else
    {
        framerates.push(1.0 / deltaTime);
    }
}

let GAME = function()
{
    initThree();
    Ammo().then(()=>
    {
        initAmmo();
        initScene();
        render();
    });

    let pressedKeys = [];
    window.addEventListener("resize", (e)=>readStageSize());

    CHATEVENT.addEventListener("send", (e)=>
    {
        let size = Math.sqrt(e.detail.length) * 0.25;
        let ballGeom = new THREE.SphereGeometry(size, 12, 12);
        let mesh = new THREE.Mesh(ballGeom, materials.commonMaterial);
        outline.dynamics.push(mesh);
        scene.add(mesh);

        let transform = new Ammo.btTransform();
        transform.setOrigin(new Ammo.btVector3(
            Math.random() * 0.2 - 0.1,
            10 + size,
            Math.random() * 0.2 - 0.1));
        let shape = new Ammo.btSphereShape(size);
        let inertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(size, inertia);
        let body = new Ammo.btRigidBody(
            new Ammo.btRigidBodyConstructionInfo(
                size,
                new Ammo.btDefaultMotionState(transform),
                shape,
                inertia,
        ));
        body.mesh = mesh;
        mesh.body = body;
        bodies.push(body);
        ammoWorld.addRigidBody(body);
    });
    CHATEVENT.addEventListener("newmessage", (e)=>
    {
        outline.ball.body.activate();
        outline.ball.body.applyCentralImpulse(
            new Ammo.btVector3(0, Math.sqrt(e.detail.length), 0)
        );
    });
}
