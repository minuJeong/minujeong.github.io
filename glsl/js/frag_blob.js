window.frag = `
float displacement(vec3 p, float freq, float scale)
{
    return (sin(p.x * freq) * sin(p.y * freq) * sin(p.z * freq)) * scale;
}

float world(vec3 p, inout vec3 c)
{
    float radius = cos(T * 2.0) * 0.2 + 2.3;
    float centerSphere = sphere(p, radius);
    float timescaledDisplacement = pow(abs(cos(T * 6.0) * 0.3), 1.75);
    float displacedSphere = centerSphere + displacement(p, 8.5, timescaledDisplacement);

    float a = mod(T, PI * 2.0);
    vec3 p2 = tile(p, vec3(0.9));
    float blob = sphere(p2, 0.05);
    blob = max(sphere(p, radius * 1.1), blob);
    float blobBlended = blend(displacedSphere, blob, 0.35);
    return blobBlended;
}

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

void main()
{
    vec3 o = vec3(0, 1, -15.0);
    vec3 r = normalize(vec3(v_uv - vec2(0.5 * aspect, 0.5), 1.001));
    vec3 l = normalize(L);
    vec3 c = vec3(0.15);
    float d = raymarch(o, r, c);
    if (d < FAR)
    {
        vec3 n = norm(o + r * d);
        gl_FragColor = vec4(n * 0.5 + vec3(0.5), 1.0);
    }
}
`;
