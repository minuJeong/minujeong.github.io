
const NUM = 100;
const ALLOC = NUM * (4 ** 2);

let random_data = new Float32Array(ALLOC);
for (let i = 0; i < ALLOC; i++)
{
    if (i % 3 == 0)
    {
        random_data[i] = 0;
    }else{
        random_data[i] = Math.random() * 10.0 - 5.0;
    }
}

let b_pos = new blink.Buffer({
    data: random_data,
    type: blink.FLOAT,
    vector: 4
});

let b_vel = new blink.Buffer({
    data: random_data,
    type: blink.FLOAT,
    vector: 4
});

let bo_pos = new blink.Buffer({
    data: random_data,
    type: blink.FLOAT,
    vector: 4
});

let kernal_program =
`
void main()
{
    outp = texture(in_p, bl_UV) + texture(in_v, bl_UV);
}
`;

let kernel = new blink.Kernel({
    input: {
        in_p: b_pos,
        in_v: b_vel,
    },
    output: {
        outp: bo_pos
    }
}, kernal_program);
kernel.exec();

console.log(b_pos);
console.log(b_vel);
console.log(bo_pos);

defaultUniforms.posBuffer = {
    bo_pos
};
console.log(defaultUniforms);

window.frag = `

layout(std140) posBuffer;

void main()
{
    gl_FragColor = vec4(0.5, 0, 0, 1.0);
}
`;
