/*
 * @author tamarintech / https://tamarintech.com
 *
 * Description: Early release of an AMF Loader following the pattern of the
 * example loaders in the three.js project
 *
 * Usage:
 *  var loader = new AMFLoader();
 *  loader.load('/path/to/project.amf', function(amfobjects) {
      for(amfobject in amfobjects) {
 *      scene.add(amfobject);
 *    }
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

    var scale = 1.0;
    var geometry = {};
    var loadedmaterials = {};
    var loadedobjects = {};
    var amfobjects = [];

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

    var xmldata = new DOMParser().parseFromString(filetext, 'text/xml');

    document.xmldata = xmldata;

    if(xmldata.documentElement.nodeName.toLowerCase() !== "amf") {
      console.log("  Error loading AMF - no AMF document found.");
      return false;
    }

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

    var amfmaterials = xmldata.getElementsByTagName('material');

    for(var mi = 0; mi < amfmaterials.length ; mi++) {
      var mat = amfmaterials[mi];
      var matname = "AMF Material";
      var matid = mat.attributes['id'].textContent;
      var color = {'r': 1.0, 'g': 1.0, 'b': 1.0, 'a': 1.0, opacity: 1.0};

      for(var matci = 0; matci < mat.children.length; matci++) {
        var matchildel = mat.children[matci];

        if(matchildel.localName === "metadata") {
          if(matchildel.attributes['type'] && matchildel.attributes['type'].value === 'name') {
            matname = matchildel.textContent;
          }
        } else if(matchildel.localName === 'color') {
          for(var clri = 0; clri < matchildel.children.length; clri++) {
            var matcolor = matchildel.children[clri];

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
        }
      }

      loadedmaterials[matid] = new THREE.MeshPhongMaterial({shading: THREE.FlatShading,
                                                            color: new THREE.Color(color.r, color.g, color.b),
                                                            name: matname});
      if(color.opacity !== 1.0) {
        loadedmaterials[matid].transparent = true;
        loadedmaterials[matid].opacity = color.opacity;
      }
    }

    console.log(loadedmaterials);
    return amfobjects;
  }

};
