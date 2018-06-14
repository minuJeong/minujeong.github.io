
// vertex shader
let basic_vert =
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

let frag_lib =
`
#define FAR 80.0
#define MARCHING_MINSTEP 0
#define MARCHING_STEPS 128
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

float plane(vec3 p, float h)
{
    return abs(p.y - h);
}

// a: primitive a
// b: primitive b
// k: blending amount
float blend(float a, float b, float k)
{
    float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
    return mix(a, b, h) - k * h * (1.0 - h);
}
`;
