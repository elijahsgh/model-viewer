/*
 * @author tamarintech / https://tamarintech.com
 *
 * Description: Early release of an AMF Loader following the pattern of the
 * example loaders in the three.js project
 *
 * Usage:
 *  var loader = new AMFLoader();
 *  loader.load('/path/to/project.amf', function(geometries, materials) {
 *    <create THREE.Mesh objects from Array geometries and Array materials>
 *  });
 *
 * Materials now supported, material colors supported
 * Zip support, requires jszip
 * No constellation support !
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
      var result = scope.parse(text);
      onLoad(result.geometry, result.materials);
    }, onProgress, onError);
  },

  parse: function(data) {
    "use strict";

    var amf_name = "";
    var amf_author = "";
    var amf_scale = 1.0;
    var amf_materials = {};
    var amf_objects = {};

    var loadedgeometries = [];
    var loadedmaterials = [];

    var xmldata = this.loaddocument(data);

    amf_scale = this.loaddocumentscale(xmldata);

    var documentchildren = xmldata.documentElement.children;

    for(var i = 0; i < documentchildren.length; i++) {
      if(documentchildren[i].nodeName === 'metadata') {
        if(documentchildren[i].attributes['type'] !== undefined) {
          if(documentchildren[i].attributes['type'].value === 'name') {
            amf_name = documentchildren[i].textContent;
          } else if(documentchildren[i].attributes['type'].value === 'author') {
            amf_author = documentchildren[i].textContent;
          }
        }
      } else if(documentchildren[i].nodeName === 'material') {
        var loadedmaterial = this.loadmaterials(documentchildren[i]);
        amf_materials[loadedmaterial.id] = loadedmaterial.material;
      } else if(documentchildren[i].nodeName === 'object') {
        var loadedobject = this.loadobject(documentchildren[i]);
        amf_objects[loadedobject.id] = loadedobject.obj;
      }
    }

    var sceneobject = new THREE.Object3D();

    sceneobject.name = amf_name;
    sceneobject.userData.author = amf_author;
    sceneobject.userData.loader = "AMF";

    var defaultmaterial = new THREE.MeshPhongMaterial({shading: THREE.FlatShading, color: 0xaaaaff});

    for(var objid in amf_objects) {
      var newobject = new THREE.Object3D();

      for(var meshi = 0; meshi < amf_objects[objid].meshes.length; meshi++) {
        var meshvertices = Float32Array.from(amf_objects[objid].meshes[meshi].vertices);
        var vertices = new THREE.BufferAttribute(Float32Array.from(meshvertices), 3);
        var objdefaultmaterial = defaultmaterial;

        if(amf_objects[objid].meshes[meshi].color) {
          var color = amf_objects[objid].meshes[meshi].color;
          objdefaultmaterial = defaultmaterial.clone();
          objdefaultmaterial.color = new THREE.Color(color.r, color.g, color.b);

          if(color.a != 1.0) {
            objdefaultmaterial.transparent = true;
            objdefaultmaterial.opacity = color.a;
          }
        }

        for(var voli = 0; voli < amf_objects[objid].meshes[meshi].volumes.length; voli++) {
          var currvolume = amf_objects[objid].meshes[meshi].volumes[voli];
          var newgeometry = new THREE.BufferGeometry();
          var indexes = Uint32Array.from(currvolume.triangles);
          var material = objdefaultmaterial;

          newgeometry.addAttribute('position', vertices.clone());
          newgeometry.addAttribute('index', new THREE.BufferAttribute(indexes, 1));

          if(amf_materials[currvolume.materialid] !== undefined) {
            material = amf_materials[currvolume.materialid];
          }

          newgeometry.scale(amf_scale, amf_scale, amf_scale);

          loadedgeometries.push(newgeometry);
          loadedmaterials.push(material.clone());

          var newmesh = new THREE.Mesh(newgeometry, material.clone());
          newobject.add(newmesh);
        }
      }
      sceneobject.add(newobject);
    }

    // return sceneobject;
    return { geometry: loadedgeometries, materials: loadedmaterials };
  },

  loaddocument: function ( data ) {
    var view = new DataView(data);

    var magic = String.fromCharCode(view.getUint8(0), view.getUint8(1));

    if(magic === "PK") {
      console.log("Loading Zip");
      var zip = null;
      var file = null;

      try {
        zip = new JSZip(data);
      } catch (e) {
        if (e instanceof ReferenceError) {
          console.log("  jszip missing and file is compressed.");
          return false;
        }
      }

      for(file in zip.files) {
        if(file.toLowerCase().endsWith(".amf")) {
          break;
        }
      }

      console.log("  Trying to load file asset: " + file);
      view = new DataView(zip.file(file).asArrayBuffer());
    }

    var filetext = new TextDecoder('utf-8').decode(view);

    var xmldata = new DOMParser().parseFromString(filetext, 'application/xml');

    if(xmldata.documentElement.nodeName.toLowerCase() !== "amf") {
      console.log("  Error loading AMF - no AMF document found.");
      return false;
    }

    return xmldata;
  },

  loaddocumentscale: function ( xmldata ) {
    var scale = 1.0;

    var unit = xmldata.documentElement.attributes['unit'].value.toLowerCase();

    var scale_units = {
      'millimeter': 1.0,
      'inch': 25.4,
      'feet': 304.8,
      'meter': 1000.0,
      'micron': 0.001
    };

    if(scale_units[unit] !== undefined) {
      scale = scale_units[unit];
    }

    console.log("  Unit scale: " + scale);
    return scale;
  },

  loadmaterials: function ( node ) {
    var mat = node;

    var loadedmaterial = null;
    var matname = "AMF Material";
    var matid = mat.attributes['id'].textContent;
    var color;

    for(var i = 0; i < mat.children.length; i++) {
      var matchildel = mat.children[i];

      if(matchildel.nodeName === "metadata" && matchildel.attributes['type'] !== undefined) {
        if(matchildel.attributes['type'].value === 'name') {
          matname = matchildel.textContent;
        }
      } else if(matchildel.nodeName === 'color') {
        color = this.loadcolor(matchildel);
      }
    }

    loadedmaterial = new THREE.MeshPhongMaterial({
      shading: THREE.FlatShading,
      color: new THREE.Color(color.r, color.g, color.b),
      name: matname});

    if(color.opacity !== 1.0) {
      loadedmaterial.transparent = true;
      loadedmaterial.opacity = color.opacity;
    }

    return { 'id': matid, 'material': loadedmaterial };
  },

  loadcolor: function ( node ) {
    var color = {'r': 1.0, 'g': 1.0, 'b': 1.0, 'a': 1.0, opacity: 1.0};

    for(var i = 0; i < node.children.length; i++) {
      var matcolor = node.children[i];

      if(matcolor.nodeName === 'r') {
        color.r = matcolor.textContent;
      } else if(matcolor.nodeName === 'g') {
        color.g = matcolor.textContent;
      } else if(matcolor.nodeName === 'b') {
        color.b = matcolor.textContent;
      } else if(matcolor.nodeName === 'a') {
        color.opacity = matcolor.textContent;
      }
    }

    return color;
  },

  loadmeshvolume: function( node ) {
    var volume = { "name": "", "triangles": [], "materialid": null };

    var currvolumenode = node.firstElementChild;

    if(node.attributes['materialid'] !== undefined) {
      volume.materialid = node.attributes['materialid'].nodeValue;
    }

    while( currvolumenode ) {
      if( currvolumenode.nodeName === "metadata" ) {
        if(currvolumenode.attributes['type'] !== undefined) {
          if(currvolumenode.attributes['type'].value === 'name') {
            volume.name = currvolumenode.textContent;
          }
        }
      } else if ( currvolumenode.nodeName === "triangle" ) {
        var trianglenode = currvolumenode.firstElementChild;

        while( trianglenode ) {
          if( trianglenode.nodeName === "v1" ||
              trianglenode.nodeName === "v2" ||
              trianglenode.nodeName === "v3") {
            volume.triangles.push(trianglenode.textContent);
          }

          trianglenode = trianglenode.nextElementSibling;
        }
      }
      currvolumenode = currvolumenode.nextElementSibling;
    }

    return volume;
  },

  loadmeshvertices: function( node ) {
    var vert_array = [];

    var currverticesnode = node.firstElementChild;

    while( currverticesnode ) {
      if ( currverticesnode.nodeName === "vertex" ) {
        var vnode = currverticesnode.firstElementChild;

        while( vnode ) {
          if( vnode.nodeName === "coordinates") {
            var coordnode = vnode.firstElementChild;

            while( coordnode ) {

              if( coordnode.nodeName === "x" ||
                  coordnode.nodeName === "y" ||
                  coordnode.nodeName === "z") {
                vert_array.push(coordnode.textContent);
              }

              coordnode = coordnode.nextElementSibling;
            }
          }
          vnode = vnode.nextElementSibling;
        }
      }
      currverticesnode = currverticesnode.nextElementSibling;
    }

    return vert_array;
  },

  loadobject: function ( node ) {
    "use strict";
    var objid = node.attributes['id'].textContent;
    var loadedobject = { "name": "amfobject", "meshes": [] };

    var currcolor = null;

    var currobjnode = node.firstElementChild;

    while( currobjnode ) {
      if(currobjnode.nodeName === "metadata") {
        if(currobjnode.attributes['type'] !== undefined) {
          if(currobjnode.attributes['type'].value === 'name') {
            loadedobject.name = currobjnode.textContent;
          }
        }
      } else if(currobjnode.nodeName === "color") {
        currcolor = this.loadcolor(currobjnode);
      } else if(currobjnode.nodeName === "mesh") {
        var currmeshnode = currobjnode.firstElementChild;
        var mesh = {"vertices": [], "volumes": [], "color": currcolor };

        while( currmeshnode ) {
          if(currmeshnode.nodeName === "vertices") {
            mesh.vertices = mesh.vertices.concat(this.loadmeshvertices(currmeshnode));
          } else if(currmeshnode.nodeName === "volume") {
            mesh.volumes.push(this.loadmeshvolume(currmeshnode));
          }
          currmeshnode = currmeshnode.nextElementSibling;
        }

        loadedobject.meshes.push(mesh);
      }
      currobjnode = currobjnode.nextElementSibling;
    }

    return { 'id': objid, 'obj': loadedobject };
  }
};
