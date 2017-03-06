require("./lib/aframe.js");
require("./lib/clubber.js");
require("./lib/clubberize.js");

THREE.Pass = function () {
    this.enabled = true;
    this.needsSwap = true;
    this.clear = false;
    this.renderToScreen = false;

};

Object.assign( THREE.Pass.prototype, {

    setSize: function( width, height ) {},

    render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

        console.error( "THREE.Pass: .render() must be implemented in derived pass." );

    }

} );

require("./lib/CopyShader.js");
require("./lib/LuminosityHighPassShader.js");
require("./lib/UnrealBloomPass.js");
require("./src/config.js");
require("./src/common.js");
require("./src/terrain.js");
require("./src/floor.js");
require("./src/rock.js");