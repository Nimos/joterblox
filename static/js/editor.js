
// File Handler and related stuff
function handleFileSelect(evt) {
  var files = evt.target.files;
  var reader = new FileReader();
  reader.onload = (function(theFile) {
    var reader = new FileReader();
    return function(e) {
      setImage(e.target.result)
    };
  })(files[0]);
  reader.readAsDataURL(files[0]);
}
document.getElementById('files').addEventListener('change', handleFileSelect, false);

var setImage = function (dataurl) {
  var i = new Image();
  i.src = dataurl;
  image = i;
  width = i.width;
  height = i.height;

  c.width = width+4;
  c.height = height+4;
}


// Create a pattern for to mark collision zones
var pattern = document.createElement('canvas');
pattern.width = 30;
pattern.height = 10
var pctx = pattern.getContext("2d")
pctx.fillStyle = "rgba(0,0,0,0.5)"
pctx.fillRect(0,0,30, 20)
pctx.translate(pattern.width / 2, pattern.height / 2);
pctx.rotate(45*Math.PI/180)
pctx.fillStyle = "rgba(255, 255, 0, 0.5)"
pctx.fillRect(-pattern.width/2,-pattern.height/2,100,10)

// Vars
var image;
var width;
var height;
var cursor = [0, 0];
var rects = [];
var spawns = [];
var powerups = [];
var hist = [];
var ctx = c.getContext("2d")
var pt = ctx.createPattern(pattern, "repeat");
var previewRekt = [0,0,0,0];

// Draw rects and everything
var draw = function () {
  ctx.clearRect(0,0,c.width, c.height)
  drawCursor();
  if (image) ctx.drawImage(image, 2,2);
  ctx.fillStyle = pt;
  for (var i=0; i<rects.length; i++) {
    var r = rects[i];
    ctx.fillRect(r[0]+2, r[1]+2, r[2], r[3])
  }
  var r = previewRekt
  ctx.fillRect(r[0], r[1], r[2], r[3])
  var fs = ["#000", "#00F", "#F00"]
  ctx.fillStyle = fs[bs0.value];
  ctx.fillRect(0,0,c.width,2);
  ctx.fillStyle = fs[bs1.value];
  ctx.fillRect(c.width-2,0,2,c.height);
  ctx.fillStyle = fs[bs2.value];
  ctx.fillRect(0,c.height-2,c.width,2);
  ctx.fillStyle = fs[bs3.value];
  ctx.fillRect(0,0,2,c.height);

  ctx.fillStyle = "white";
  for (var i=0; i<spawns.length; i++) {
    var s = spawns[i];
    ctx.fillRect(s[0]-5, s[1]-5, 10, 10);
    ctx.strokeRect(s[0]-5, s[1]-5, 10, 10);
  }

  ctx.fillStyle = "#0f0";
  for (var i=0; i<powerups.length; i++) {
    var s = powerups[i];
    ctx.fillRect(s[0]-10, s[1]-10, 20, 20);
    ctx.strokeRect(s[0]-10, s[1]-10, 20, 20);
  }

  drawCursor();
  requestAnimationFrame(draw);
}


// draw mouse cursor
var drawCursor = function () {
    ctx.strokeRect(cursor[0] - 1, cursor[1] - 1, 2, 2);
    ctx.beginPath();
    ctx.moveTo(cursor[0] + 4, cursor[1] + 4);
    ctx.lineTo(cursor[0] - 4, cursor[1] - 4);
    ctx.moveTo(cursor[0] - 4, cursor[1] + 4);
    ctx.lineTo(cursor[0] + 4, cursor[1] - 4);
    ctx.stroke();
}


