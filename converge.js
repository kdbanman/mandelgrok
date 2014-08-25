// GLOBAL STATE
var newSeqs = new MRUQueue(30),
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
    var oldBoundary = [x_min, x_max, y_min, y_max];

    var boundsChanged = function () {
        var changed = x_min !== oldBoundary[0] ||
                      x_max !== oldBoundary[1] ||
                      y_min !== oldBoundary[2] ||
                      y_max !== oldBoundary[3];

        if (changed) {
            oldBoundary[0] = x_min;
            oldBoundary[1] = x_max;
            oldBoundary[2] = y_min;
            oldBoundary[3] = y_max;

            return changed;
        }
    };

    return function (newSeqs) {
        var canvas = document.getElementById("plot_canvas");
        var ctx = canvas.getContext("2d");

        // if boundaries unchanged && canvas saved, reset canvas state
        // else render mandelbrot and save canvas
        if (boundsChanged) {
            ctx.fillStyle = "#ededed";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // scale from [-2,-2],[2,2] to [0,height],[width,0]
        var xScale = function (x) {
            return Math.floor((x + 2) * canvas.width / 4);
        };
        var yScale = function (y) {
            return Math.floor(canvas.height - (y + 2) * canvas.height / 4);
        };

        newSeqs.forEach(function (newSeq, age) {
            // fade with age, sharply at first
            var alpha = Math.pow(1.0 - 0.9 * age / newSeqs.length, 8); 
            alpha = Math.max(0.001, alpha);

            // newest sequence is slightly larger and outlined
            var size = age === 0 ? 4 : 3;
            if (age === 0) {
                ctx.strokeStyle = 'hsl(320,100%,20%)';
            }

            // plot c value
            var x = xScale(newSeq.c.re);
            var y = yScale(newSeq.c.im);
            ctx.fillStyle = "rgba(0,100,30,0.4)";
            ctx.fillRect(x - size / 2, y - size / 2, size, size);

            var redMax = 60;
            for (i = 0; i < newSeq.length; i++) {

                var z = newSeq.z_hist[i];
                x = Math.floor(xScale(z.re));
                y = Math.floor(yScale(z.im));

                var red = Math.floor(redMax - redMax * i / newSeq.length);
                ctx.fillStyle = 'rgba(' + red + ',0,0,' + alpha + ')';

                ctx.fillRect(x - size / 2, y - size / 2, size, size);
            }
        });
    };
})()

var render = function (newSeqs) {
    plotDist(newSeqs);
    plotSeq(newSeqs);
};

var newBounded = function (x, y) {
    if (x === undefined) x = Math.random() * 4 - 2.0;
    if (y === undefined) x = Math.random() * 4 - 2.0;

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
};

// EVENT LISTENERS
document.getElementById("plot_canvas").addEventListener('mousemove', function (event) {
    var mouse = getMousePos(event, -2.0, 2.0, -2.0, 2.0);
    newBounded(mouse.x, mouse.y);
});

$(window).resize(resize);

// INIT BEHAVIOUR
resize();
newBounded(0,0);
