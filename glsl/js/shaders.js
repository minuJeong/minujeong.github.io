
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
#define MARCHING_CLAMP 0.000001
#define NRM_OFS 0.001
#define AO_OFS 0.01
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

float world_sub_1(vec3 pt, inout vec3 color)
{
    float ct = cos(T * 4.0);
    float st = sin(T * 4.0);
    float ct2 = cos(T * 0.75);

    vec3 pry = rotate(pt, vec3(0.0, 0.5 * PI, 0.0));
    vec3 prz = rotate(pt, vec3(0.0, 0.0, 0.5 * PI));

    float cy = capsule(pry, vec3(0, 2.0, 0), vec3(0, -2.0, 0), 0.25);
    float c3 = cylinder(prz, vec3(0, 0, 0.25));
    float cz = capsule(pt, vec3(0, 0, -2.0), vec3(0, 0, 2.0), 0.25);
    float c = max(blend(blend(cy, cz, 0.25), c3, 0.25), box(pt, vec3(ct * 0.5 + 2.0, 2.5, 2.5)));

    vec3 pr = translate(pt, vec3(2.0 * ct2, 0.45 * (ct - st), 0.45 * (ct + st)));
    vec3 pg = translate(pt, vec3(0.45 * (ct - st), 2.0 * ct2, 0.45 * (ct + st)));
    vec3 pb = translate(pt, vec3(0.45 * (ct + st), 0.45 * (ct - st), 2.0 * ct2));
    float sx = sphere(pr, 0.3);
    float sy = sphere(pg, 0.3);
    float sz = sphere(pb, 0.3);
    float s = blend(blend(sx, sy, 0.25), sz, 0.25);

    color += vec3(1.0, 1.0, 1.0) * max(vec3(c) - vec3(sx, sy, sz), vec3(0.0));
    color = normalize(color);

    return blend(c, s, 0.25);
}

float world_sub_2(vec3 pt, inout vec3 color)
{
    return sphere(pt, 0.5);
}

float world(vec3 p, inout vec3 color)
{
    float a = mod(T * 0.25, PI * 2.0);
    vec3 pt = rotate(p, vec3(cos(T) * 0.1 - 0.2 * PI, a, 0));

    float w1 = world_sub_1(pt, color);
    float w2 = world_sub_2(pt, color);
    return mix(
        w1,
        blend(w1, w2, 0.9),
        cos(T * 2.0) * 0.5 + 0.5
    );
}

vec3 norm(vec3 p)
{
    vec2 o = vec2(NRM_OFS, 0.0);
    vec3 c = vec3(0);  // not used for normal calc
    return normalize(vec3(
        world(p + o.xyy, c) - world(p - o.xyy, c),
        world(p + o.yxy, c) - world(p - o.yxy, c),
        world(p + o.yyx, c) - world(p - o.yyx, c)
    ));
}

float raymarch(vec3 o, vec3 r, inout vec3 c)
{
    float t = 0.0;
    vec3 p = vec3(0, 0, 0);
    float d = 0.0;
    for (int i = 0; i < MARCHING_STEPS; i++)
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

float ambient_occlusion(vec3 p, vec3 n, inout vec3 c)
{
    return 1.0 - abs(world(p, c) - world(p + n, c));
}

void main()
{
    vec3 o = vec3(0, 0, -7.0);
    vec3 r = normalize(vec3(v_uv - 0.5, 1.001));
    vec3 l = normalize(L);
    vec3 c = vec3(0.95, 0.9, 1.0);

    float d = raymarch(o, r, c);
    if (d < FAR)
    {
        vec3 h = normalize(r + l);

        vec3 p = o + r * d;
        vec3 n = norm(p);
        c = c + vec3(1.0) * (p.y * 0.2);

        float ao = ambient_occlusion(p, n, c);

        float ndh = dot(n, h);

        float lambert = clamp(dot(n, l), -1.0, 1.0);
        lambert = mix(lambert, 0.3, ao);

        vec3 spec = pow(ndh, 4.0) * vec3(1.0);
        gl_FragColor = vec4(
            c * lambert + (rotate(n, vec3(mod(T, 2.0 * PI)))) * 0.02 + spec,
            1.0
        );
    }
    else
    {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
`;
