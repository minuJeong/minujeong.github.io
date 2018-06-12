
var W = stage.clientWidth;
var H = stage.clientHeight;

let renderer = null;
let scene = null;
let camera = null;
let clock = null;
let defaultUniforms = {
    L: {
        type: "v3",
        value: new THREE.Vector3(0, 1.0, -0.5)
    },
    T: {
        type: "float",
        value: 0.0
    }
};

function animate()
{
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    defaultUniforms.T.value += clock.getDelta();
}

function STAGE()
{
    renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setSize(W, H);

    scene = new THREE.Scene();
    let aspect = W / H;
    camera = new THREE.OrthographicCamera(
        aspect * -0.5, aspect * 0.5,
        0.5, -0.5,
        0.1, 100.0
    );
    camera.position.z = 1.0;

    var mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(),
        new THREE.ShaderMaterial({
            uniforms: defaultUniforms,
            vertexShader: vert,
            fragmentShader: frag,
        }));
    scene.add(mesh);

    stage.appendChild(renderer.domElement);
    window.addEventListener("resize", ()=>
    {
        W = stage.clientWidth;
        H = stage.clientHeight;
        renderer.setSize(W, H);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
    });

    clock = new THREE.Clock();
    animate();
}
