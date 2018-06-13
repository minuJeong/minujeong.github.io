
var W = stage.clientWidth;
var H = stage.clientHeight;

let renderer = null;
let scene = null;
let camera = null;
let clock = null;
let defaultUniforms = {
    aspect:
    {
        type: "f",
        value: 1.0
    },
    L: {
        type: "v3",
        value: new THREE.Vector3(-2, 3, -5)
    },
    T: {
        type: "float",
        value: 0.0
    },
    M:
    {
        type: "v2",
        value: new THREE.Vector2(0, 0)
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
        alpha: true,
        antialias: true
    });
    renderer.setSize(W, H);

    scene = new THREE.Scene();
    let aspect = W / H;
    defaultUniforms.aspect.value = aspect;
    camera = new THREE.OrthographicCamera(
        aspect * -0.5, aspect * 0.5,
        0.5, -0.5,
        0.1, 100.0
    );
    camera.position.z = 1.0;

    var mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.0 * aspect, 1.0),
        new THREE.ShaderMaterial({
            uniforms: defaultUniforms,
            vertexShader: vert,
            fragmentShader: frag,
        }));
    scene.add(mesh);
    stage.appendChild(renderer.domElement);
    clock = new THREE.Clock();
    animate();

    document.onmousemove = function (e)
    {
        defaultUniforms.M.value.x = 0.5 + (e.clientX / W) * 0.5;
        defaultUniforms.M.value.y = 0.5 + (e.clientY / H) * 0.5;
    }
}
