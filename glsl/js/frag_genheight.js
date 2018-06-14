
// terrain height simulation with compute shader
// run once, it's ok to be a little heavy
const SEED_WH = 128;
const SIM_WH = 1024;
let simProgram =
`
void main()
{
    lowp uvec4 c = texture(in_buff, bl_UV);
    out_buff = c.x;
}
`;

let guide = new blink.Buffer({
    alloc: SEED_WH * SEED_WH,
    type: blink.UINT8
});
for(let x = 0; x < SEED_WH; x++)
{
    for (let y = 0; y < SEED_WH; y++)
    {
        guide.data[x + y * SEED_WH] = Math.cos(y) * 1.0 + 2.0;
    }
}

let buffer = new blink.Buffer({
    alloc: SIM_WH * SIM_WH,
    type: blink.UINT8
});

let kernel = new blink.Kernel({
        input: { in_buff: guide },
        output: { out_buff: buffer }
    },
    simProgram);

kernel.exec({ seed: 2.3 });
kernel.delete();

let dataTexture = new THREE.DataTexture(
    buffer.data,
    SIM_WH, SIM_WH,
    THREE.LuminanceFormat
);
dataTexture.wrapS = THREE.RepeatWrapping;
dataTexture.wrapT = THREE.RepeatWrapping;
dataTexture.needsUpdate = true;
defaultUniforms.HEIGHT = {
    type: "t",
    value: dataTexture
};


// fragment shader
window.frag =
`
uniform sampler2D HEIGHT;

// height base terrain
float terrain(vec2 xz)
{
    if (length(xz) > 6.0)
    {
        return -1.0;
    }

    xz = rotate(vec3(xz, 0.0), vec3(0, 0, mod(T * 0.5, PI * 2.0))).xy;
    return texture2D(HEIGHT, xz * 0.25).x * 200.0;
}

// p: sample surface
vec3 surface_normal(vec3 p)
{
    vec2 o = vec2(NRM_OFS, 0.0);
    return normalize(vec3(
        terrain(p.xz + o.xy) - terrain(p.xz - o.xy),
        2.0 * o.x,
        terrain(p.xz + o.yy) - terrain(p.xz - o.yy)
    ));
}

// o: origin
// r: ray
// c: color
float ray_terrain(vec3 o, vec3 r, inout vec3 color)
{
    #define SEA_LEVEL 0.0
    for (float t = 0.01; t < 50.0; t += 0.01)
    {
        vec3 p = o + r * t;
        if (p.y < terrain(p.xz))
        {
            // color += vec3(0, 1, 0);
            return t - 0.005;
        }
        
    }
    return FAR;
}

void main()
{
    vec3 o = vec3(0, 8.5, -10.0);
    vec3 r = normalize(vec3(v_uv - vec2(0.5 * aspect, 0.5), 1.01));
    vec3 l = normalize(vec3(4, 1, -5));
    r = rotate(r, vec3(-0.75, 0, 0));

    vec3 color = vec3(0);
    float d = ray_terrain(o, r, color);
    if (d < FAR)
    {
        vec3 n = surface_normal(o + r * d);
        float ndl = dot(n, l);
        color *= ndl;
    }
    else
    {
        color = vec3(0, 0, 1);
    }

    // add simple fog
    #define FOG_DIST 2.5
    #define FOG_DENSITY 0.32
    #define FOG_COLOR vec3(0.35, 0.37, 0.42)
    color = mix(FOG_COLOR, color, clamp(pow(FOG_DIST / abs(d), FOG_DENSITY), 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0);
}
`;
