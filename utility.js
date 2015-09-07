function listsceneobjects() {
  var viewer = document.getElementsByTagName('model-viewer')[0];

  console.log(viewer.scene.children);
}

function getsubobject() {
  var scenes = document.getElementsByTagName('model-viewer');

  var viewer = scenes[0];

  var obj = viewer.scene.getObjectByName("Demo STL");

  var nonbufferobj = new THREE.Geometry();

  nonbufferobj.fromBufferGeometry(obj.geometry);

  console.log("Faces " + nonbufferobj.faces.length);
  console.log("Vertices " + nonbufferobj.vertices.length);

  nonbufferobj.mergeVertices();

  console.log("Faces " + nonbufferobj.faces.length);
  console.log("Vertices " + nonbufferobj.vertices.length);

  console.log("Face 0: " + nonbufferobj.faces[0].a + "," + nonbufferobj.faces[0].b + "," + nonbufferobj.faces[0].c);

  var rfaces = nonbufferobj.faces;

  var vertset = {}
  var vertsetlength = 3;
  var lastvertsetlength = 0;
  var newfaces = [];

  vertset[rfaces[0].a] = 1;
  vertset[rfaces[0].b] = 1;
  vertset[rfaces[0].c] = 1;

  newfaces.push(rfaces[0]);

  for(var passes = 0; passes < 6; passes++) {
    for(var i = 1; i < rfaces.length; i++) {
      if(rfaces[i].a in vertset
        || rfaces[i].b in vertset
        || rfaces[i].c in vertset) {
          if(rfaces[i].a in vertset == false)
            vertsetlength++;
          if(rfaces[i].b in vertset == false)
            vertsetlength++;
          if(rfaces[i].c in vertset == false)
            vertsetlength++;

          if(newfaces.indexOf(rfaces[i]) < 0)  {
              newfaces.push(rfaces[i]);
              rfaces[i].color.set(0xffffff);
            }

          vertset[rfaces[i].a] = vertset[rfaces[i].a] != null ? vertset[rfaces[i].a] + 1 : 1;
          vertset[rfaces[i].b] = vertset[rfaces[i].b] != null ? vertset[rfaces[i].b] + 1 : 1;
          vertset[rfaces[i].c] = vertset[rfaces[i].c] != null ? vertset[rfaces[i].c] + 1 : 1;
        }
    }

    if(nonbufferobj.vertices.length == vertsetlength
      || lastvertsetlength == vertsetlength) {
      console.log("Break in pass " + passes);
      break;
    }
  }

  nonbufferobj.faces = newfaces;
  nonbufferobj.elementsNeedUpdate = true;

  var matsolid = new THREE.MeshPhongMaterial({ color: 0xff0000, shading: THREE.FlatShading });
  viewer.scene.add(new THREE.Mesh(nonbufferobj, matsolid));

  console.log("Newfaces " + newfaces.length);

}

function testexport() {
  // Unused, old code to be removed.
  var scenes = document.getElementsByTagName('model-viewer');

  var viewer = scenes[0];
  var meshes = [];

  console.log("Meshes: ");

  for(var i = 0; i < viewer.scene.children.length; i++) {
    if(viewer.scene.children[i] instanceof THREE.Mesh) {
      console.log("    " + viewer.scene.children[i].name);
      meshes.push(viewer.scene.children[i]);
    }
  }

  var faces = null, vertices = null;

  var nbogeometry = null;
  var mesh = meshes[0];

  if(mesh.geometry instanceof THREE.BufferGeometry) {
    nbogeometry = new THREE.Geometry();
    nbogeometry.fromBufferGeometry(mesh.geometry);
  } else if(mesh.geometry instanceof THREE.Geometry) {
    nbogeometry = mesh.geometry.clone();
  }

  var sizeofstl = 80+4+nbogeometry.faces.length*50;

  console.log("Size of style: " + sizeofstl);

  var stlbuffer = new dcodeIO.ByteBuffer(capacity=sizeofstl, littleEndian=true);
  var headerstring = "TamarinTech Model-Viewer STL Exporter: " + mesh.name;

  stlbuffer.writeUTF8String(headerstring);
  stlbuffer.skip(80 - headerstring.length);

  stlbuffer.writeUint32(nbogeometry.faces.length);

  for(var facei = 0; facei < nbogeometry.faces.length; facei++) {
    face = nbogeometry.faces[facei];
    stlbuffer.writeFloat32(0); // Normal a
    stlbuffer.writeFloat32(0); // Normal b
    stlbuffer.writeFloat32(0); // Normal c

    nbogeometry.vertices[face.a].applyMatrix4(mesh.matrix);
    stlbuffer.writeFloat32(nbogeometry.vertices[face.a].x);
    stlbuffer.writeFloat32(nbogeometry.vertices[face.a].y);
    stlbuffer.writeFloat32(nbogeometry.vertices[face.a].z);

    nbogeometry.vertices[face.b].applyMatrix4(mesh.matrix);
    stlbuffer.writeFloat32(nbogeometry.vertices[face.b].x);
    stlbuffer.writeFloat32(nbogeometry.vertices[face.b].y);
    stlbuffer.writeFloat32(nbogeometry.vertices[face.b].z);

    nbogeometry.vertices[face.c].applyMatrix4(mesh.matrix);
    stlbuffer.writeFloat32(nbogeometry.vertices[face.c].x);
    stlbuffer.writeFloat32(nbogeometry.vertices[face.c].y);
    stlbuffer.writeFloat32(nbogeometry.vertices[face.c].z);
    stlbuffer.writeUint16(0); // Attribute
  }

  nbogeometry.dispose();

  stlbuffer.flip();

  var a = document.createElement('a');
  var stlblob = new Blob([stlbuffer.toArrayBuffer()], {type: "octet/stream"});
  a.href = window.URL.createObjectURL(stlblob);
  a.download = mesh.name + ".stl";
  a.click();
}
