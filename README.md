# model-viewer

This is a Polymer based project to provide a basic model viewer for websites that want to display models intended for 3D printing.  The model is displayed using three.js and the loader currently supports STL, three.js JSON and Protocol Buffer encoded models.

Polymer https://github.com/polymer/polymer

three.js https://github.com/mrdoob/three.js/

ProtoBuf.js https://github.com/dcodeIO/ProtoBuf.js/

Bower
http://bower.io/

## First steps

This project includes a bower.json that should help you install the dependencies.

To use protocol buffers you will need to compile your model appropriately and provide a matching proto file.

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


### model-viewer-container

Example container to get you started.  Note that sections that are built as templates are not machine readable - for example, the licensing section includes RDFa but, as part of a Polymer template, is not indexable or searchable on the web and is only provided for end-user informational purposes.

* `title` String

  The title of the model.

* `author` String

  A string representing the author.

* `publishdate` Date

  A publish date for the model that should be parseable by toLocaleDateString()

  `this.publishdate.toLocaleDateString('en-US', dateoptions);`

* `description`

  Description of the model.

* `images`

  A JSON array of images to be displayed below the render view.

* `previewimg`

  A preview image used before the model is loaded.

* `downloadurl`

  URL the user can use to download the model.

* `license`

  An optional object representing a Creative Commons license for the model.

  * `licensetype`

    Supported licenses are:
    `CC BY-SA`, `CC BY`, `CC BY-ND`, `CC BY-NC`, `CC BY-NC-SA`, `CC BY-NC-ND`, `CC0`

    Version numbers and dates are currently not supported.

  * `attributionurl`

    A URL to the preferred source of the model.

  * `attributionname`

    The author's name.

  * `title`

    The work's original title.
