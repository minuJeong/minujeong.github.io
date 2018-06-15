
//// fragment shader

window.frag =
`
uniform float HEIGHT_SCALE;
uniform sampler2D HEIGHT;

vec3 albedo = vec3(0);

// height base terrain
// returns height
float terrain(vec2 xz)
{
    xz = rotate(vec3(xz, 0.0), vec3(0, 0, mod(INPUT.x * 2.5, PI * 2.0) + 0.25 * PI)).xy;
    if (abs(xz.x) > 1.0 || abs(xz.y) > 1.0)
    {
        return -10.0;
    }

    vec4 th = texture2D(HEIGHT, xz * 0.5 + vec2(0.5, 0.5));
    return (th.x + th.y + th.z) * HEIGHT_SCALE * 0.1;
}

// p: sample surface
vec3 surface_normal(vec3 p)
{
    vec2 o = vec2(0.005, 0.0);
    return normalize(vec3(
        terrain(p.xz + o.xy) - terrain(p.xz - o.xy),
        2.0 * o.x,
        terrain(p.xz + o.yy) - terrain(p.xz - o.yy)
    ));
}

// o: origin
// r: ray
// c: color
float ray_terrain(vec3 o, vec3 r)
{
    #define SEA_LEVEL 0.0
    float delt = 0.006;
    float prev_h = 0.0;
    float prev_y = 0.0;
    float t = 0.0;

    for (int i = 300; i < 850; i++)
    {
        vec3 p = o + r * t;
        float h = terrain(p.xz);

        if (p.y < h)
        {
            float pd = prev_h - prev_y;
            return t - delt + delt * pd / (p.y - h + pd);
        }
        prev_h = h;
        prev_y = p.y;

        t = delt * float(i);
    }
    return FAR;
}

void main()
{
    vec3 o = vec3(0, 2.75, -2.25);
    vec3 r = normalize(vec3(v_uv - vec2(0.5 * aspect, 0.5), 1.01));
    r = rotate(r, vec3(-0.85, 0, 0));
    vec3 l = normalize(vec3(1, 5, -2));

    vec3 color = vec3(0);
    albedo = vec3(0.2);
    float d = ray_terrain(o, r);
    if (d < FAR)
    {
        vec3 n = surface_normal(o + r * d);
        float ndl = dot(n, l);
        color = albedo * clamp(pow(ndl, 0.25), 0.0, 1.0);
    }

    // add simple fog
    #define FOG_DIST 2.5
    #define FOG_DENSITY 0.32
    #define FOG_COLOR vec3(0.35, 0.37, 0.42)
    color = mix(FOG_COLOR, color, clamp(pow(FOG_DIST / abs(d), FOG_DENSITY), 0.0, 1.0));

    gl_FragColor = vec4(color, 1.0);
}
`;


//// compute shader

// terrain height simulation with compute shader
// run once, it's ok to be a little heavy
const SEED_WH = 128;
const SIM_WH = 4096;
let simProgram =
`

// convert vec4 to uvec4 for texture format
uvec4 texturize(vec4 p)
{
    vec3 np = normalize(p.xyz);
    vec4 out_channel = clamp(vec4(np, p.w), 0.0, 1.0) * 256.0;
    return uvec4(
        uint(out_channel.x),
        uint(out_channel.y),
        uint(out_channel.z),
        uint(out_channel.w)
    );
}

void main()
{
    float dist_from_center = length(bl_UV - vec2(0.5)) / 2.0;

    float d = 0.25 - dist_from_center;

    vec4 color = vec4(0);
    color = vec4(d, 0, 0, 1.0);

    out_buff = texturize(color);
}
`;


//// JS

let guide = new blink.Buffer({
    alloc: SEED_WH * SEED_WH,
    type: blink.FLOAT
});
for (let c = 0; c < SEED_WH * SEED_WH; c++)
{
    guide.data[c] = Math.random() * (256.0 * (c / SEED_WH));
}

let buffer = new blink.Buffer({
    alloc: SIM_WH ** 2 * 4,
    type: blink.UINT8,
    vector: 4
});

let kernel = new blink.Kernel({
        input: { in_buff: guide },
        output: { out_buff: buffer }
    },
    simProgram);

kernel.exec({ seed: 2.3 });
kernel.delete();

// HACK: force push compute shader to uber uniform
let dataTexture = new THREE.DataTexture(
    buffer.data,
    SIM_WH, SIM_WH,
    THREE.RGBA,
    THREE.UnsignedByteType
);
dataTexture.wrapS = THREE.RepeatWrapping;
dataTexture.wrapT = THREE.RepeatWrapping;
dataTexture.needsUpdate = true;
defaultUniforms.HEIGHT = {
    type: "t",
    value: dataTexture
};
defaultUniforms.HEIGHT_SCALE = {
    type: "f",
    value: 1.0
};

document.addEventListener("wheel", (e)=>
{
    defaultUniforms.HEIGHT_SCALE.value *= e.deltaY < 0.0 ? 1.1 : 0.9;
});


//// quick add preview canvas
const PREVIEW_RES = 200;
let imgDat = new ImageData(PREVIEW_RES, PREVIEW_RES);
let heightPreview = document.createElement("canvas");
heightPreview.style.width = PREVIEW_RES;
heightPreview.style.height = PREVIEW_RES;
heightPreview.style.left = 20;
heightPreview.style.top = 20;
heightPreview.style.zIndex = 1;
heightPreview.style.background = "#202020";
heightPreview.style.position = "fixed";

// scale down simulated height map to preview size
for(let x = 0; x < PREVIEW_RES; x++)
{
    let rx = x / PREVIEW_RES;
    let sx = Math.floor(rx * SIM_WH);
    for (let y = 0; y < PREVIEW_RES; y++)
    {
        let ry = y / PREVIEW_RES;
        let sy = Math.floor(ry * SIM_WH);

        imgDat.data[(y + x * PREVIEW_RES) * 4 + 0] = buffer.data[(sy + sx * SIM_WH) * 4 + 0];
        imgDat.data[(y + x * PREVIEW_RES) * 4 + 1] = buffer.data[(sy + sx * SIM_WH) * 4 + 1];
        imgDat.data[(y + x * PREVIEW_RES) * 4 + 2] = buffer.data[(sy + sx * SIM_WH) * 4 + 2];
        imgDat.data[(y + x * PREVIEW_RES) * 4 + 3] = buffer.data[(sy + sx * SIM_WH) * 4 + 3];
    }
}

heightPreview.getContext('2d').putImageData(imgDat, 0, 0);
stage.appendChild(heightPreview);
