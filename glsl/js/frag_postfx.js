// fragment shader
window.frag =
`
// p: sample position
float world(vec3 p, inout vec3 color)
{
    float b = box(
        rotate(
            translate(p, vec3(0.85, 0.0, 0.0)),
            vec3(cos(T * 1.5) * PI, 0, PI * 0.25)
        ),
        vec3(0.5)
    );

    float s = sphere(
        translate(p, vec3(-0.5, 0.0, 0.0)),
        1.0
    );

    float bs = blend(s, b, 0.2);

    return bs;
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
        vec3 h = normalize(l - r);
        float ndh = clamp(dot(n, h), 0.0, 1.0);
        float ndv = clamp(dot(n, -o), 0.0, 1.0);
        float spec = pow(ndh + ndv, 128.0) * 2.0;

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

vec3 c;
float count;
float offsetX;
float offsetY;

void main()
{
    vec2 uv = v_uv.xy;
    uv.x /= aspect;

    #define UV_OFFSET_STEP 0.002
    #define UV_OFFSET_MAX  0.01

    for (float i = UV_OFFSET_STEP; i < UV_OFFSET_MAX; i += UV_OFFSET_STEP)
    {
        offsetX = i;
        offsetY = i * aspect;

        c += texture2D(G, uv + vec2(offsetX, 0.0)).xyz
           + texture2D(G, uv - vec2(offsetX, 0.0)).xyz
           + texture2D(G, uv + vec2(0.0, offsetY)).xyz
           + texture2D(G, uv - vec2(0.0, offsetY)).xyz
           + texture2D(G, uv + vec2(offsetX, offsetY)).xyz
           + texture2D(G, uv + vec2(-offsetX, offsetY)).xyz
           + texture2D(G, uv + vec2(offsetX, -offsetY)).xyz
           + texture2D(G, uv + vec2(-offsetX, -offsetY)).xyz;
        count += 8.0;
    }

    c /= count;

    c *= vec3(0.88, 0.85, 1.26);

    float r = smoothstep(0.3, 0.5, (v_uv.y + (v_uv.x / aspect) * 8.0 - 3.5));

    gl_FragColor = vec4(
        mix(c.xyz, texture2D(G, uv).xyz, r).xyz,
        1.0
    );
}
`;

(()=>{
    let renderBuffer = new THREE.CanvasTexture(
        canvas=renderer.domElement
    )

    let ii = 0.0
    defaultUniforms.L.value.y = 50.0
    defaultUniforms.L.value.z = -20.0
    defaultUniforms.G = {
        type: 't',
        value: renderBuffer
    }

    scene.add(new THREE.Mesh(
        new THREE.PlaneGeometry(W / H, 1.0),
        new THREE.ShaderMaterial({
            uniforms: defaultUniforms,
            vertexShader: basic_vert,
            fragmentShader: frag_lib + window.postfx,
        })
    ))

    postAnimate = () => {
        ii += 0.1;

        let x = defaultUniforms.L.value.x
        x = Math.cos(ii) * 40.0
        defaultUniforms.L.value.x = x

        renderBuffer.needsUpdate = true
    }
})()
