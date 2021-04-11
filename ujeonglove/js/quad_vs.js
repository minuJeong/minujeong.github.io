"use strict"

const VS = `
attribute vec4 in_pos;

varying vec4 vs_pos;

void main()
{
    vs_pos = in_pos;
    gl_Position = in_pos;
}
`