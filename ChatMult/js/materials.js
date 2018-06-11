
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
        value: new THREE.Vector3(0.0, 0.0, 0.0),
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

let playerUniform = {
    C:
    {
        type: 'v3',
        value: new THREE.Vector3(1.0, 1.0, 1.0)
    }
};

let otherPlayerUniform = {
    C:
    {
        type: 'v3',
        value: new THREE.Vector3(1.0, 1.0, 1.0)
    }
};

// materials
materials.playerMaterial = new THREE.ShaderMaterial({
    uniforms: Object.assign(playerUniform, baseUniform),
    vertexShader: shaders.PNVVertex,
    fragmentShader: shaders.PawnFrag,
});

materials.otherPlayerMaterial = new THREE.ShaderMaterial({
    uniforms: Object.assign(otherPlayerUniform, baseUniform),
    vertexShader: shaders.PNVVertex,
    fragmentShader: shaders.PawnFrag,
});

materials.terrainMaterial = new THREE.MeshStandardMaterial({
     color: 0x506050,
     roughness: 1.0,
});

materials.playerMaterial.uniforms.C.value.set(1, 0, 0);
materials.otherPlayerMaterial.uniforms.C.value.set(0, 0, 1);
