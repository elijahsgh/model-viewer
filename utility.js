function getsubobjectcount() {
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
            }

          vertset[rfaces[i].a] = vertset[rfaces[i].a] != null ? vertset[rfaces[i].a] + 1 : 1;
          vertset[rfaces[i].b] = vertset[rfaces[i].b] != null ? vertset[rfaces[i].b] + 1 : 1;
          vertset[rfaces[i].c] = vertset[rfaces[i].c] != null ? vertset[rfaces[i].c] + 1 : 1;
        }
    }

    if(nonbufferobj.vertices.length == vertsetlength) {
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

function splitobjects(faces) {

}
