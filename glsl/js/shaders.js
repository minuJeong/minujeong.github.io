
////////////////////////////////////////
// vertex shader
let vert =
`
uniform float aspect;

varying vec2 v_uv;
void main()
{
    // use UV value to generate ray
    v_uv = uv;
    v_uv.x *= aspect;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

////////////////////////////////////////
// fragment shader
let frag =
`
#define FAR 80.0
#define MARCHING_MINSTEP 5
#define MARCHING_STEPS 196
#define MARCHING_CLAMP 0.000001
#define NRM_OFS 0.001
#define AO_OFS 0.01
#define PI 3.141592

uniform float aspect;
uniform vec3 L;
uniform float T;
uniform vec2 M;

varying vec2 v_uv;


// p: sample position
// o: offset amount
vec3 translate(vec3 p, vec3 o)
{
    return p - o;
}

// p: sample position
// r: rotation in Euler angles (radian)
vec3 rotate(vec3 p, vec3 r)
{
    vec3 c = cos(r);
    vec3 s = sin(r);
    mat3 rx = mat3(
        1, 0, 0,
        0, c.x, -s.x,
        0, s.x, c.s
    );
    mat3 ry = mat3(
        c.y, 0, s.y,
        0, 1, 0,
        -s.y, 0, c.y
    );
    mat3 rz = mat3(
        c.z, -s.z, 0,
        s.z, c.z, 0,
        0, 0, 1
    );
    return rz * ry * rx * p;
}

// p: sample position
// t: tiling distance
vec3 tile(vec3 p, vec3 t)
{
    return mod(p, t) - 0.5 * t;
}

// p: sample position
// r: radius
float sphere(vec3 p, float r)
{
    return length(p) - r;
}

// p: sample position
// b: width, height, length (scalar along x, y, z axis)
float box(vec3 p, vec3 b)
{
    return length(max(abs(p) - b, 0.0));
}

// c.x, c.y: offset
// c.z: radius
float cylinder(vec3 p, vec3 c)
{
    return length(p.xz - c.xy) - c.z;
}

// a, b: capsule position from - to
// r: radius r
float capsule(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 dp = p - a;
    vec3 db = b - a;
    float h = clamp(dot(dp, db) / dot(db, db), 0.0, 1.0);
    return length(dp - db * h) - r;
}

// p: sample position
// c: cylinder c
// b: box b
float clamp_cylinder(vec3 p, vec3 c, vec3 b)
{
    return max(cylinder(p, c), box(p, b));
}

// a: primitive a
// b: primitive b
// k: blending amount
float blend(float a, float b, float k)
{
    float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
    return mix(a, b, h) - k * h * (1.0 - h);
}

// p: sample position
float world(vec3 p, inout vec3 color)
{
    #define CAMERA_ROTATION_SPEED 0.025
    float a = mod(T * CAMERA_ROTATION_SPEED, PI * 2.0);
    vec3 pt = rotate(p, vec3(-0.35 - M.y * PI * 2.0, a - M.x * PI * 2.0, cos(T * 0.25) * 0.1));

    #define TIME_SCALE_1 3.0
    #define TIME_SCALE_2 0.25
    float ct = cos(T * TIME_SCALE_1);
    float st = sin(T * TIME_SCALE_1);
    float ct2 = cos(T * TIME_SCALE_2);

    #define CAPSULE_RAD 0.025
    #define TILE_CAPSULES 2.0
    #define FRAME_BLEND 0.1
    #define FRAME_CLAMP FAR
    vec3 tilept = tile(pt, vec3(TILE_CAPSULES));
    float cx = capsule(tilept, vec3(-2.0, 0, 0), vec3(+2.0, 0, 0), CAPSULE_RAD);
    float cy = capsule(tilept, vec3(0, +2.0, 0), vec3(0, -2.0, 0), CAPSULE_RAD);
    float cz = capsule(tilept, vec3(0, 0, -2.0), vec3(0, 0, +2.0), CAPSULE_RAD);
    float c = max(blend(blend(cy, cz, FRAME_BLEND), cx, FRAME_BLEND), box(pt, vec3(FRAME_CLAMP)));
    if (cx > cy && cz > cy && c < MARCHING_CLAMP)
    {
        color += vec3(-0.1, 0.1, 0.1);
    }

    #define GI_DIST 0.3
    #define GI_BALL_BLEND 0.85
    #define GI_BALL_TRAVEL 2.5
    vec3 pr = translate(pt, vec3(GI_BALL_TRAVEL * ct2, GI_DIST * (ct - st), GI_DIST * (ct + st)));
    vec3 pg = translate(pt, vec3(GI_DIST * (ct - st), GI_BALL_TRAVEL * ct2, GI_DIST * (ct + st)));
    vec3 pb = translate(pt, vec3(GI_DIST * (ct + st), GI_DIST * (ct - st), GI_BALL_TRAVEL * ct2));

    // add color from ball
    #define GI_RADISANCE 0.5
    #define GI_INTENSITY 0.75
    if (c < MARCHING_CLAMP)
    {
        color += max(vec3(
            1.0 - (length(pr) - GI_RADISANCE),
            1.0 - (length(pg) - GI_RADISANCE),
            1.0 - (length(pb) - GI_RADISANCE)
        ) * GI_INTENSITY, vec3(0));
    }

    float joint_sphere = sphere(tile(pt, vec3(TILE_CAPSULES)), 0.1);
    if (c > joint_sphere && joint_sphere < MARCHING_CLAMP)
    {
        color += vec3(0.5, 0, 0);
    }
    return min(c, joint_sphere);
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
    #define MINCLIP 2.0
    float t = MINCLIP;

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

// o: surface
// n: surface normal
// d: depth
float ambient_occlusion(vec3 p, vec3 n)
{
    #define STEP 0.06;
    #define AO_ITER 5
    float t = STEP;
    float occusion = 0.0;
    for(int i = 0; i < AO_ITER; i++)
    {
        vec3 dump_c = vec3(0);
        float d = world(p + n * t, dump_c);
        occusion += t - d;
        t += STEP;
    }
    return 1.0 - clamp(occusion, 0.0, 1.0);
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
        float ao = ambient_occlusion(p, n);

        float lambert = dot(n, l);
        lambert = mix(lambert, ao, 0.5);
        lambert = clamp(lambert, 0.0, 1.0);

        #define TOON_POWER 16.0
        #define LAM_MIN 0.25
        float toon = clamp(pow(2.0 * lambert, TOON_POWER), LAM_MIN, 1.0);

        #define SPEC_COLOR vec3(0.85, 0.75, 0.5)
        vec3 h = normalize(o + l);
        float ndh = clamp(dot(n, h), 0.0, 1.0);
        float spec = pow(ndh + 0.02, 64.0) * 0.1;

        color = c * toon + SPEC_COLOR * spec;
    }

    // add simple fog
    #define FOG_DIST 2.5
    #define FOG_DENSITY 0.32
    #define FOG_COLOR vec3(0.35, 0.37, 0.42)
    color = mix(FOG_COLOR, color, clamp(pow(FOG_DIST / abs(d), FOG_DENSITY), 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0);
}
`;
