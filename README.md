# model-viewer

This is a Polymer based project to provide a basic model viewer for websites that want to display models intended for 3D printing.  The model is displayed using three.js and the loader currently supports STL, three.js JSON and Protocol Buffer encoded models.

Polymer https://github.com/polymer/polymer

three.js https://github.com/mrdoob/three.js/

ProtoBuf.js https://github.com/dcodeIO/ProtoBuf.js/

Bower http://bower.io/

## First steps

This project includes a bower.json that should help you install the dependencies. You can install directly from the bower repository with:

 `bower install model-viewer`

 Alternatively, you can install directly against git by adding it to an existing bower.json:

 `"model-viewer": https://github.com/tamarintech/model-viewer.git#master`


To use protocol buffers you will need to compile your model appropriately and provide a matching proto file.  An encoded model is significantly more efficient than a generic STL - most STLs have up to an 80% reduction (from 5M binary STL to 1M encoded json).

## Starting the included demo

This is a Polymer based project and uses web components.  You will probably not be able to simply load index.html in your favorite browser - the components won't load.  You will need to serve the demo from a web server.  This is common for Polymer elements and demos.

If you have access to Python the simplest way to view the demo is to use something like the following from within the model-viewer directory:

`python -m SimpleHTTPServer`

You should then be able to browse to localhost:8000 (or similar) to view the included demo.

Step-by-step:

1. Navigate to your project's directory that holds static files or create a new empty directory to view the demo.

  `mkdir ~/model-viewer-demo`

  `cd ~/model-viewer/demo`

2. Install the model-viewer component.

  `bower install model-viewer`

3. Serve the directory.

  `python -m SimpleHTTPServer`

4. Navigate to the demo [http://localhost:8000/bower_components/model-viewer/demo/](http://localhost:8000/bower_components/model-viewer/demo/)

## Live Demo

There is a small demo available at TamarinTech https://tamarintech.com/modellibrary/view/demo_mace_toy

Enjoy! :)

## Components

_model-viewer_ is the core component for displaying a model.

_model-viewer-container_ is an example container to get up and running with displaying models quickly.

## Additional notes

The view is flipped as Z is up in the viewport to match the orientation of printers - be aware of this if you add meshes that were not originally designed for printing as they will render "face down".

## Fields

### model-viewer

Core component for displaying and interacting with the view of the model.

* `previewimg` String

   Place holder used before the model is loaded.

* `model` String

   The actual model.  This should be the json, STL or pb file.

* `modelname` String

  The name of the model for displaying to the user.

* `loadmethod` String

   How the model should be loaded.  Currently `stl` or `json` or `protobuf`.

* `proto` String

   Location of the proto file used to generate the protobuf version of the model if using protocol buffers.

* `backgroundcolor`, `gridcolor`, `modelcolor`:

   The colors you want for the respective render.  Currently, these should be in hex that three.js understands - ex: `0xffffff` is white. :)

* `togglesolid` Boolean

  Render the solid geometry of the object.

* `togglewireframe` Boolean

  Render the wireframe for the object.


### model-viewer-container

Example container to get you started.  Note that sections that are built as templates are not machine readable - for example, the licensing section includes RDFa but, as part of a Polymer template, is not indexable or searchable on the web and is only provided for end-user informational purposes.  This elements wraps the model-viewer element.  See index.html for an example.

* `title` String

  The title of the model.

* `author` String

  A string representing the author.

* `publishdate` Date

  A publish date for the model that should be parseable by toLocaleDateString()

  `this.publishdate.toLocaleDateString('en-US', dateoptions);`

* `description` String

  Description of the model.

* `images` Array

  A JSON array of images to be displayed below the render view.

  Example: `[{"alt": "Mace Toy Image", "srclg": "models/mace_toy/mace_toy.stl.png", "srcsm": "models/mace_toy/mace_toy.stl.png"}]`

  * `alt` String

    The alt text for the image.

  * `srclg` String

    The image used in the viewer dialog.  Should be a higher quality than srcsm.

  * `srcsm` String

    The small image that appears below the viewer.

* `previewimg` String

  A preview image used before the model is loaded.

* `downloadurl` String

  URL the user can use to download the model.

* `license` Object

  An optional object representing a Creative Commons license for the model.

  * `licensetype` String

    Supported licenses are:
    `CC BY-SA`, `CC BY`, `CC BY-ND`, `CC BY-NC`, `CC BY-NC-SA`, `CC BY-NC-ND`, `CC0`

    Version numbers and dates are currently not supported.

  * `attributionurl` String

    A URL to the preferred source of the model.

  * `attributionname` String

    The author's name.

  * `title` String

    The work's original title.

## Extras

### Generating a preview Image

**Version 0.0.4**: A toolbar button has been added for taking pictures of the rendered scene.

**Prior to version 0.0.4**:
For convenience, a data URI is generated from the scene and appended to the renderer instance.  You can access this data via dev tools, or your instance with something similar to the example below.

`document.getElementsByTagName('model-viewer')[0].renderer.capture`

Note that this is only available after the scene has been rendered (immediately after the 3D View button is clicked) and is updated after each scene update.

## Release notes

0.0.1: Initial release!

0.0.2: Documentation, project packaging

0.0.3: User-configurable colors

0.0.4: More user configurable options - light color, intensity, ambient color.  New layout for viewer controls.  Various code fixes.  Utility.js added for early testing of new features.

## Road Map

### Version 1.0
* Must support loading common STL, JSON and ProtoBuf models
* Must include export functionality for the scene as a binary STL
* Should support exporting to multimaterial AMF
* Should support loading OBJ and PLY
* Should include an export button to allow the user to export geometry.
* May include importing objects via URL
* May include importing materials via URL/JSON
* May include optional textures
