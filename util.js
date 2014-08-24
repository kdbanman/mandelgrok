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

