// Z is a complex coord.
// Multiply with another with Z.mult(z).
// Calculate distance with Z.dist(z).
// Calculate it's magnitude with Z.mag().
// Generate it's Mandelbrot successor with Z.next(c).
var Z = function (re, im) {
    this.re = re;
    this.im = im;
};

Z.prototype.mult = function (z) {
    return new Z(this.re * z.re - this.im * z.im,
                 this.re * z.im + this.im * z.re);
};

Z.prototype.dist = function (z) {
    return Math.sqrt(
        (this.re - z.re) * (this.re - z.re) + 
        (this.im - z.im) * (this.im - z.im)
    );
};

Z.prototype.mag = function () {
    return this.dist(new Z(0,0));
}

Z.prototype.next = function (c) {
    var next_re = this.re * this.re - this.im * this.im + c.re;
    var next_im = 2 * this.re * this.im + c.im;

    return new Z(next_re, next_im);
};

// Mandelbrot Sequence generator
var MandelSeq = function (re, im, length) {
    length = length || 500;
    this.length = length;

    // define constant coordinate
    this.c = new Z(re, im)

    // track sequence history
    this.z_hist = [new Z(0,0)];     // history of z
    this.dist_hist = [0];  // history of z distance from c
    this.delta_hist = [0]; // history of z_n distance from z_n-1

    var curr = this.z_hist[this.z_hist.length - 1];
    while (this.z_hist.length < length && curr.mag() < 2) {
        curr = this.z_hist[this.z_hist.length - 1];
        var next = curr.next(this.c);

        this.z_hist.push(next);
        this.dist_hist.push(this.c.dist(next));
        this.delta_hist.push(curr.dist(next));
    }

    this.divergent = this.z_hist.length < length;
    this.escaped = this.divergent ? this.z_hist.length : undefined;
    this.length = this.z_hist.length;
};

var plotDist = function (newSeq, size) {
    size = size || 3;
    var prefix = 'dist';

    var canvas = document.getElementById(prefix + "_canvas");
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var maxH = 0.0,
        i;
    for (i = 0; i < newSeq.length; i++) {
        maxH = Math.max(maxH, newSeq[prefix + '_hist'][i]);
    }
    maxH *= 1.2
        
    var div = Math.floor(canvas.width / newSeq.length);

    var redMax = 100;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    for (i = 0; i < newSeq.length; i++) {
        var val = newSeq[prefix + '_hist'][i];
        var x = Math.floor(i * div);
        var y = Math.floor(canvas.height - canvas.height * val / maxH);

        var red = Math.floor(redMax - redMax * i / newSeq.length);
        ctx.fillStyle = "rgba(" + red + ",0,0,0.5)";
        ctx.fillRect(x - size / 2, y - size / 2, div, size);
    }
};

var plotSeq = function (newSeq, size) {
    size = size || 4;

    var canvas = document.getElementById("plot_canvas");
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(255,255,255,0.01)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // scale from [-2,-2],[2,2] to [0,height],[width,0]
    var xScale = function (x) {
        return Math.floor((x + 2) * canvas.width / 4);
    };
    var yScale = function (y) {
        return Math.floor(canvas.height - (y + 2) * canvas.height / 4);
    };

    // plot c value
    var x = xScale(newSeq.c.re);
    var y = yScale(newSeq.c.im);
    ctx.fillStyle = "rgba(0,100,30,0.4)"
    ctx.fillRect(x - size / 2, y - size / 2, size, size);

    var redMax = 60;
    for (i = 0; i < newSeq.length; i++) {

        var z = newSeq.z_hist[i];
        x = Math.floor(xScale(z.re));
        y = Math.floor(yScale(z.im));

        var red = Math.floor(redMax - redMax * i / newSeq.length);
        ctx.fillStyle = "rgba(" + red + ",0,0,0.1)";
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
}

var render = function (newSeq) {
    plotDist(newSeq);
    plotSeq(newSeq);
};

var newBounded = function (x, y) {
    if (x === undefined) x = Math.random() * 4 - 2.0;
    if (y === undefined) x = Math.random() * 4 - 2.0;

    var m = new MandelSeq(x, y);
    //while (m.divergent) m = new MandelSeq(Math.random() * 2, Math.random() * 2);
    render(m, 2);
};

var getMousePos = function (evt, x_min, x_max, y_min, y_max) {
    var canv = document.getElementById("plot_canvas");
    var rect = canv.getBoundingClientRect();

    var x = evt.clientX - rect.left;
    var y = evt.clientY - rect.top;

    var trans_x = (x_max - x_min) * x / canv.width + x_min;
    var trans_y = (y_max - y_min) * (canv.height - y) / canv.height+ y_min;

    return {
        x: trans_x,
        y: trans_y
    };
};

document.getElementById("plot_canvas").addEventListener('mousemove', function (event) {
    var mouse = getMousePos(event, -2.0, 2.0, -2.0, 2.0);
    newBounded(mouse.x, mouse.y);
});

newBounded();
