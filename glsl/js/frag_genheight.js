// fragment shader
window.frag =
`

// height base terrain
float terrain(vec2 xz)
{
    if(length(xz) > 2.0)
    {
        return 0.0;
    }
    return dot(sin(xz.x), cos(xz.y));
}

// p: sample surface
vec3 surface_normal(vec3 p)
{
    vec2 o = vec2(NRM_OFS, 0.0);
    return normalize(vec3(
        terrain(p.xz + o.xy) - terrain(p.xz - o.xy),
        2.0 * o.x,
        terrain(p.xz + o.yy) - terrain(p.xz - o.yy)
    ));
}

// o: origin
// r: ray
// c: color
float ray_terrain(vec3 o, vec3 r, inout vec3 color)
{
    float t = 0.0;
    vec3 p = vec3(0);
    for (int i = MARCHING_MINSTEP; i < MARCHING_STEPS; i++)
    {
        t += 0.001;
        p = o + r * t;
        if (p.y < terrain(p.xz))
        {
            color += vec3(0.1, 0.0, 0.5);
            return t;
        }
        
    }
    return FAR;
}

void main()
{
    vec3 o = vec3(0, -5, -10.0);

    /*
    // hatch mask
    if (step(mod((-v_uv.x + v_uv.y), 0.008), 0.004) < 0.0001)
    {
        gl_FragColor = vec4(0);
        return;
    }
    */

    vec3 color = vec3(0);

    vec3 r = normalize(vec3(v_uv - vec2(0.5 * aspect, 0.5), 1.01));
    vec3 l = normalize(vec3(5, 1, 0));
    float d = ray_terrain(o, r, color);
    if (d < FAR)
    {
        vec3 n = surface_normal(o + r * d);
        float ndl = dot(n, l);
        color *= ndl;
    }
    else
    {
        color = vec3(0, 0, 1);
    }

    // add simple fog
    #define FOG_DIST 2.5
    #define FOG_DENSITY 0.32
    #define FOG_COLOR vec3(0.35, 0.37, 0.42)
    color = mix(FOG_COLOR, color, clamp(pow(FOG_DIST / abs(d), FOG_DENSITY), 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0);
}
`;