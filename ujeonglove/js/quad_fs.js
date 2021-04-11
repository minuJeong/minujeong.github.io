"use strict"

const FS = `
precision mediump float;

#define PI 3.141592
#define FAR 1000.0
#define NEAR 0.002
#define ZERO vec3(0.0, 0.0, 0.0)
#define UP vec3(0.0, 1.0, 0.0)
#define STEPS 128

varying vec4 vs_pos;
uniform float u_time;
uniform vec2 u_resolution;

float dot2(vec2 v) { return dot(v, v); }

float hash(vec3 p)
{
    return fract(cos(dot(p, vec3(4.44, 12.44, 56.332))) * 43444.05);
}

vec2 mod_polar(vec2 p, float repetitions)
{
    float angle = 2.0 * PI / repetitions;
    float a = atan(p.y, p.x) + angle/2.;
    float r = length(p);
    float c = floor(a/angle);
    a = mod(a,angle) - angle/2.0;
    return vec2(cos(a), sin(a)) * r;
}

vec3 mod_xyz(vec3 p, vec3 size)
{
    vec3 c = floor((p + size*0.5)/size);
    return mod(p + size*0.5, size) - size * 0.5;
}

float smin(float a, float b, float k)
{
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float smax(float a, float b, float r)
{
    vec2 u = max(vec2(r + a,r + b), vec2(0.0, 0.0));
    return min(-r, max (a, b)) + length(u);
}

float sdf_heart(vec2 p)
{
    p.x = abs(p.x);

    float xy = p.x + p.y;

    if(xy > 1.0)
    {
        return sqrt(dot2(p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
    }

    return sqrt(min(
        dot2(p - vec2(0.0, 1.0)),
        dot2(p - 0.5 * max(xy, 0.0))
    )) * sign(p.x - p.y);
}

float sdf_sphere(vec3 p, float rad)
{
    return length(p) - rad;
}

float sdf_cone( in vec3 p, in vec2 cs, float h )
{
  vec2 q = h * vec2(cs.x / cs.y, -1.0);
    
  vec2 w = vec2( length(p.xz), p.y );
  vec2 a = w - q*clamp( dot(w,q)/dot(q,q), 0.0, 1.0 );
  vec2 b = w - q*vec2( clamp( w.x/q.x, 0.0, 1.0 ), 1.0 );
  float k = sign( q.y );
  float d = min(dot( a, a ),dot(b, b));
  float s = max( k*(w.x*q.y-w.y*q.x),k*(w.y-q.y)  );
  return sqrt(d)*sign(s);
}


float world(vec3 p)
{
    float progress = u_time * 0.0005;
    float c = cos(progress);
    float s = sin(progress);
    p.xz = mat2(c, s, -s, c) * p.xz;

    vec3 q = p;
    vec3 size = vec3(1.5, 2.0, 0.25);
    p = mod_xyz(p, size);
    p.y += 1.0;
    float rand = hash(floor(q / size));

    float cap_0 = dot(p, vec3(0.0, 0.0, -1.0)) + 0.025;
    float cap_1 = dot(p, vec3(0.0, 0.0, +1.0)) + 0.025;
    float cap = min(cap_0, cap_1);

    float d = sdf_heart(p.xy);
    d = abs(d) - 0.015;
    d = smax(d, -cap, 0.02);

    return d;
}

float march(vec3 o, vec3 r)
{
    vec3 p;
    float t, d;
    for (int i = 0; i < STEPS; i++)
    {
        p = o + r * t;
        d = world(p);
        if (d < NEAR || t > FAR) { break; }
        t += d;
    }
    return t;
}

mat3 lookat(vec3 fr, vec3 t)
{
    vec3 f = normalize(t - fr);
    vec3 r = cross(f, UP);
    vec3 u = cross(r, f);
    return mat3(r, u, f);
}

vec3 normalat(vec3 p)
{
    vec2 e = vec2(0.0002, 0.0);
    return normalize(world(p) - vec3(
        world(p - e.xyy),
        world(p - e.yxy),
        world(p - e.yyx)
    ));
}

void main()
{
    vec2 uv = vs_pos.xy;
    uv.x /= u_resolution.y / u_resolution.x;

    vec3 rgb = vec3(0.2 - (uv.y * 0.12));

    vec3 o = vec3(2.5, 1.3, -2.5);
    vec3 r = lookat(o, vec3(0.0, 0.25, 0.0)) * normalize(vec3(uv, 1.0));

    float t = march(o, r);
    if (t < FAR)
    {
        vec3 P = o + r * t;
        vec3 N = normalat(P);

        vec3 light_pos = vec3(5.0, 8.0, -3.0);
        vec3 L = normalize(light_pos - P);

        vec3 V = normalize(r);
        vec3 H = normalize(V + L);

        float lambert = dot(N, L);
        lambert = max(lambert, 0.1);

        vec3 lit = vec3(0.98, 0.24, 0.33) * lambert + vec3(0.03, 0.04, 0.24) * (1.0 - lambert);
        lit = mix(lit, vec3(0.125), clamp((t / (FAR / 12.0)), 0.0, 1.0));

        rgb.xyz = lit;
    }

    gl_FragColor = vec4(rgb, 1.0);
}`