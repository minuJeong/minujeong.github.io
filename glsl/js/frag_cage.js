// fragment shader
window.frag =
`
// p: sample position
float world(vec3 p, inout vec3 color)
{
    #define CAMERA_ROTATION_SPEED 0.025
    float a = mod(T * CAMERA_ROTATION_SPEED, PI * 2.0);
    vec3 pt = rotate(p, vec3(
            -0.35 - M.y * PI * 0.25 - INPUT.y,
            a - M.x * PI * 0.25 + INPUT.x,
            cos(T * 0.25) * 0.1
        ));

    #define TIME_SCALE_1 3.0
    #define TIME_SCALE_2 0.25
    float ct = cos(T * TIME_SCALE_1);
    float st = sin(T * TIME_SCALE_1);
    float ct2 = cos(T * TIME_SCALE_2);

    #define CAPSULE_RAD 0.05
    #define TILE_CAPSULES 2.0
    #define FRAME_CLAMP FAR
    vec3 tilept = tile(pt, vec3(TILE_CAPSULES));
    float cx = capsule(tilept, vec3(-2.0, 0, 0), vec3(+2.0, 0, 0), CAPSULE_RAD);
    float cy = capsule(tilept, vec3(0, +2.0, 0), vec3(0, -2.0, 0), CAPSULE_RAD);
    float cz = capsule(tilept, vec3(0, 0, -2.0), vec3(0, 0, +2.0), CAPSULE_RAD);
    float c = max(min(min(cy, cz), cx), box(pt, vec3(FRAME_CLAMP)));
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

    #define JOINT_SPHERE_RAD 0.2
    float joint_sphere = sphere(tile(pt, vec3(TILE_CAPSULES)), JOINT_SPHERE_RAD);
    if (c > joint_sphere && joint_sphere < MARCHING_CLAMP)
    {
        color += vec3(0.5, 0, 0);
    }
    return min(c, joint_sphere);
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
        #define LAM_MIN 0.125
        float toon = clamp(pow(2.0 * lambert, TOON_POWER), LAM_MIN, 1.0);

        #define SPEC_COLOR vec3(0.85, 0.75, 0.5)
        vec3 h = normalize(o + l);
        float ndh = clamp(dot(n, h), 0.0, 1.0);
        float ndv = clamp(dot(n, -o), 0.0, 1.0);
        float spec = pow((ndh + ndv) + 0.01, 64.0) * 0.25;

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
