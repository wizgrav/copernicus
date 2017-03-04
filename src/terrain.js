THREE.ShaderChunk.displacementmap_pars_vertex += [
    "","#ifdef WIZ_TERRAIN",
    "   uniform sampler2D noteTex;",
    "	uniform vec4 waveDists;",
    "	uniform vec4 waveOffsets;",
    "#endif",""
].join("\n");

THREE.ShaderChunk.displacementmap_vertex += [
    "","#ifdef WIZ_TERRAIN ", 
    "   float disp = 1.;", 
    "   float offset = 0.;", 
    "   vec4 wo = waveOffsets;",
    "   vec4 wd = waveDists;",
    "   float len = min(1.,length(transformed) / 50.);",
    "    for(int i=0; i<4; i++){", 
    "        float d = abs(len - wd.x);", 
    "        disp = min(disp,d);", 
    "        wo.xyzw = wo.yzwx;", 
    "        wd.xyzw = wd.yzwx;",
    "    }", 
    " float ht = texture2D( noteTex, vec2( abs(dot( normalize(transformed.xz), vec2(1.,0.) )) * 2., 0.) ).x;",
    " float att = pow(1. - smoothstep(0.,0.1,abs(disp)), 1.66 ) * pow(smoothstep(0.09,0.16,len) * smoothstep(1.,0.8,len),1.33) ;", 
    "	transformed += normal * ht *  6.66 *  att ;", 
    " vColor.xyz *=  mix(1.0, pow(mix( mix(1.0,0.33,smoothstep(0.,0.24,len) ), 1., (2. * abs( smoothstep(0., 0.2, disp) - 0.5)) ),2.), smoothstep(0.7,0.6,len));",
    "#endif",""
].join("\n");

function getMaterialData (data) {
  var newData = {
    color: new THREE.Color(data.color),
    metalness: data.metalness,
    roughness: data.roughness,
  };

  if (data.normalMap) { newData.normalScale = data.normalScale; }
  return newData;
}

var UniformsUtils = THREE.UniformsUtils, UniformsLib=THREE.UniformsLib;

AFRAME.registerShader('terrain', {
  schema: {
    waves: {type: "vec4", default: null},
    waveOffsets: {type: "vec4", default: null}
  },
  
  init: function (data) {
    this.material = new THREE.ShaderMaterial({
        lights: true,
        defines: {WIZ_TERRAIN: 1, USE_NORMALMAP:1, USE_COLOR: 1},
        uniforms: UniformsUtils.merge( [
			UniformsLib.common,
			UniformsLib.aomap,
			UniformsLib.lightmap,
			UniformsLib.emissivemap,
			UniformsLib.bumpmap,
			UniformsLib.normalmap,
			UniformsLib.displacementmap,
			UniformsLib.roughnessmap,
			UniformsLib.metalnessmap,
			UniformsLib.fog,
			UniformsLib.lights,
			{
				emissive: { value: new THREE.Color( 0x000000 ) },
				roughness: { value: 0.95 },
				metalness: { value: 0.05 },
				envMapIntensity: { value: 1 },
        noteTex: {type: "t", value: null},
        waveDists: {value:  new THREE.Vector4()},
        waveOffsets: {value:  new THREE.Vector4()}
			}
		] ),

        vertexShader: THREE.ShaderChunk.meshphysical_vert,
        fragmentShader: THREE.ShaderChunk.meshphysical_frag
    });
    this.material.extensions.derivatives = true;
    this.material.uniforms.diffuse.value = new THREE.Color( 0x333333 );

    var material = this.material;
    var img = document.querySelector("#terrain-normals");
    var texture = new THREE.Texture(img);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    material.uniforms.offsetRepeat.value.set(0,0,32,32);
    material.uniforms['normalMap'].value = texture;
    material.uniforms['noteTex'].value = $.noteTex;
    material.needsUpdate = true;
    img.onload = function () {
      texture.needsUpdate = true;
    };
    texture.needsUpdate=true;
    this.update(data);
  },
  
  update: function (data) {
      
  },
  
  updateMaterial: function (data) {
    var material = this.material;
    
  }
});
