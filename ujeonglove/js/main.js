"use strict"

$(function() {
    const T = THREE

    let W = window.innerWidth
    let H = window.innerHeight

    const renderer = new T.WebGLRenderer({antialias: true})
    const scene = new T.Scene()
    const camera = new T.OrthographicCamera(-1, 1, 1, -1, -1.0, 1.0)

    const uniforms = {
        u_time: { value: 0.0 },
        u_resolution: { value: new T.Vector2(1.0, 1.0)},
    }

    const animate = () => {
        requestAnimationFrame(animate)
        uniforms.u_time.value = (Date.now() % 10000000.0)

        renderer.render(scene, camera)
    }

    const resize = () => {
        W = window.innerWidth
        H = window.innerHeight
        const W2 = W / 2
        const H2 = H / 2

        camera.left = -W2
        camera.right = W2
        camera.top = H2
        camera.bottom = -H2
        camera.updateProjectionMatrix()
        renderer.setSize(W, H)

        uniforms.u_resolution.value.set(W, H)
    }

    const vertices = new Float32Array([
        -1.0, -1.0, 0.0, 1.0,
        +1.0, -1.0, 0.0, 1.0,
        -1.0, +1.0, 0.0, 1.0,
        +1.0, +1.0, 0.0, 1.0,
    ])
    const geo = new T.BufferGeometry()
    geo.setAttribute("in_pos", new T.BufferAttribute(vertices, 4))
    geo.setIndex([0, 1, 2, 2, 1, 3])
    const material = new T.RawShaderMaterial({
        "uniforms": uniforms,
        vertexShader: VS,
        fragmentShader: FS
    })
    const mesh = new T.Mesh(geo, material)
    scene.add(mesh)

    document.body.appendChild(renderer.domElement)
    document.body.style.margin = 0
    document.body.style.overflow = "hidden"

    resize()
    window.addEventListener("resize", () => resize())
    animate()
})
