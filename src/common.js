window.setupAudio = function () {
  var handleDragOver = function(e) {
      e.preventDefault();
      e.stopPropagation();
  }
  var handleDrop = function(e) {
      e.preventDefault();
      e.stopPropagation();
      var objectUrl = URL.createObjectURL(e.dataTransfer.files[0]);
      play(objectUrl, true);
  }

  sceneEl.addEventListener('drop', handleDrop, false);
  sceneEl.addEventListener('dragover', handleDragOver, false);

  $.audio.onerror = function () {
    alert(
      audio.currentSrc.match("blob:")  ?
      "Bad audio file"
      :  
      "Soundcloud API limit reached, you could try again later.\nYou can also drop your own audio files in the page.\n\n"
    );
          
  }
}

window.getParameterByName = function (name, search) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(search || location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

window.play = function (src, dropped) {
  if($.lastObjectUrl){
    URL.revokeObjectURL($.lastObjectUrl);
    delete $.lastObjectUrl;
  }
  if(!dropped) {
    src = '//api.soundcloud.com/tracks/'+src+'/stream?client_id=' + CONFIG.clientId;
  } else {
    $.lastObjectUrl = src;
  }
  $.audio.src=src;
}

window.load = function (url, cb) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
      if(cb) {
        cb(this.status, xhr.responseURL);
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}


window.soundcloud = function (url) {
  load("//api.soundcloud.com/resolve?url=" + encodeURIComponent(url.split("?")[0]) + "&client_id=" + CONFIG.clientId).then(function (resp) {
    var text = resp.response;
    var data = JSON.parse(text);
    if (data.kind !== "track"){
      alert( "Please provide a track url, " + data.kind + " urls are not supported.");
      return;
    }
    $.info.innerHTML = "<a href='"+data.permalink_url+"' target='_blank'>Listening to "+data.title+" by "+data.user.username+"</a>";
    $.header.style.display = "block";
    play(data.id);
  }, function () {
    alert(url + " is not a valid soundcloud track url.")
  })
}

window.smoothstep = function (min, max, value) {
  var x = Math.max(0, Math.min(1, (value-min)/(max-min)));
  return x*x*(3 - 2*x);
}

window.lerp = function (v0, v1, t) {
    return v0*(1-t)+v1*t
}

window.lerpColor = function(a, b, amount) { 

    var ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);

    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}
