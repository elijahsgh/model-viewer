/*
 * @author tamarintech / https://tamarintech.com
 *
 * Description: Early release of an AMF Loader following the pattern of the
 * example loaders in the three.js project
 *
 * Usage:
 *  var loader = new AMFLoader();
 *  loader.load('/path/to/project.amf', function(amfobjects) {
 *    <process amfobjects function>
 *  });
 *
 * Materials now supported, material colors supported
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
      var result = scope.parse(text);
      onLoad(result);
    }, onProgress, onError);
  },

  parse: function(data) {
    "use strict";

    var amfobject = {
      "name": "AMF Default Name",
      "author": "",
      "scale": 1.0,
      "materials": {},
      "objects": {}
    };

    var xmldata = this.loaddocument(data);

    amfobject.scale = this.loaddocumentscale(xmldata);

    var documentchildren = xmldata.documentElement.children;

    for(var i = 0; i < documentchildren.length; i++) {
      if(documentchildren[i].localName === 'metadata') {
        if(documentchildren[i].attributes['type'] !== undefined) {
          if(documentchildren[i].attributes['type'].value === 'name') {
            amfobject.name = documentchildren[i].textContent;
          } else if(documentchildren[i].attributes['type'].value === 'author') {
            amfobject.author = documentchildren[i].textContent;
          }
        }
      } else if(documentchildren[i].localName === 'material') {
        var loadedmaterial = this.loadmaterials(documentchildren[i]);
        amfobject.materials[loadedmaterial.id] = loadedmaterial.material;
      } else if(documentchildren[i].localName === 'object') {
        var loadedobject = this.loadobject(documentchildren[i]);
        amfobject.objects[loadedobject.id] = loadedobject.object;
      }
    }

    console.log(JSON.stringify(amfobject));
    return amfobject;
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

      if(matchildel.localName === "metadata" && matchildel.attributes['type'] !== undefined) {
        if(matchildel.attributes['type'].value === 'name') {
          matname = matchildel.textContent;
        }
      } else if(matchildel.localName === 'color') {
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

      if(matcolor.localName === 'r') {
        color.r = matcolor.textContent;
      } else if(matcolor.localName === 'g') {
        color.g = matcolor.textContent;
      } else if(matcolor.localName === 'b') {
        color.b = matcolor.textContent;
      } else if(matcolor.localName === 'a') {
        color.opacity = matcolor.textContent;
      }
    }

    return color;
  },

  loadmeshvolume: function( node ) {
    var volume = {"name": "", "triangles": []};

    var currvolumenode = node.firstElementChild;

    while( currvolumenode ) {
      if( currvolumenode.localName === "metadata" ) {
        if(currvolumenode.attributes['type'] !== undefined) {
          if(currvolumenode.attributes['type'].value === 'name') {
            volume.name = currvolumenode.textContent;
          }
        }
      } else if ( currvolumenode.localName === "triangle" ) {
        var trianglenode = currvolumenode.firstElementChild;

        while( trianglenode ) {
          if( trianglenode.localName === "v1" ||
              trianglenode.localName === "v2" ||
              trianglenode.localName === "v3") {
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
      if ( currverticesnode.localName === "vertex" ) {
        var vnode = currverticesnode.firstElementChild;

        while( vnode ) {
          if( vnode.localName === "coordinates") {
            var coordnode = vnode.firstElementChild;

            while( coordnode ) {

              if( coordnode.localName === "x" ||
                  coordnode.localName === "y" ||
                  coordnode.localName === "z") {
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
    var loadedobject = { "name": "amfobject",
      "meshes": []
    };

    var currcolor = null;

    var currobjnode = node.firstElementChild;

    while( currobjnode ) {
      if(currobjnode.localName === "metadata") {
        if(currobjnode.attributes['type'] !== undefined) {
          if(currobjnode.attributes['type'].value === 'name') {
            loadedobject.name = currobjnode.textContent;
          }
        }
      } else if(currobjnode.localName === "color") {
        currcolor = this.loadcolor(currobjnode);
      } else if(currobjnode.localName === "mesh") {
        var currmeshnode = currobjnode.firstElementChild;
        var mesh = {"vertices": [], "volumes": [], "color": currcolor };

        while( currmeshnode ) {
          if(currmeshnode.localName === "vertices") {
            mesh.vertices = mesh.vertices.concat(this.loadmeshvertices(currmeshnode));
          } else if(currmeshnode.localName === "volume") {
            mesh.volumes.push(this.loadmeshvolume(currmeshnode));
          }
          currmeshnode = currmeshnode.nextElementSibling;
        }

        loadedobject.meshes.push(mesh);
      }
      currobjnode = currobjnode.nextElementSibling;
    }

    return { 'id': objid, 'object': loadedobject };
  }
};
