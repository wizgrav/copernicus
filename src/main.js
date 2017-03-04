// Objects
var $ = {
    terrain: "#terrain",
    torus: "#torus",
    floor: "#floor",
    ring: "#ring",
    sky: "#sky",

    audio: "audio",
    camera: "#camera",
    ambient: "#ambient",
    skylight: "#skylight",
    earthlight: "#earthlight",

    bloom: new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1., 0.2, 0.4),
    clubber: new Clubber({size: 2048}),
    
    lights: [0, 0, 0, 0],
    deform: [0, 0, 0, 0],
    waves: [],
    rocks: [],
    count: 0
};
Object.keys($).forEach(function (k) { $[k] = typeof $[k] === "string" ? document.querySelector($[k]): $[k];});

// Updaters

var $$ = {
    clubber: function (time) {
        this.update(time);
        $.lights = $.lightsFn(time);
        $.deform = $.deformFn(time);
        $.noteTex.needsUpdate = true;

        $.deform[0] = $.lights[0];
    },

    camera: function (time) {
        var c = this.getObject3D("camera");
        var vector = c.getWorldDirection();
        $.rotation = Math.PI + Math.atan2(vector.x,vector.z);
    },
    
    waves: function(time) {
        if ($.triggered && $.deform[0] < 0.99) {
            $.triggered = false;
        } else if (!$.triggered && $.deform[0] >= 0.996){
            //console.log($.rotation);
            this.push({start: time, offset: 0});
            $.rocks.push(createRock(time, $.rotation, $.count++ & 1 ? 1: -1));
            $.pump = 1;
            $.triggered = true;
        }
        if(this.length > 4) $.waves.shift();
    },

    terrain: function (time) {
        var obj = this.object3D.children[0];
        if(!obj.children.length) return;
        var material = obj.children[0].material;
        if(!material) return;
        var wd = [], wo = [], waves = [];
        for(var i=0; i < 4; i++){
            var w = $.waves[i];
            if (!w){
                wd.push(1.1);
                wo.push(0);
                continue;
            }
            var d = 0.1 + Math.min(1.2 , (time - w.start) / 3333);
            if(d < 1.2) waves.push(w);
            wo.push(w.offset);
            wd.push(d);
        }
        $.waves = waves;
        material.uniforms.waveDists.value.fromArray(wd);
        material.uniforms.waveOffsets.value.fromArray(wo);
    },

    torus: function (time, dt) {
        var v = $.pump * 0.8;
        this.setAttribute("scale", {x:1+v, y:1+v, z:1+v});
        $.pump = 0.8 * v;
        this.setAttribute("color", lerpColor(dt[0],dt[1],Math.pow(v, 2.0)));
    },

    floor: function (time) {
        var obj = this.getObject3D("mesh");
        var material = obj.material;
        if(!material) return;
        var l = $.lights;
        material.uniforms.control.value.set(l[1], l[2], $.pump,0);
    },

    rocks: function(time) {
        var rocks = [];
        function getValue(i) {
            return $.deform[Math.floor(i)] ;
        }
        this.forEach(function (o) {
            var p = (time - o.start) / 6666;
            var a = o.mod * 3.3 * p  * Math.PI - o.offset - Math.PI/2;
            var r = lerp(1.33, 0, p);
            var sc = Math.pow(smoothstep(0, 0.05, p),3);
            var f =  Math.pow(smoothstep(0.8, 1, p), 3);
            if(p < 1) rocks.push(o); else sceneEl.removeChild(o);
            var mesh = o.getObject3D("mesh");
            if(!mesh) return;
            mesh.scale.set(sc - f,sc + f,sc-f);
            var material = mesh.material;
            if(!material) return;
            var arr = [];
            o.deform.forEach(function(d){ 
                var v = getValue(d);
                arr.push(v); 
            });
            material.uniforms.deform.value.fromArray(arr);
            var l = $.lights;
            material.uniforms.lights.value.set(l[1], l[2], $.pump,0);
            var x = Math.cos(a) * r;
            var z = Math.sin(a) * r;
            var y = -1.16 + Math.sin((time - o.start)/333 + o.offset) * 0.05 + Math.pow(smoothstep(0.66, 1, p), 4)  * 32;
            o.setAttribute("position", { x:x, y:y, z:z });
            
        });
        $.rocks = rocks;
    },

    ambient: function (time, dt) {
        this.setAttribute("light", {color: lerpColor(dt[0], dt[1], $.lights[3])});
    },

    skylight: function (time, dt) {
        this.setAttribute("light",{intensity: lerp(dt[0], dt[1], $.lights[3])});
    },
    

    sky: function (time, dt) {
        this.setAttribute("rotation", {x:0, y:time/3333 % 360, z: 0});
        this.setAttribute("color", lerpColor(dt[0], dt[1],Math.pow($.lights[3], 1.66)));
    },

    bloom: function (time, dt) {
        this.threshold = lerp(dt[0], dt[1], $.lights[3]);
    },
};

