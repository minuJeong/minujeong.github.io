
////////////////////////////////////////
// vert
let vert =
`
varying vec2 v_uv;
void main()
{
    // use UV value to generate ray
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

////////////////////////////////////////
// frag
let frag =
`
#define FAR 80.0
#define MARCHING_STEPS 128
#define MARCHING_CLAMP 0.0001
#define NRM_OFS 0.002
#define PI 3.141592

uniform vec3 L;
uniform float T;

varying vec2 v_uv;

// transforms
vec3 translate(vec3 p, vec3 o)
{
    return p - o;
}

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

// dist funcs
float sphere(vec3 p, float r)
{
    return length(p) - r;
}

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

float clamp_cylinder(vec3 p, vec3 c, vec3 b)
{
    return max(cylinder(p, c), box(p, b));
}

// blendings
float blend(float a, float b, float k)
{
    float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
    return mix(a, b, h) - k * h * (1.0 - h);
}

float world(vec3 p)
{
    float a = mod(T, PI * 2.0);
    p = rotate(p, vec3(-0.2 * PI, a, 0));

    vec3 pry = rotate(p, vec3(0.0, 0.5 * PI, 0.0));
    vec3 prz = rotate(p, vec3(0.0, 0.0, 0.5 * PI));

    float cy = capsule(pry, vec3(0, 1.0, 0), vec3(0, -1.0, 0), 0.25);
    float c3 = cylinder(prz, vec3(0, 0, 0.25));
    float cz = capsule(p, vec3(0, 0, -1.0), vec3(0, 0, 1.0), 0.25);
    float c = max(blend(blend(cy, cz, 0.25), c3, 0.25), box(p, vec3(1, 1.5, 1.5)));

    vec3 p2 = rotate(translate(p, vec3(0.35, 1, 0.35)), vec3(a, 0, 0));
    float s = sphere(p2, 0.25);

    return blend(c, s, 0.25);
}

vec3 norm(vec3 p)
{
    vec2 o = vec2(NRM_OFS, 0.0);
    return normalize(vec3(
        world(p + o.xyy) - world(p - o.xyy),
        world(p + o.yxy) - world(p - o.yxy),
        world(p + o.yyx) - world(p - o.yyx)
    ));
}

float raymarch(vec3 o, vec3 r)
{
    float t = 0.0;
    vec3 p = vec3(0, 0, 0);
    float d = 0.0;
    for (int i = 0; i < MARCHING_STEPS; i++)
    {
        p = o + r * t;
        d = world(p);
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
    vec3 o = vec3(0, 0, -10.0);
    vec3 r = normalize(vec3(v_uv - 0.5, 1.001));
    vec3 l = normalize(L);

    float d = raymarch(o, r);
    if (d < FAR)
    {
        vec3 n = norm(o + r * d);
        float lambert = clamp(dot(n, l), -1.0, 1.0);
        gl_FragColor = vec4(vec3(1.0, 1.0, 1.0) * lambert, 1.0);
    }
    else
    {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.5);
    }
}
`;
