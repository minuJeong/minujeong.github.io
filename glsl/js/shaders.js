
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

uniform vec3 L;
uniform float T;

varying vec2 v_uv;

vec3 translate(vec3 p, vec3 o)
{
    return p - o;
}

float sphere(vec3 p, float r)
{
    return length(p) - r;
}

float world(vec3 p)
{
    float head = sphere(translate(p, vec3(0.1, 0.5, 0.1)), 0.5);

    return head;
}

vec3 norm(vec3 p)
{
    vec2 o = vec2(0.001, 0.0);
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
        if (abs(d) < 0.01)
        {
            return t;
        }
        t += d;
    }
    return FAR;
}

void main()
{
    vec3 o = vec3(0, 0, -5.0);
    vec3 r = normalize(vec3(v_uv - 0.5, 1.1));
    vec3 l = normalize(L);

    float d = raymarch(o, r);
    if (d < FAR)
    {
        vec3 n = norm(o + r * d);
        float lambert = 1.0 - clamp(dot(n, l), -1.0, 0.0);
        gl_FragColor = vec4(lambert * 0.5, 0.5, 0.5, 1.0);
    }
    else
    {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.5);
    }
}
`;