function createRock(start, offset, mod){
    var el = document.createElement("a-entity");
    el.setAttribute("mixin", "rock");
    sceneEl.appendChild(el);
    el.deform = [];
    for(var i=0; i< 4; i++) el.deform.push(Math.random() * 3.99);
    console.log(offset);
    el.offset = offset;
    el.start = start;
    el.mod = mod;
    return el;
}

function setup() {
    $.lightsFn = Clubberize($.clubber, CONFIG.lights);
    $.deformFn = Clubberize($.clubber, CONFIG.deform);
}

$.clubber.listen(document.getElementById("audio"));
var sceneEl = document.querySelector("a-scene");
$.noteTex = new THREE.DataTexture($.clubber.notes, 128, 1, THREE.LuminanceFormat, THREE.UnsignedByteType);
$.noteTex.minFilter = THREE.LinearFilter;
$.noteTex.magFilter = THREE.LinearFilter;
$.noteTex.wrapS = THREE.MirroredRepeatWrapping;
$.noteTex.wrapT = THREE.MirroredRepeatWrapping;

var renderTarget = new THREE.WebGLRenderTarget( 1, 1, { 
    minFilter: THREE.LinearFilter, 
    magFilter: THREE.NearestFilter,
    stencilBuffer: false
});

renderTarget.texture.generateMipmaps = false;
renderTarget.texture.minFilter = THREE.LinearFilter;

var NormalMaps = [];
["rock0", "rock1", "rock2"].forEach(function(s){
    var img = document.querySelector("#"+s);
    var texture = new THREE.Texture(img);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    img.onload = function () {
      texture.needsUpdate = true;
    };
    texture.needsUpdate=true;
    NormalMaps.push(texture);
});

setup();

// Monkeyphonic :)

function update (time) {
    for(var f in $$) {
        if($[f]) $$[f].call($[f], time, CONFIG[f]);
    }
}


function render (time) {
    var effect = this.effect;
    var timeDelta = time - this.time;

    if (this.isPlaying) { this.tick(time, timeDelta); }
    
    var dt = window.performance.now();
    update(dt);
    
    var size = this.renderer.getSize();
    if (size.width !== renderTarget.width || size.height !== renderTarget.height) {
        renderTarget.setSize(size.width, size.height);
        $.bloom.setSize(size.width, size.height)
    }
    
    this.animationFrameID = effect.requestAnimationFrame(this.render);

    sceneEl.effect.autoSubmitFrame = false;
    effect.render(this.object3D, this.camera, renderTarget, true);
    $.bloom.render(this.renderer, null, renderTarget, dt);
    effect.submitFrame();

    this.time = time;
}

sceneEl.render = render.bind(sceneEl);

overlay = document.querySelector("#overlay");
sceneEl.addEventListener("loaded", function () {
    overlay.classList.add("loaded");
})

$.audio.addEventListener("ended", function (){
    overlay.style.display = "block";
})

overlay.addEventListener("click", function onClick() {
    if(!this.classList.contains("loaded")) return;
    this.style.display = "none";
    $.audio.play();    
});