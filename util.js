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

MandelSeq.prototype.getDist = function (i) {
    return this.dist_hist[i];
}

MandelSeq.prototype.getDelta = function (i) {
    return this.delta_hist[i];
}

// queue structure that pushes FILO, and iterates last-to-first
var MRUQueue = function (len) {
    this.maxLength = len;
    this.length = 0;
    this.queue = [];
}

MRUQueue.prototype.push = function (newSeq) {
    // if the queue is full, then shift queue towards end
    if (this.queue.length === this.maxLength) {
        // walk from the final (oldest) element to the second newest element
        for (var i = this.queue.length - 1; i > 0; i--) {
            // replace the current element with the newer element
            this.queue[i] = this.queue[i - 1];
        }
        // insert new sequence
        this.queue[0] = newSeq;
    } else {
        // queue is not full, so just prepend the sequence to the queue
        this.queue.unshift(newSeq);
    }

    this.length = this.queue.length;

    return this;
};

MRUQueue.prototype.forEach = function (fun) {
    for (var i = this.queue.length - 1; i >= 0; i--) {
        fun(this.queue[i], i);
    }
};

var renderMandelbrot = function (canvas, boundary, pixelSize) {
    pixelSize = pixelSize || 2;
    var ctx = canvas.getContext("2d");

    var x_min = boundary[0],
        x_max = boundary[1],
        y_min = boundary[2],
        y_max = boundary[3];

    // scale from [0,width],[height, 0] to [x_min,x_max],[y_min,y_max]
    var xPos = function (x) {
        return x / canvas.width * (x_max - x_min) + x_min;
    }
    var yPos = function (y) {
        return (canvas.height - y) / canvas.height * (y_max - y_min) + y_min;
    }

    var max_divDelta = max_convDelta = 0;
    var coords = [];
    for (var i = 0; i < canvas.width; i += pixelSize) {
        for (var j = 0; j < canvas.height; j += pixelSize) {
            var coord = new MandelSeq(xPos(i), yPos(j));

            coord.i = i;
            coord.j = j;

            coord.deltaSum = 0;
            for (var n = 0; n < coord.length; n++) {
                coord.deltaSum += coord.getDelta(n);
            }
            if (coord.divergent) {
                max_divDelta  = Math.max(coord.deltaSum, max_divDelta);
            } else {
                max_convDelta = Math.max(coord.deltaSum, max_convDelta);
            }

            coords.push(coord);
        }
    }

    coords.forEach(function (coord) {
        var stability,
            sat,
            val;
        if (coord.divergent) {
            stability = coord.deltaSum / max_divDelta;
            // divergent cells are grayscale
            sat = 0;
            // i don't know what this means for divergent cells...
            val = Math.floor(100 - 80 * stability);
        } else {
            stability = coord.deltaSum / max_convDelta;
            // high stability means desaturated and dark
            //sat = Math.floor(100 - 80 * stability);
            sat = 100;
            val = Math.floor(50 - 50 * stability);

            window.debug = 0;
            if (window.debug++ % 100 === 0) console.log(sat);
        }

        ctx.fillStyle = 'hsl(60,'+sat+'%,'+val+'%)';
        ctx.fillRect(coord.i, coord.j, pixelSize, pixelSize)
    });

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
