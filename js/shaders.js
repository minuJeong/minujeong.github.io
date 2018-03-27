
let materials = {};
let uniforms = {};
let envtex = null;
let baseUniform =
{
    T:
    {
        value: 0.0,
    },

    L:
    {
        type: 'v3',
        value: new THREE.Vector3(0.0, 1.0, 0.0),
    },

    V:
    {
        type: 'v3',
        value: new THREE.Vector3(0.0, 0.0, 1.0),
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

let otherPlayerUniform = {
    C:
    {
        type: 'v3',
        value: new THREE.Vector3(1.0, 1.0, 1.0)
    }
};

let playerUniform = {
    C:
    {
        type: 'v3',
        value: new THREE.Vector3(1.0, 1.0, 1.0)
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
    P = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = wpos;
}
`;

let commonFragmentShader = `
uniform float T;
uniform vec3 L, V, C;
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
