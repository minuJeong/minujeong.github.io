const SHADERS = {
vsSource:
`
attribute vec4 aVertexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying vec4 p;
void main()
{
    p = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    gl_Position = p;
}
`,

fsSource:
`
varying vec4 p;
void main()
{
    gl_FragColor = vec4(p.xyz, 1.0);
}
`
};
