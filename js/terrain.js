
class TERRAIN extends THREE.Object3D
{
    constructor()
    {
        super();

        let geom = new THREE.PlaneGeometry(40, 40, 256, 256)
        let rotateX = new THREE.Euler(-Math.PI * 0.5, 0, 0);
        geom.vertices.map((v)=>
        {
            v.applyEuler(rotateX);
            v.y = Math.random() * 0.25 - 0.125;
        });
        geom.computeVertexNormals();
        let mesh = new THREE.Mesh(geom, materials.terrainMaterial);
        this.add(mesh);
    }
}
