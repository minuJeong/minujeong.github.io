
// fragment shader
window.frag =
`
uniform sampler2D HEIGHT;

vec3 albedo = vec3(0);

// height base terrain
float terrain(vec2 xz)
{
    if (max(abs(xz.x), abs(xz.y)) > 1.0)
    {
        return 0.0;
    }

    xz = rotate(vec3(xz, 0.0), vec3(0, 0, mod(INPUT.x * 2.5, PI * 2.0))).xy;
    vec4 th = texture2D(HEIGHT, mod((xz * 0.5) - vec2(1.5, 1.5), vec2(1.0)));
    return (th.x + th.y + th.z) * 0.06;
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
    float delt = 0.003;
    float prev_h = 0.0;
    float prev_y = 0.0;
    float t = 0.0;

    for (int i = 600; i < 1900; i++)
    {
        vec3 p = o + r * t;
        float h = terrain(p.xz);
        if (p.y < h)
        {
            albedo = h == 0.0 ? vec3(0, 0, 0.5) : vec3(0, 0.5, 0);

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
    vec3 o = vec3(0, 3.0, -3.0);
    vec3 r = normalize(vec3(v_uv - vec2(0.5 * aspect, 0.5), 1.01));
    r = rotate(r, vec3(-0.75, 0, 0));
    vec3 l = normalize(vec3(1, 2, 1));
    l = rotate(l, vec3(0, mod(T * 2.5, PI * 2.0), 0));

    vec3 color = vec3(0);
    float d = ray_terrain(o, r);
    if (d < FAR)
    {
        vec3 n = surface_normal(o + r * d);
        float ndl = clamp(dot(n, l), 0.0, 1.0);
        vec3 lightColor = mix(
            vec3(0.95, 0.93, 0.75),
            vec3(0.75, 0.35, 0.85),
            ndl
        ) * 0.2;
        color = albedo * ndl + lightColor;
    }
    else
    {
        color = vec3(0.5, 0, 1);
    }

    // add simple fog
    #define FOG_DIST 2.5
    #define FOG_DENSITY 0.32
    #define FOG_COLOR vec3(0.35, 0.37, 0.42)
    color = mix(FOG_COLOR, color, clamp(pow(FOG_DIST / abs(d), FOG_DENSITY), 0.0, 1.0));

    gl_FragColor = vec4(color, 1.0);
}
`;

// terrain height simulation with compute shader
// run once, it's ok to be a little heavy
const SEED_WH = 128;
const SIM_WH = 1024;
let simProgram =
`
vec3 normal(vec2 xz)
{
    #define e vec2(0.004, 0.0)
    return vec3(
        texture(in_buff, xz + e.xy).x - texture(in_buff, xz - e.xy).x,
        2.0 * e.x,
        texture(in_buff, xz + e.yx).x - texture(in_buff, xz - e.yx).x
    );
}

void main()
{
    // vec4 c = texture(in_buff, bl_UV);
    // vec3 n = normal(bl_UV);
    // vec4 color = vec4(c.xyz, 1.0);

    float d = length(bl_UV - vec2(0.5));
    vec4 color = vec4(bl_UV / abs(0.5 - d), d, 1.0);

    // convert vec4 to uvec4 for texture format
    vec4 out_channel = clamp(color, 0.0, 1.0) * 256.0;
    out_buff = uvec4(
        uint(out_channel.x),
        uint(out_channel.y),
        uint(out_channel.z),
        uint(out_channel.w)
    );
}
`;

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

// HACK: preview heightmap in canvas
let heightPreview = document.createElement("canvas");
heightPreview.style.width = 150;
heightPreview.style.height = 150;
heightPreview.style.left = 20;
heightPreview.style.top = 20;
heightPreview.style.zIndex = 1;
heightPreview.style.background = "#202020";
heightPreview.style.position = "fixed";

let ctx = heightPreview.getContext('2d');
let imgDat = ctx.getImageData(0, 0, SIM_WH, SIM_WH);
imgDat.data.set(buffer.data);
ctx.putImageData(imgDat, 0, 0);
stage.appendChild(heightPreview);
