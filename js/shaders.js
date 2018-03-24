let materials = {};
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
        value: new THREE.Vector3(0, 0, -1),
    }
};

let commonVertexShader = `
varying vec3 N;
varying vec3 localN;
void main()
{
    localN = normal;
    N = normalMatrix * localN;
    vec3 pos = position;
    vec4 wpos = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_Position = wpos;
}
`;

let commonFragmentShader = `
uniform float T;
uniform vec3 L;
uniform vec3 V;
varying vec3 N;
varying vec3 localN;
void main()
{
    vec3 H = (L - V) * 0.5;
    float ndl = dot(N, L);
    float ndh = dot(N, H);
    float fresnel = 1.0 - max(dot(N, -V), 0.0);
    vec3 diff = mix(vec3(0.84, 0.42, 0.15), localN * localN, 0.5);
    vec3 spec = vec3(1.0, 1.0, 1.0) * pow(ndh, 32.0);
    vec3 ambient = mix(abs(vec3(N.z, N.y, N.x) * localN), abs(localN), 1.0 - ndh);
    vec3 rim = vec3(cos(T) * 0.5 + 1.5, 0.5, sin(T) * 0.5 + 1.5) * pow(fresnel, cos(T) * 0.125 + 2.5);
    gl_FragColor = vec4(mix(ambient, diff + spec, ndl) + rim, 1.0);
}
`;
