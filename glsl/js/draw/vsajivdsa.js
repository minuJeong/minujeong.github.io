// fragment shader
window.frag =
`
struct Material
{
    vec3 diffuse_color;
    float specular_intensity;
};

void pelvis(inout vec3 p, inout Material m, inout float d)
{

}

void spine(inout vec3 p, inout Material m, inout float d)
{
    #define NUM_SPINES 8
    #define SPINE_ANGLE_STEP 0.08
    #define SPINE_DIST_STEP vec3(0.0, 0.17, 0.0)
    #define SPINE_ANGLE_INIT -0.4
    #define SPINE_RADIUS 0.07
    #define SPINE_BLENDER 0.075

    float r = FAR;
    float x_angle = SPINE_ANGLE_INIT;
    for (int i = 0; i < NUM_SPINES; i++)
    {
        x_angle += SPINE_ANGLE_STEP;

        p = translate(
            p, rotate(SPINE_DIST_STEP, vec3(x_angle, 0.0, 0.0))
        );

        r = blend(
            sphere(p, SPINE_RADIUS),
            r,
            SPINE_BLENDER
        );
    }

    if (r < MARCHING_CLAMP)
    {
        m.specular_intensity = 2.0;
        m.diffuse_color = vec3(0.8, 0.6, 0.4);
    }
    d = min(d, r);
}

void rib(inout vec3 p, inout Material m, inout float d)
{
    vec3 right_rib_pos = translate(p, vec3(+0.18, -0.15, -0.124));
    vec3 left_rib_pos = translate(p, vec3(-0.18, -0.15, -0.124));

    float right_rib_dist = blend(
            sphere(right_rib_pos, 0.16),
            sphere(right_rib_pos - vec3(+0.03, -0.46, 0.03), 0.08),
            0.6
        );
    float left_rib_dist = blend(
            sphere(left_rib_pos, 0.16),
            sphere(left_rib_pos - vec3(-0.03, -0.46, 0.03), 0.08),
            0.6
        );

    float r = min(right_rib_dist, left_rib_dist);
    if (r < MARCHING_CLAMP)
    {
        m.specular_intensity = 0.2;
        m.diffuse_color = vec3(0.2, 0.2, 0.4);
    }

    d = blend(d, r, 0.025);
}

void clavicle(inout vec3 p, inout Material m, inout float d)
{
    vec3 r = p - vec3(+0.04, -0.05, -0.32);
    vec3 l = p - vec3(-0.04, -0.05, -0.32);

    float rcd = blend(
        sphere(r, 0.04),
        sphere(r - vec3(+0.25, 0.06, 0.1), 0.03),
        0.42);

    float lcd = blend(
        sphere(l, 0.04),
        sphere(l - vec3(-0.25, 0.06, 0.1), 0.03),
        0.42);

    float cd = min(rcd, lcd);

    if (cd < MARCHING_CLAMP)
    {
        m.specular_intensity = 0.0;
        m.diffuse_color = vec3(0.2, 0.3, 0.1);
    }

    d = min(d, cd);
}

void body(inout vec3 p, inout Material m, inout float d)
{
    pelvis(p, m, d);
    spine(p, m, d);
    rib(p, m, d);
    clavicle(p, m, d);
}

// p: sample position
float world(vec3 p, inout Material m)
{
    // floor
    vec3 floor_pos = translate(p, vec3(0.0, -1.0, 0.0));
    float d = box(floor_pos, vec3(5.0, 0.1, 5.0));
    if (d < MARCHING_CLAMP)
    {
        m.specular_intensity = 0.0;
        m.diffuse_color = vec3(pow(p.xy / 10.0, vec2(2.0)), 0.0);
    }

    // body
    body(p, m, d);

    return d;
}

// p: sample surface
vec3 norm(vec3 p)
{
    Material m;

    vec2 o = vec2(NRM_OFS, 0.0);
    return normalize(vec3(
        world(p + o.xyy, m) - world(p - o.xyy, m),
        world(p + o.yxy, m) - world(p - o.yxy, m),
        world(p + o.yyx, m) - world(p - o.yyx, m)
    ));
}

// o: origin
// r: ray
// c: color
float raymarch(vec3 o, vec3 r, inout Material m)
{
    float t = 0.0;
    vec3 p = vec3(0);
    float d = 0.0;
    for (int i = MARCHING_MINSTEP; i < MARCHING_STEPS; i++)
    {
        p = o + r * t;
        d = world(p, m);
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
    float rotation = T * 0.15 + INPUT.x * 4.0;

    // o: origin
    vec3 o = vec3(0, 1, -6.0);
    o = rotate(o, vec3(0, rotation, 0));

    // r: ray
    vec3 r = normalize(vec3(v_uv - vec2(0.5 * aspect, 0.5), 1.001));
    r = rotate(r, vec3(0, rotation, 0));

    // l: light
    vec3 l = normalize(L);

    Material m;

    // d: distance
    float d = raymarch(o, r, m);

    // pixel color
    vec3 color = vec3(0);
    if (d < FAR)
    {
        vec3 p = o + r * d;
        vec3 n = norm(p);

        float lambert = dot(n, l);
        lambert = clamp(lambert, 0.0, 1.0);

        #define SPEC_COLOR vec3(0.95, 0.95, 0.95)
        vec3 h = normalize(l - r);
        float ndh = clamp(dot(n, h), 0.0, 1.0);
        float ndv = clamp(dot(n, -o), 0.0, 1.0);
        float spec = pow((ndh + ndv) + 0.01, 128.0) * m.specular_intensity;

        vec3 ambient = vec3(0.04, 0.04, 0.09);

        color = max(ambient, m.diffuse_color * lambert + SPEC_COLOR * spec);
    }

    // add simple fog
    #define FOG_DIST 2.5
    #define FOG_DENSITY 0.32
    #define FOG_COLOR vec3(0.35, 0.37, 0.42)
    color = mix(FOG_COLOR, color, clamp(pow(FOG_DIST / abs(d), FOG_DENSITY), 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0);
}
`;