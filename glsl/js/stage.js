
var W = stage.clientWidth;
var H = stage.clientHeight;

let renderer = null;
let scene = null;
let camera = null;
let clock = null;
let targetM = new THREE.Vector2(0, 0);
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
var frag =
`
float world(vec3 p)
{ return length(p) - 0.5; }

void main()
{
    gl_FragColor = vec4(0);
}
`;

function animate()
{
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    defaultUniforms.T.value += clock.getDelta();

    defaultUniforms.M.value.x += (targetM.x - defaultUniforms.M.value.x) * 0.05;
    defaultUniforms.M.value.y += (targetM.y - defaultUniforms.M.value.y) * 0.05;
}

function STAGE()
{
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    renderer.setSize(W, H);
    stage.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    let aspect = W / H;
    defaultUniforms.aspect.value = aspect;
    camera = new THREE.OrthographicCamera(
        aspect * -0.5, aspect * 0.5,
        0.5, -0.5,
        0.1, 100.0
    );
    camera.position.z = 1.0;

    let quadGeo = new THREE.PlaneGeometry(1.0 * aspect, 1.0);
    let shaderMaterial = new THREE.ShaderMaterial({
        uniforms: defaultUniforms,
        vertexShader: basic_vert,
        fragmentShader: frag_lib + window.frag,
    });

    let script = document.createElement("script");
    script.src = new URL(window.location.href).searchParams.get("frag");
    script.onload = (e)=>
    {
        shaderMaterial.fragmentShader = frag_lib + window.frag;
        scene.add(new THREE.Mesh(quadGeo, shaderMaterial));
    };
    head.appendChild(script);

    clock = new THREE.Clock();
    animate();

    document.onmousemove = function (e)
    {
        targetM.x = 0.5 + (e.clientX / W) * 0.5;
        targetM.y = 0.5 + (e.clientY / H) * 0.5;
    }
}
