function Brush()
{
  Module.call(this,"brush");

  this.speed = 0;
  this.swatch = new Swatch();

  this.pointers = [
    new Pointer({offset:{x:0,y:0}})
  ];

  this.methods.add = new Method("add","x,y&mirror_x,mirror_y","Add a new pointer to the brush",function(q){
    var offset = q.length ? q[0] : q;
    var mirror = q.length ? q[1] : null;
    ronin.brush.pointers.push(new Pointer({offset:offset,mirror:mirror}));
  })

  this.methods.remove = new Method("remove","","Remove last pointer",function(q){
    ronin.brush.pointers.pop();
  })

  this.methods.pick = new Method("pick","x,y","Set brush color to a position's pixel.",function(q){
    var pixel = (ronin.commander.input_el.value == "~" ? ronin.guide: ronin.cursor.target).context() .getImageData(q.x*2, q.y*2, 1, 1).data;
    var c = new Color().rgb_to_hex(pixel);
    var color = new Color(c);
    ronin.cursor.color = color.hex;
    ronin.hint.update();
  })

  this.methods.set_color = new Method("set_color","#ff0033","Set color",function(q){
    ronin.cursor.color = q;
  })

  this.absolute_thickness = 0;

  this.thickness = function(line)
  {
    var ratio = clamp(1 - (ronin.brush.speed/20),0,1)
    var t = ronin.cursor.size * ratio;
    this.absolute_thickness = t > this.absolute_thickness ? this.absolute_thickness+0.25 : this.absolute_thickness-0.25;
    return this.absolute_thickness;
  }

  this.stroke = function(line)
  {
    this.speed = distance_between(line.from,line.to);

    for(pointer_id in this.pointers){
      this.pointers[pointer_id].stroke(line);
    }
  }

  this.erase = function(line)
  {
    this.speed = distance_between(line.from,line.to);

    for(pointer_id in this.pointers){
      this.pointers[pointer_id].stroke(line,true);
    }
  }

  this.pick = function(line)
  {
    if(!line.to){
      line.to = line.from
    }

    var pixel = ronin.cursor.target.context().getImageData(line.to.x*2, line.to.y*2, 1, 1).data;
  }

  this.mod_size = function(mod)
  {
    ronin.cursor.size = clamp(parseInt(ronin.cursor.size)+mod,1,100);
  }

  function clamp(v, min, max)
  { 
    return v < min ? min : v > max ? max : v; 
  }

  function distance_between(a,b)
  {
    return a && b ? Math.sqrt( (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y) ) : 0;
  }
}

function Pointer(options)
{
  this.options = options;

  this.stroke = function(line,erase = false)
  {
    var ctx = ronin.cursor.target.context();

    if(this.options.mirror){
      line.from.x = (this.options.mirror.x *2) - line.from.x;
      line.to.x = (this.options.mirror.x*2) - line.to.x;  
    }

    if(!line.to){
      line.to = line.from
    }

    ctx.beginPath();
    ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
    ctx.moveTo((line.from.x * 2) + this.options.offset.x,(line.from.y * 2) + this.options.offset.y);
    ctx.lineTo((line.to.x * 2) + this.options.offset.x,(line.to.y * 2) + this.options.offset.y);
    ctx.lineCap="round";
    ctx.lineWidth = ronin.brush.thickness(line);
    ctx.strokeStyle = ronin.brush.swatch.color();
    ctx.stroke();
    ctx.closePath();
  }

  function clamp(v, min, max)
  { 
    return v < min ? min : v > max ? max : v; 
  }
}