// Mouse handlers
var dragging = -1;
var start = [0,0];
c.addEventListener("mousedown", function(e){
  if (e.button != 0) return 1;
  if (tool.value == "c") {
    start = [e.offsetX, e.offsetY];
    dragging = 0;
    hist.push("c");
  } else if (tool.value == "s") {
    hist.push("s");
    spawns.push([e.offsetX, e.offsetY]);
  } else if (tool.value == "p") {
    hist.push("p");
    powerups.push([e.offsetX, e.offsetY]);
  }
  generateResult();
}, false);
c.addEventListener("mousemove", function(e){
    cursor = [e.offsetX, e.offsetY];
    if (tool.value == "c") {
      if (dragging != -1) {
        dragging = 1;
      } else {
        return;
      }
      var end = [e.offsetX, e.offsetY];
      var rectsize = [end[0]-start[0], end[1]-start[1]]
      previewRekt = [start[0], start[1], rectsize[0], rectsize[1]]
    }
}, false);
c.addEventListener("mouseup", function(e){
  if (tool.value == "c") {
    var end = [e.offsetX, e.offsetY];
    var rectsize = [end[0]-start[0], end[1]-start[1]]
    previewRekt = [0,0,0,0];
    if(dragging === 1 && Math.abs(rectsize[0]) > 1 && Math.abs(rectsize[1]) > 1){
        rects.push([start[0]-2, start[1]-2, rectsize[0], rectsize[1]]);
        generateResult();
    }
    dragging= -1;
  }
}, false);
c.addEventListener("contextmenu", function (e) {
  var t = hist.pop();
  if (t=="c") {
    rects.pop();
  } else if (t=="s") {
    spawns.pop();
  } else if (t=="p") {
    powerups.pop();
  }
  generateResult();
  e.preventDefault();
  return false;
})


// Output
var generateResult = function () {
  var result = "{\n"
  result += "\t\"size\": ["+width+","+height+"],\n"
  result += "\t\"rects\": [";
  for (var i=0; i<rects.length; i++) {
    var r = [rects[i][0], rects[i][1], rects[i][2], rects[i][3]];
    r[1] = height-r[1];
    r[3] *= -1;
    if (r[2] < 0) {
      r[0]+=r[2];
      r[2]= r[2]*-1;
    }
    if (r[3] < 0) {
      r[1] += r[3];
      r[3] = r[3]*-1;
    }
    result += "\n\t\t["+r[0]+","+r[1]+","+r[2]+","+(r[3])+"],"
  }
  result = result.slice(0,-1);
  result += "\n\t],\n";
  result += "\t\"backgroundImage\": \"\",\n"
  result += "\t\"foregroundImage\": \"\",\n"
  result += "\t\"bounds\": ["+bs0.value+","+bs1.value+","+bs2.value+","+bs3.value+"],\n"
  result += "}"

  document.getElementById('result').value = result;
}

var generateResult = function () {
  var result = {}
  result["size"] = [width, height];
  result["rects"] =[]
  for (var i=0; i<rects.length; i++) {
    var r = [rects[i][0], rects[i][1], rects[i][2], rects[i][3]];
    r[1] = height-r[1];
    r[3] *= -1;
    if (r[2] < 0) {
      r[0]+=r[2];
      r[2]= r[2]*-1;
    }
    if (r[3] < 0) {
      r[1] += r[3];
      r[3] = r[3]*-1;
    }
    result["rects"].push(r);
  }
  console.log(result);

  result["powerups"] = []
  for (var i=0; i<powerups.length; i++) {
    var r = [powerups[i][0], powerups[i][1]];
    r[1] = height-r[1];
    result["powerups"].push(r);
  }

  result["spawns"] = []
  console.log(spawns)
  for (var i=0; i<spawns.length; i++) {
    var r = [spawns[i][0], spawns[i][1]];
    r[1] = height-r[1];
    console.log(r);
    result["spawns"].push(r);
  }

  result["backgroundImage"] = "";
  result["foregroundImage"] = "";
  result["bounds"] = [parseInt(bs0.value), parseInt(bs1.value), parseInt(bs2.value), parseInt(bs3.value)];
  document.getElementById('result').value = JSON.stringify(result,null, 3);
}

document.getElementById('result').oninput = function (e) {
  var m = eval("m = "+this.value)
  width = m.size[0];
  height = m.size[1];
  c.width = width+2;
  c.height = height+2;
  bs0.value = m.bounds[0];
  bs1.value = m.bounds[1];
  bs2.value = m.bounds[2];
  bs3.value = m.bounds[3];
  rects = [];
  for (var i=0; i<m.rects.length; i++) {
    r=m.rects[i];
    r[1] = height-r[1];
    r[3] *= -1;
    rects.push(r);
  }
  powerups = []
  for (var i=0; i<m.powerups.length; i++) {
    var r=m.powerups[i];
    r[1] = height-r[1];
    powerups.push(r);
  }
  spawns = []
  for (var i=0; i<m.spawns.length; i++) {
    var r=m.spawns[i];
    r[1] = height-r[1];
    spawns.push(r);
  }

  generateResult();
}

bs0.onchange = generateResult;
bs1.onchange = generateResult;
bs2.onchange = generateResult;
bs3.onchange = generateResult;


generateResult();
draw();