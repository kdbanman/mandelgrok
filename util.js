


// Z is a complex number.
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
};

Z.prototype.next = function (c) {
    var next_re = this.re * this.re - this.im * this.im + c.re;
    var next_im = 2 * this.re * this.im + c.im;

    return new Z(next_re, next_im);
};


// A much faster Mandelbrot coordinate, without the time/memory overhead of keeping sequence history.
var MandelCoord = function (re, im, maxIter) {
    maxIter = maxIter || 500;

    this.c = new Z(re, im);

    this.deltaSum = 0;

    var currZ = new Z(0,0);
    var currIter = 0;
    var nextZ;
    while (currIter < maxIter && currZ.mag() < 2) {
        nextZ = currZ.next(this.c);
        this.deltaSum += currZ.dist(nextZ);
        currZ = nextZ;
        currIter += 1;
    }

    this.divergent = currIter < maxIter;
    this.escaped = this.divergent ? currIter : undefined;
    this.length = currIter;
};


// Mandelbrot Sequence generator
var MandelSeq = function (re, im, length) {
    length = length || 150;
    this.length = length;

    // define constant coordinate
    this.c = new Z(re, im);

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
};

MandelSeq.prototype.getDelta = function (i) {
    return this.delta_hist[i];
};



// queue structure that pushes FILO, and iterates last-to-first
var MRUQueue = function (len) {
    this.maxLength = len;
    this.length = 0;
    this.queue = [];
};

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

MRUQueue.prototype.first = function () {
    return this.queue[0];
};

MRUQueue.prototype.forEach = function (fun) {
    for (var i = this.queue.length - 1; i >= 0; i--) {
        fun(this.queue[i], i);
    }
};