
let materials = {};
let envtex = null;
let uniforms =
{
    T:
    {
        value: 0.0,
    },

    L:
    {
        type: 'v3',
        value: new THREE.Vector3(0, 1, 0),
    },

    V:
    {
        type: 'v3',
        value: new THREE.Vector3(0, 0, 1),
    },

    ENV:
    {
        type: 't',
        get value()
        {
            if(envtex == null)
            {
                envtex = new THREE.TextureLoader().load("res/texture/env.jpg");
                envtex.wrapS = THREE.RepeatWrapping;
                envtex.wrapT = THREE.RepeatWrapping;
            }
            return envtex;
        }
    }
};

let commonVertexShader = `
varying vec3 P, N, localN;
varying vec2 UV;
void main()
{
    localN = normal;
    N = normalMatrix * localN;
    vec3 pos = position;
    vec4 wpos = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    UV = uv;
    P = wpos.xyz;
    gl_Position = wpos;
}
`;

let commonFragmentShader = `
uniform float T;
uniform vec3 L, V;
uniform sampler2D ENV;
varying vec3 P, N, localN;
varying vec2 UV;
void main()
{
    float pi = 3.14159265358;
    vec3 H = (L + V) * 0.5;
    float ndl = dot(N, L);
    float ndh = dot(N, H);
    float ndv = dot(N, V);

    float t = T * 0.05;
    float ofs = (t - floor(t));

    float lat = atan(N.z, N.x) / (pi * 2.0) + ofs;
    float lon = N.y * 0.5 + 0.5;
    vec3 env = texture2D(ENV, vec2(lat, lon)).xyz * 1.0;

    vec3 mid = vec3(0.5, 0.5, 0.5);
    vec3 dark = vec3(0.3, 0.33, 0.33);

    float fresnel = 1.0 - ndv;
    vec3 ref = 2.0 * dot(N, L) * N - L;
    float rim = pow(clamp(fresnel, 0.0, 1.0), 0.5) * 0.09;
    float spec = pow(clamp(dot(ref, V), 0.0, 1.0), 2.0);

    gl_FragColor = vec4(mix(mid, dark, 1.0 - ndl) + env * (max(spec, rim)), 1.0);
}
`;
