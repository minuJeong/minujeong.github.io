
var W = stage.clientWidth;
var H = stage.clientHeight;

function Scene()
{
    let renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        clearColor: new THREE.Color(0x000000)
    });
    renderer.setSize(W, H);
    window.addEventListener("resize", (e)=>
    {
        W = stage.clientWidth;
        H = stage.clientHeight;
        renderer.setSize(W, H);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
    });
    stage.appendChild(renderer.domElement);

    let world = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 1000);
    camera.position.z = -20.0;
    world.add(camera);
    
    let prevBox = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: SHADERS.vsSource,
            fragmentShader: SHADERS.fsSource,
        })
    );
    prevBox.position.z = 10.0;
    world.add(prevBox);

    function render()
    {
        requestAnimationFrame(render);
        renderer.render(world, camera);
    }
    render();
}
