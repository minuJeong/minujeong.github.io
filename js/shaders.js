shaders = {
    PNVVertex: `
    uniform vec3 L;
    varying vec3 P, N, V, LV;
    void main()
    {
        vec3 pos = position;
        vec4 wpos = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        P = wpos.xyz;
        N = normalMatrix * normal;
        V = normalize(cameraPosition - P);
        LV = normalize(P - L);
        gl_Position = wpos;
    }

    `,

    PawnFrag: `
    uniform float T;
    uniform vec3 L, C;
    uniform sampler2D ENV;
    varying vec3 P, N, V, LV;
    void main()
    {

        float pi = 3.14159265358;
        vec3 H = (LV + V) * 0.5;
        float ndl = dot(N, LV);
        float ndh = dot(N, H);
        float ndv = dot(N, -V);

        float u = atan(N.z, N.x) / (pi * 2.0) + ((P.x + P.z) / 50.0);
        float v = N.y * 0.5 + 0.5;
        vec3 env = texture2D(ENV, vec2(u, v)).xyz * 1.0;

        float tofs = cos(T * 6.0) * 0.05 + 0.05;
        vec3 mid = max(vec3(0.4, 0.4, 0.4), C);
        mid.x += tofs;
        vec3 dark = vec3(0.15, 0.10, 0.15);
        vec3 diffuse = mix(mid, dark, 1.0 - (pow(ndl, 2.0) * sign(ndl)));

        float fresnel = 1.0 - ndv;
        vec3 ref = 2.0 * ndl * N - LV;
        float spec = pow(clamp(dot(ref, V), 0.0, 1.0), 16.0);
        vec3 reflected = env * (max(spec, fresnel));

        gl_FragColor = vec4(diffuse + reflected, 1.0);
    }

    `,
}