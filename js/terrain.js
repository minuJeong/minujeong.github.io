
class TERRAIN extends THREE.Object3D
{
    constructor()
    {
        super();

        let w = 128, h = 128;
        let geom = new THREE.PlaneGeometry(40, 40, w, h)
        let rotateX = new THREE.Euler(-Math.PI * 0.5, 0, 0);
        for (var i = geom.vertices.length - 1; i >= 0; i--)
        {
            let x = i % w;
            let y = Math.floor(i / w);
            let v = geom.vertices[i];
            v.applyEuler(rotateX);
        }
        geom.computeVertexNormals();
        let mesh = new THREE.Mesh(geom, materials.terrainMaterial);
        this.add(mesh);
    }
}
