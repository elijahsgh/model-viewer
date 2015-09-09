/*
 * @author tamarintech / https://tamarintech.com
 *
 * Description: Early release of an AMF Loader following the pattern of the
 * example loaders in the three.js project
 *
 * Usage:
 *  var loader = new AMFLoader();
 *  loader.load('/path/to/project.amf', function(geometry) {
 *    scene.add(new THREE.Mesh(geometry));
 *  });
 *
 * No support for materials (yet)
 * No support for colors (yet)
 * Zip support, requires jszip
 *
 */

AMFLoader = function(manager) {
  this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
};

AMFLoader.prototype = {

  constructor: AMFLoader,

  load: function(url, onLoad, onProgress, onError) {
    var scope = this;

    var loader = new THREE.XHRLoader(scope.manager);
    loader.setCrossOrigin(this.crossOrigin);
    loader.setResponseType('arraybuffer');

    loader.load(url, function(text) {
      onLoad(scope.parse(text));
    }, onProgress, onError);
  },

  parse: function(data) {
    var view = new DataView(data);

    var geometries = [];

    var magic = String.fromCharCode(view.getUint8(0)) + String.fromCharCode(view.getUint8(1));

    if(magic == "PK") {
      console.log("Loading Zip");
      var zip = new JSZip(data);
      var file = "";

      document.zipfile = zip;

      for(file in zip.files) {
        if(file.toLowerCase().endsWith(".amf"))
          break;
      }

      view = new DataView(zip.file(file).asArrayBuffer());
    }

    var text = new TextDecoder('utf-8').decode(view);

    var xmlparser = new DOMParser();
    xmldata = xmlparser.parseFromString(text, 'text/xml');

    if(xmldata.documentElement.nodeName != "amf") {
      console.log("Error loading AMF");
      return false;
    }

    var scale = 1.0;

    var unit = xmldata.documentElement.attributes['unit'].value.toLowerCase();

    if(unit == 'millimeter') {
      scale = 1.0;
    } else if(unit == 'inch') {
      scale = 25.4;
    } else if(unit == 'feet') {
      scale = 304.8;
    } else if(unit == 'meter') {
      scale = 1000.0;
    } else if(unit == 'micron') {
      scale = 0.001;
    }

    console.log("  Unit scale: " + scale);

    // load object(s)

    var objects = xmldata.getElementsByTagName('object');
    if(!objects || objects.length < 1) {
      console.log("No loadable objects found");
      return false;
    }

    for(var obji = 0; obji < objects.length; obji++) {
      var obj = objects[obji];
      var objname = 'AMF Object';
      var objvertices = [];
      var objvertarray = null;

      var metadata = obj.getElementsByTagName('metadata');

      for(var mdi = 0; mdi < metadata.length; mdi++) {
        if(metadata[mdi].attributes['type'].value.toLowerCase() == "name") {
          objname = metadata[mdi].textContent;
        }
      }

      // Meshes

      var meshes = obj.getElementsByTagName('mesh');

      for(var meshi = 0; meshi < meshes.length; meshi++) {
        for(var mi = 0; mi < meshes.length; mi++) {
          var vertices = meshes[meshi].getElementsByTagName('vertex');

          for(var vi = 0; vi < vertices.length; vi++) {
            for(var ci = 0; ci < vertices[vi].children.length; ci++) {
              if(vertices[vi].children[ci].localName == "coordinates") {
                var coords = vertices[vi].children[ci];
                var vertex = {x: NaN, y: NaN, z: NaN};

                vertex.x = coords.getElementsByTagName("x")[0].textContent;
                vertex.y = coords.getElementsByTagName("y")[0].textContent;
                vertex.z = coords.getElementsByTagName("z")[0].textContent;

                objvertices.push(vertex);
              }
            }
          }

          // Vertices loaded

          var volumes = meshes[meshi].getElementsByTagName('volume');

          for(var voli = 0; voli < volumes.length; voli++) {
            var triangles = volumes[voli].getElementsByTagName('triangle');
            var voffset = 0;

            objvertarray = new Float32Array(triangles.length * 3 * 3);

            for(var ti = 0; ti < triangles.length; ti++) {
              var v1 = triangles[ti].getElementsByTagName("v1")[0].textContent;
              var v2 = triangles[ti].getElementsByTagName("v2")[0].textContent;
              var v3 = triangles[ti].getElementsByTagName("v3")[0].textContent;

              objvertarray[voffset++] = objvertices[v1].x
              objvertarray[voffset++] = objvertices[v1].y
              objvertarray[voffset++] = objvertices[v1].z

              objvertarray[voffset++] = objvertices[v2].x
              objvertarray[voffset++] = objvertices[v2].y
              objvertarray[voffset++] = objvertices[v2].z

              objvertarray[voffset++] = objvertices[v3].x
              objvertarray[voffset++] = objvertices[v3].y
              objvertarray[voffset++] = objvertices[v3].z
            }

            var geometry = new THREE.BufferGeometry();

            var scalematrix = new THREE.Matrix3();
            scalematrix.multiplyScalar(scale);

            scalematrix.applyToVector3Array(objvertarray);

            geometry.addAttribute('position', new THREE.BufferAttribute(objvertarray, 3));
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
            geometries.push(geometry);
          }
        }
      }
    }

    return geometries;
  }

};
