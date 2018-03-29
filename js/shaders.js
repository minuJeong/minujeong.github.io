
let commonVertexShader = `
varying vec3 P, N;
void main()
{
    vec3 localN = normal;
    N = normalMatrix * localN;
    vec3 pos = position;
    vec4 wpos = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    P = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = wpos;
}
`;

let commonFragmentShader = `
uniform float T;
uniform vec3 L, V, C;
uniform sampler2D ENV;
varying vec3 P, N;
void main()
{
    float pi = 3.14159265358;
    vec3 H = (L + V) * 0.5;
    float ndl = dot(N, L);
    float ndh = dot(N, H);
    float ndv = dot(N, V);

    float u = atan(N.z, N.x) / (pi * 2.0) + ((P.x + P.z) / 50.0);
    float v = N.y * 0.5 + 0.5;
    vec3 env = texture2D(ENV, vec2(u, v)).xyz * 1.0;

    float tofs = cos(T * 6.0) * 0.05 + 0.05;
    vec3 mid = max(vec3(0.4, 0.4, 0.4), C);
    mid.x += tofs;
    vec3 dark = vec3(0.05, 0.05, 0.05);
    vec3 diffuse = mix(mid, dark, 1.0 - pow(ndl, 2.0));

    float fresnel = 1.0 - ndv;
    vec3 ref = 2.0 * dot(N, L) * N - L;
    float rim = pow(clamp(fresnel, 0.0, 1.0), 0.5) * 0.09;
    float spec = pow(clamp(dot(ref, V), 0.0, 1.0), 3.0);
    vec3 reflected = env * (max(spec, rim));

    gl_FragColor = vec4(diffuse + reflected, 1.0);
}
`;

let terrainVertexShader = `
uniform vec3 L;
varying float r;
varying vec3 P;
void main()
{
    vec3 N = normalize(normalMatrix * normal);
    r = dot(N, L);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    P = position;
}
`;

let terrainFragmentShader = `
varying float r;
varying vec3 P;
void main()
{
    vec3 color = vec3(0.5, 0.45, 0.75);
    color.x += P.y * 10.0;
    gl_FragColor = vec4(color * r, 1.0);
}
`;