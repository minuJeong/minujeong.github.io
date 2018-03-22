let STAGE = async() =>
{
    var W = stage.clientWidth;
    var H = stage.clientHeight;

    let renderer = null;
    let scene = null;
    let camera = null;

    renderer = new THREE.WebGLRenderer({
        alpha: true,
    });
    renderer.setSize(W, H);
    stage.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
    camera.position.y = 5;
    camera.position.z = 15.0;
    camera.rotation.x = -Math.atan2(camera.position.y - 0.5, camera.position.z);

    let sphere = new THREE.SphereGeometry(3, 12, 12);
    let mesh = new THREE.Mesh(sphere, new THREE.MeshStandardMaterial(
    {
        color: 0xde6050,
    }));
    scene.add(mesh);

    let sun = new THREE.DirectionalLight();
    sun.position.x = -4;
    sun.position.y = 20;
    sun.position.z = 4;
    scene.add(sun);

    scene.add(new THREE.AmbientLight(0x203080));

    window.addEventListener("resize", (e) =>
    {
        W = stage.clientWidth;
        H = stage.clientHeight;
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
    });

    let animate = () =>
    {
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}
STAGE().then(() => console.log("stage initialized"));
