// fragment shader
window.frag =
`
vec3 albedo;

float terrain(vec3 p)
{
    float d = plane(p, 1.0);
    if (d < MARCHING_CLAMP)
    {
        albedo += vec3(0, 0, 0.1);
    }
    return d;
}

float world(vec3 p)
{
    return terrain(p);
    p -= vec3(0, -2, 0);

    float s = sphere(p - vec3(0, 7, 0), 0.5);
    if (s < MARCHING_CLAMP)
    {
        albedo += vec3(1.0, 0, 0);
    }

    float t = terrain(p);
    return min(s, t);
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
        float d = world(p + n * t);
        occusion += t - d;
        t += STEP;
    }
    return 1.0 - clamp(occusion, 0.0, 1.0);
}

// p: sample surface
vec3 surface_normal(vec3 p)
{
    vec2 o = vec2(NRM_OFS, 0.0);
    return normalize(vec3(
        world(p + o.xyy) - world(p - o.xyy),
        world(p + o.yxy) - world(p - o.yxy),
        world(p + o.yyx) - world(p - o.yyx)
    ));
}

// o: origin
// r: ray
// c: color
float raymarch(vec3 o, vec3 r)
{
    float t = 0.0;
    vec3 p = vec3(0);
    float d = 0.0;
    for (int i = MARCHING_MINSTEP; i < MARCHING_STEPS; i++)
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
    vec3 o = vec3(0, -5, -10.0);
    vec3 r = normalize(vec3(v_uv - vec2(0.5 * aspect, 0.5), 1.001));
    vec3 c = vec3(0);
    vec3 l = normalize(L);
    float d = raymarch(o, r);
    if (d < FAR)
    {
        vec3 n = surface_normal(o + r * d);
        float ndl = dot(n, l);
        gl_FragColor = vec4(albedo * ndl, 1.0);
    }
    else
    {
        gl_FragColor = vec4(0.0);
    }
}
`;