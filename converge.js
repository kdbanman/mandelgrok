// GLOBAL STATE

// sequences to plot
var newSeqs = new MRUQueue(30),
// plot boundaries for zooming
    x_min = -2,
    x_max = 2,
    y_min = -2,
    y_max = 2;

// APP FUNCTIONS
var plotDist = function (newSeqs) {
    var canvas = document.getElementById('dist_canvas');
    var ctx = canvas.getContext("2d");

    // start with dark grey background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    newSeqs.forEach(function (newSeq, age) {
        // fade with age, sharply at first
        var alpha = Math.pow(1.0 - 0.9 * age / newSeqs.length, 8); 
        alpha = Math.max(0.001, alpha);

        // newest sequence is slightly larger and outlined
        var size = age === 0 ? 4 : 3;
        if (age === 0) {
            ctx.strokeStyle = 'hsl(320,100%,20%)';
        }
        
        var maxDist = 0.0,
            maxDelta = 0.0,
            i;
        for (i = 0; i < newSeq.length; i++) {
            maxDist = Math.max(maxDist, newSeq.getDist(i));
            maxDelta = Math.max(maxDelta, newSeq.getDelta(i));
        }
        if (maxDist === 0) maxDist = 1;
        if (maxDelta === 0) maxDelta = 1;
            
        var div = canvas.height/ newSeq.length;

        for (i = 0; i < newSeq.length; i++) {
            var val = newSeq.getDist(i);
            var x = Math.floor(canvas.width * val / maxDist * 0.8);
            var y = Math.floor(i * div);

            ctx.fillStyle = 'hsla(0,50%,80%,' + alpha + ')';

            ctx.fillRect(x - size / 2,
                         y - size / 2,
                         size,
                         Math.max(div, size));
            if (age === 0)
                ctx.strokeRect(x - size / 2,
                               y - size / 2,
                               size,
                               Math.max(div, size));
        }
    });
};

var plotSeq = (function () {
    var boundary = [x_min, x_max, y_min, y_max];
    var currImg = undefined;

    var boundsChanged = function () {
        var changed = x_min !== boundary[0] ||
                      x_max !== boundary[1] ||
                      y_min !== boundary[2] ||
                      y_max !== boundary[3];

        if (changed) {
            boundary[0] = x_min;
            boundary[1] = x_max;
            boundary[2] = y_min;
            boundary[3] = y_max;

            return changed;
        }
    };

    return function (newSeqs, forceRedraw) {
        var canvas = document.getElementById("plot_canvas");
        var ctx = canvas.getContext("2d");

        // if boundaries changed or saved image exists
        // render mandelbrot and save canvas
        if (boundsChanged() || currImg === undefined || forceRedraw) {
            currImg = renderMandelbrot(canvas, boundary, 4);
        } else {
            // restore canvas image
            ctx.putImageData(currImg, 0,0);
        }

        // scale from [x_min,y_min],[x_max,y_max] to [0,height],[width,0]
        var xScale = function (x) {
            return Math.floor((x - x_min) * canvas.width / (x_max - x_min));
        };
        var yScale = function (y) {
            return Math.floor(canvas.height - (y - y_min) * canvas.height / (y_max - y_min));
        };

        newSeqs.forEach(function (newSeq, age) {
            // fade with age, sharply at first
            var alpha = Math.pow(1.0 - 0.9 * age / newSeqs.length, 8); 
            alpha = Math.max(0.1, alpha);

            // newest sequence is slightly larger and outlined
            var size = age === 0 ? 4 : 3;
            if (age === 0) {
                ctx.strokeStyle = 'hsl(320,80%,20%)';
            }

            for (i = 0; i < newSeq.length; i++) {
                // do not render stable trails
                if (newSeq.getDelta(i) > (x_max - x_min) / canvas.width / 2) {
                    var z = newSeq.z_hist[i];
                    x = Math.floor(xScale(z.re));
                    y = Math.floor(yScale(z.im));

                    // do not render off canvas
                    if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
                        ctx.fillStyle = 'hsla(0,50%,80%,' + alpha + ')';

                        ctx.fillRect(x - size / 2, y - size / 2, size, size);
                        if (age === 0)
                            ctx.strokeRect(x - size / 2, y - size / 2, size, size);
                    }
                }
            }
        });
    };
})()

var render = function (newSeqs, forceRedraw) {
    plotDist(newSeqs);
    plotSeq(newSeqs, forceRedraw);
};

var newBounded = function (x, y) {
    if (x === undefined) x = x_min + (x_max - x_min) / 2;
    if (y === undefined) y = y_min + (y_max - y_min) / 2;

    newSeqs.push(new MandelSeq(x, y));
    render(newSeqs);
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

// fill container divs with canvas
var resize = function () {

    var fill = function (canv, cont) {
        canv.height(cont.height())
        canv.attr('height', cont.height());

        canv.width(cont.width());
        canv.attr('width', cont.width());
    };

    fill($('#plot_canvas'), $('#plot'));
    fill($('#dist_canvas'), $('#dist'));

    render(newSeqs, true);
};

// EVENT LISTENERS
document.getElementById("plot_canvas").addEventListener('mousemove', function (event) {
    var mouse = getMousePos(event, x_min, x_max, y_min, y_max);
    newBounded(mouse.x, mouse.y);
});

$(window).resize(resize);

// INIT BEHAVIOUR
resize();
render(newSeqs, true);
