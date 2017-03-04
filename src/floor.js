THREE.ShaderChunk.color_pars_fragment += [
    "","#ifdef WIZ_FLOOR",
   "	uniform vec4 control;",
    "#endif",""
].join("\n");

THREE.ShaderChunk.fog_fragment += [
    "","#ifdef WIZ_FLOOR ", 
    "float dist = length(vUv - vec2(0.5)) * 2.;",
    "float start = mix(0.1,0.4, control.x);",
    "float end = start + mix(0.01,0.4, control.y);",
    "float cl = mix(0.4,1.0,control.z);",
    "float aaf = 2. * fwidth(dist);",
    "float cs = smoothstep(start - aaf, start, dist);",
    "float ce = 1.0 - smoothstep(end, end + aaf, dist);",
    "gl_FragColor = vec4(vec3(max(control.y * cl * 0.3, min(ce,cs)) * cl),1.);",
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

AFRAME.registerShader('floor', {
  schema: {
    control: {value: new THREE.Vector4()}
  },
  
  init: function (data) {
    this.material = new THREE.ShaderMaterial({
        defines:{WIZ_FLOOR:1, USE_MAP:1},
        uniforms: UniformsUtils.merge( [
			UniformsLib.common,
			UniformsLib.aomap,
			UniformsLib.lightmap,
			UniformsLib.fog,
      {
			  control: {value:  new THREE.Vector4()}
			}]),
		  vertexShader: THREE.ShaderChunk.meshbasic_vert,
		  fragmentShader: THREE.ShaderChunk.meshbasic_frag
    });
    this.material.extensions.derivatives = true;
    this.update(data);
  },
  
  update: function (data) {
      
  },
  
  updateMaterial: function (data) {
    var material = this.material;
    
  }
});
