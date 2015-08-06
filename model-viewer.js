function modelscene(model, args) {
  var renderheight = args.renderheight || 450;
  var renderwidth = args.renderwidth || 450;
  var loadmethod = args.loadmethod || "http";
  this.modelname = args.modelname || "UserModel";
  this.parentel = args.parentel || null;

  console.log("Render size: " + renderwidth + " x " + renderheight);

  var aspectratio = renderwidth / renderheight;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, aspectratio, 0.1, 1000);
  scene.fog = new THREE.Fog(0xeeeeee, 1, 500);

  var lights = {"camera": null,
                "ambient": null};

  lights.camera = new THREE.DirectionalLight(0x606060);
  lights.camera.intensity = 1.0;
  lights.ambient = new THREE.AmbientLight(0x505050);

  scene.add(lights.camera);
  scene.add(lights.ambient);

  // Z is *up* for 3D printing! :)
  camera.up = new THREE.Vector3(0, 0, 1);

  camera.lookAt(new THREE.Vector3(0, 0, 0));

  camera.updateProjectionMatrix();

  var renderer = new THREE.WebGLRenderer({antialias: true});

  renderer.setSize(renderwidth, renderheight);

  var render = function() {
    this.lights.camera.position.set(this.camera.position.x,
                                    this.camera.position.y,
                                    this.camera.position.z);

    this.renderer.render(this.scene, this.camera);
    this.renderer.capture = this.renderer.domElement.toDataURL();
  }

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.damping = 0.2;
  controls.addEventListener('change', render.bind(this));

  this.lights = lights;
  this.scene = scene;
  this.camera = camera;
  this.renderer = renderer;
  this.controls = controls;

  var loader = new THREE.JSONLoader();

  if(loadmethod == "http") {
    console.log("Loading model via http: " + model);
    loader.load(model, loadedmodel.bind(this));
  } else if(loadmethod == "json") {
    console.log("Loading model via JSON.");
    m = loader.parse(model);
    loadedmodel(m.geometry, m.materials);
  } else {
    console.log("Unknown load method: " + loadmethod);
  }

  window.addEventListener("resize", resized.bind(this));

  return this.renderer.domElement;

  function loadedmodel(geometry, materials) {
    // Purple muavey color 0xA824D6
    // Grey blue eeeeff
    // Hot pink #FD4F82 ?
    var material = new THREE.MeshPhongMaterial({ color: 0xddddff, shading: THREE.FlatShading });
    this.renderobject = new THREE.Mesh(geometry, material);

    this.scene.add(this.renderobject);

    var boundingbox = new THREE.Box3().setFromObject(this.renderobject);

    var objectcenter = boundingbox.center();

    var objectfloorgrid = new THREE.GridHelper(Math.round((Math.max(boundingbox.size().z,
                                               boundingbox.size().x))),
                                               10.0);

    // Turn floor to match Z-up orientation
    objectfloorgrid.rotation.x = 90*(Math.PI/180);

    objectfloorgrid.position.x = boundingbox.center().x;
    objectfloorgrid.position.y = boundingbox.center().y;
    objectfloorgrid.position.z = boundingbox.min.z;

    this.scene.add(objectfloorgrid);

    this.camera.position.z = boundingbox.max.z;
    this.camera.position.y = boundingbox.max.y*-4;
    this.camera.position.x = 0;

    this.camera.lookAt(objectcenter);

    this.controls.target = objectcenter;

    this.lights.camera.position.set(this.camera.position.x,
                                    this.camera.position.y,
                                    this.camera.position.z);

    this.renderer.render(this.scene, this.camera);

    var renderEvent = new CustomEvent('scenerendered', {'detail': this.renderer.domElement});
    this.parentel.dispatchEvent(renderEvent);
  }

  function resized(e) {
    // Keep squared
    var renderwidth = this.parentel.offsetWidth;
    var renderheight = this.parentel.offsetWidth;

    this.renderer.setSize(renderwidth, renderheight);
  }
}
