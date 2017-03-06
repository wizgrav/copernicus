THREE.ShaderChunk.displacementmap_pars_vertex += [
    "","#ifdef WIZ_ROCK",
    "#define M_PI 3.14159265",
    "uniform vec4 deform;",
    "uniform vec4 lights;",
    "",
    "",
    "vec3 anglesToSphereCoord(vec2 a, float r)",
    "{",
    "    return vec3(",
    "    	r * sin(a.y) * sin(a.x),",
    "      r * cos(a.y),",
    "      r * sin(a.y) * cos(a.x)  ",
    "    );",
    "}",
    "",
    "vec3 sfn(vec2 uv) {",
    "	float f1 = deform.x;",
    "  float f2 = deform.y;",
    "  float f3 = deform.z;",
    "  float f4 = deform.w;",
    "",
    "	vec2 angles = M_PI * vec2(2. * uv.x, pow(uv.y, mix(0.66, 1.66, f4)) - 1.);",
    "  float r = 0.5 + 0.3 * sin(4. * PI * uv.y + PI * f1) + sin(2. * PI * uv.y + PI * f2) * 0.1 + sin(8. * PI * uv.y + 2. * PI * f3) * 0.1;",
    "  return anglesToSphereCoord(angles,  r) * 0.12;",
    "}",
    "",
    "vec3 calcNormal(vec3 pos, vec2 uv){",
    "  vec3 bitangent = sfn( vec2(uv.x + 1./128., uv.y) ) - pos;",
    "  vec3 tangent = sfn( vec2(uv.x, uv.y + 1./256.) ) - pos;",
    "	return normalize( cross( tangent, bitangent ));",
    "}",
    "#endif",""
].join("\n");

THREE.ShaderChunk.displacementmap_vertex += [
    "","#ifdef WIZ_ROCK ", 
    "transformed = sfn(uv);",
    "vNormal = normalize(normalMatrix * -calcNormal(transformed, uv));",
    "#endif",""
].join("\n");

THREE.ShaderChunk.lights_template += [
   "","#ifdef WIZ_ROCK ", 
   "getFloorIrradiance( geometry, directLight );",
  "RE_Direct( directLight, geometry, material, reflectedLight );",
   "#endif",""
].join("\n");

THREE.ShaderChunk.lights_pars += [
  "#ifdef WIZ_ROCK",
  "uniform vec4 lights;",
  "void getFloorIrradiance( const in GeometricContext geometry, out IncidentLight directLight  ) {",
  "    vec2 vxz = geometry.position.xz;",
  "    float len = length(vxz) * 0.5; ",
  "    float start = mix(0.1,0.4, lights.x);",
  "    float end = start + mix(0.01,0.4, lights.y);",
  "    float dist=0.;",
  "    float center = len;",    
  "    if(len < start){",
  "      dist =  start - len;",
  "      center = start;",
  "    } else if(len > end) {",
  "      dist =  len - end;",
  "      center = end;",
  "    }",
  "    vxz = vxz * (center)/len;",
  "    vec3 ld = vec3(vxz.x, -2., vxz.y);",
  "    directLight.direction = normalize(vec3(0., -1., 0.));",
  "",
  "    float lightDistance = length(ld);",
   "",
  "        float spotEffect = smoothstep(0.13, 0., dist );",
  "",
  //"        directLight.color = vec3(mix(vec3(1.,0.,0.), vec3(0.,0.,1.),len));",
  "        directLight.color = vec3(max(0.8, lights.y)) * spotEffect * punctualLightIntensityToIrradianceFactor( lightDistance, 3., 0.33 );",
  "        directLight.visible = true;",
   "}",
  "#endif"
].join("\n");

var UniformsUtils = THREE.UniformsUtils, UniformsLib=THREE.UniformsLib;

var RockMaterial = new THREE.ShaderMaterial({
    lights: true,
    defines: {WIZ_ROCK: 1, USE_NORMALMAP:1},
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
    lights: {value:  new THREE.Vector4()},
    deform: {value:  new THREE.Vector4()}
  }
] ),
  extensions: {
    derivatives:true
  },
    vertexShader: THREE.ShaderChunk.meshphysical_vert,
    fragmentShader: THREE.ShaderChunk.meshphysical_frag
});

AFRAME.registerGeometry('xplane', {
  schema: {
  },

  init: function (data) {
    this.geometry = new THREE.PlaneGeometry(2, 1, 128, 256);
  }
});

AFRAME.registerShader('rock', {
  schema: {
    deform: {type: "vec4", default: null},
    lights: {type: "vec4", default: null}
  },
  
  init: function (data) {
   
    this.material = RockMaterial.clone();
    
    this.material.uniforms.diffuse.value = new THREE.Color( lerpColor("0x444444", "0x555555", Math.random()) );
    this.material.uniforms.normalMap.value = NormalMaps[Math.round(Math.random() * 2)];


    var material = this.material;
    material.uniforms.offsetRepeat.value.set(Math.random(),Math.random(),2,2);
    material.uniforms.roughness.value = lerp(0.92, 0.96, Math.random());
    material.uniforms.metalness.value = lerp(0.04, 0.06, Math.random());

    material.needsUpdate = true;
  }
});