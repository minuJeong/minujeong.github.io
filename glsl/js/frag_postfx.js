// fragment shader
window.frag =
`
// p: sample position
float world(vec3 p, inout vec3 color)
{
    return sphere(p, 1.0);
}

// p: sample surface
vec3 norm(vec3 p)
{
    vec2 o = vec2(NRM_OFS, 0.0);
    vec3 dump_c = vec3(0);
    return normalize(vec3(
        world(p + o.xyy, dump_c) - world(p - o.xyy, dump_c),
        world(p + o.yxy, dump_c) - world(p - o.yxy, dump_c),
        world(p + o.yyx, dump_c) - world(p - o.yyx, dump_c)
    ));
}

// o: origin
// r: ray
// c: color
float raymarch(vec3 o, vec3 r, inout vec3 c)
{
    float t = 0.0;
    vec3 p = vec3(0);
    float d = 0.0;
    for (int i = MARCHING_MINSTEP; i < MARCHING_STEPS; i++)
    {
        p = o + r * t;
        d = world(p, c);
        if (abs(d) < MARCHING_CLAMP)
        {
            return t;
        }
        t += d;
    }
    return FAR;
}

void main()
{
    // o: origin
    vec3 o = vec3(0, 1, -6.0);

    // r: ray
    vec3 r = normalize(vec3(v_uv - vec2(0.5 * aspect, 0.5), 1.001));

    // l: light
    vec3 l = normalize(L);

    // c: albedo
    vec3 c = vec3(0.125);
    float d = raymarch(o, r, c);

    // pixel color
    vec3 color = vec3(0);
    if (d < FAR)
    {
        vec3 p = o + r * d;
        vec3 n = norm(p);

        float lambert = dot(n, l);
        lambert = clamp(lambert, 0.0, 1.0);

        #define SPEC_COLOR vec3(0.95, 0.95, 0.95)
        vec3 h = normalize(o + l);
        float ndh = clamp(dot(n, h), 0.0, 1.0);
        float ndv = clamp(dot(n, -o), 0.0, 1.0);
        float spec = pow((ndh + ndv) + 0.01, 64.0) * 0.25;

        color = c * lambert + SPEC_COLOR * spec;
    }

    // add simple fog
    #define FOG_DIST 2.5
    #define FOG_DENSITY 0.32
    #define FOG_COLOR vec3(0.35, 0.37, 0.42)
    color = mix(FOG_COLOR, color, clamp(pow(FOG_DIST / abs(d), FOG_DENSITY), 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0);
}
`;

window.postfx = `
uniform sampler2D G;

void main()
{
    vec3 c = texture2D(G, v_uv.xy).xyz;
    gl_FragColor = vec4(c.xyz, 1.0);
}
`;

(()=>{
    let renderBuffer = new THREE.CanvasTexture(
        canvas=renderer.domElement,
        magFilter=THREE.LinearFilter,
        minFilter=THREE.LinearFilter,
    )

    let postfxRenderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    })
    postfxRenderer.setSize(W, H)
    stage.appendChild(postfxRenderer.domElement)
    let pfxScene = new THREE.Scene()

    let ii = 0.0
    defaultUniforms.L.value.y = 10.0
    defaultUniforms.L.value.z = -20.0
    defaultUniforms.G = {
        type: 't',
        value: renderBuffer
    }

    pfxScene.add(new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2, 1, 1),
        new THREE.ShaderMaterial({
            uniforms: defaultUniforms,
            vertexShader: basic_vert,
            fragmentShader: frag_lib + window.postfx,
        })
    ))

    let aspect = W / H
    let pfxCamera = new THREE.OrthographicCamera(
        aspect * -0.5, aspect * 0.5,
        0.5, -0.5,
        -1.0, 1.0
    )

    postAnimate = () => {
        ii += 0.1;

        let x = defaultUniforms.L.value.x
        x = Math.cos(ii) * 20.0
        defaultUniforms.L.value.x = x
        renderBuffer.needsUpdate = true
        
        postfxRenderer.render(pfxScene, pfxCamera)
    }
})()
