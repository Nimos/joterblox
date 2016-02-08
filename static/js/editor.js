
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

  c.width = width;
  c.height = height;
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
var ctx = c.getContext("2d")
var pt = ctx.createPattern(pattern, "repeat");
var previewRekt = [0,0,0,0];

// Draw rects and everything
var draw = function () {
  ctx.clearRect(0,0,c.width, c.height)
  if (image) ctx.drawImage(image, 0,0);
  ctx.fillStyle = pt;
  for (var i=0; i<rects.length; i++) {
    var r = rects[i];
    ctx.fillRect(r[0], r[1], r[2], r[3])
  }
  var r = previewRekt
  ctx.fillRect(r[0], r[1], r[2], r[3])
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
    start = [e.offsetX, e.offsetY];
    dragging = 0;
}, false);
c.addEventListener("mousemove", function(e){
    cursor = [e.offsetX, e.offsetY];
    if (dragging != -1) {
      dragging = 1;
    } else {
      return;
    }
    var end = [e.offsetX, e.offsetY];
    var rectsize = [end[0]-start[0], end[1]-start[1]]
    previewRekt = [start[0], start[1], rectsize[0], rectsize[1]]
}, false);
c.addEventListener("mouseup", function(e){
    var end = [e.offsetX, e.offsetY];
    var rectsize = [end[0]-start[0], end[1]-start[1]]
    previewRekt = [0,0,0,0];
    if(dragging === 1 && Math.abs(rectsize[0]) > 1 && Math.abs(rectsize[1]) > 1){
        rects.push([start[0], start[1], rectsize[0], rectsize[1]]);
        generateResult();
    }
    dragging= -1;
}, false);
c.addEventListener("contextmenu", function (e) {
  rects.pop();
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
    console.log(r[3])
    if (r[3] < 0) {
      r[1] += r[3];
      r[3] = r[3]*-1;
    }
    result += "\n\t\t["+r[0]+","+r[1]+","+r[2]+","+(r[3])+"],"
  }
  result = result.slice(0,-1);
  result += "\n\t],\n";
  result += "\t\"backgroundImage\": \"\",\n"
  result += "\t\"foregroundImage\": \"\"\n"
  result += "}"

  document.getElementById('result').value = result;
}
generateResult();
draw();