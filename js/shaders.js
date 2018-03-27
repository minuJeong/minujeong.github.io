
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

    float t = T * 0.05;
    float ofs = (t - floor(t));

    float lat = atan(N.z, N.x) / (pi * 2.0) + ofs;
    float lon = N.y * 0.5 + 0.5;
    vec3 envColor = texture2D(ENV, abs(vec2(lat + 0.5, lon))).xyz * 1.0;

    float fresnel = 1.0 - max(dot(N, V), 0.0);
    vec3 diff = pow(envColor + vec3(0.45, 0.33, 0.55), vec3(4.0, 6.0, 3.0));
    vec3 ambient = mix(abs(vec3(N.z, N.y, N.x) * localN), abs(localN), 1.0 - ndh);
    vec3 rim = vec3(cos(T) * 0.5 + 1.5, 0.5, sin(T) * 0.5 + 1.5) * pow(fresnel, cos(T) * 0.125 + 2.5);

    // gl_FragColor = vec4(diff, 1.0);
    gl_FragColor = vec4(mix(ambient, diff, ndl) + rim, 1.0);
}
`;
