

var renderDistancePlot = function (sequenceQueue) {
    var canvas = document.getElementById('dist_canvas');
    var ctx = canvas.getContext("2d");

    // start with dark grey background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    sequenceQueue.forEach(function (sequence, age) {
        // fade with age, sharply at first
        var alpha = Math.pow(1.0 - 0.9 * age / sequenceQueue.length, 8);
        alpha = Math.max(0.001, alpha);

        // newest sequence is slightly larger and outlined
        var size = age === 0 ? 4 : 3;
        if (age === 0) {
            ctx.strokeStyle = POINT_STROKE_COLOR;
            ctx.lineWidth = POINT_STROKE_WEIGHT;
        }

        var maxDist = 0.0,
            i;
        for (i = 0; i < sequence.length; i++) {
            maxDist = Math.max(maxDist, sequence.getDist(i));
        }
        if (maxDist === 0) maxDist = 1;

        var div = canvas.height/ sequence.length;

        for (i = 0; i < sequence.length; i++) {
            var val = sequence.getDist(i);
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


var renderMandelbrot = function (canvas, boundary, pixelSize, finishedRender) {
    pixelSize = pixelSize || 2;
    var ctx = canvas.getContext("2d");

    var x_min = boundary[0],
        x_max = boundary[1],
        y_min = boundary[2],
        y_max = boundary[3];

    // scale from [0,width],[height, 0] to [x_min,x_max],[y_min,y_max]
    var xPos = function (x) {
        return x / canvas.width * (x_max - x_min) + x_min;
    };
    var yPos = function (y) {
        return (canvas.height - y) / canvas.height * (y_max - y_min) + y_min;
    };

    var maxDivergentDelta = 0,
        maxConvergentDelta = 0,
        col = 0,
        row = 0;
    var coords = [];

    var drawCoord = function (coord) {
        var stability,
            val;
        if (coord.divergent) {
            stability = coord.deltaSum / maxDivergentDelta;
            // i don't know what this means for divergent cells...
            val = Math.floor(100 - 80 * Math.sqrt(stability));
        } else {
            stability = coord.deltaSum / maxConvergentDelta;
            // high stability means desaturated and dark
            val = Math.floor(20 - 20 * stability);
        }

        ctx.fillStyle = 'hsl(0,0%,'+val+'%)';
        ctx.fillRect(coord.i, coord.j, pixelSize, pixelSize)
    };

    var cancel = false;
    var processCol = function () {
        for (row = 0; row < canvas.height; row += pixelSize) {
            var coord = new MandelCoord(xPos(col), yPos(row));

            coord.i = col;
            coord.j = row;

            if (coord.divergent) {
                maxDivergentDelta = Math.max(coord.deltaSum, maxDivergentDelta);
            } else {
                maxConvergentDelta = Math.max(coord.deltaSum, maxConvergentDelta);
            }

            coords.push(coord);

            drawCoord(coord);
        }
        if (col < canvas.width && !cancel) {
            col += pixelSize;
            setTimeout(processCol, 1);
        } else {
            coords.forEach(drawCoord);
            finishedRender(ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
    };
    processCol();

    return function () {
        cancel = true;
    };
};


var renderComplexPlane = (function () {
    var boundary = [x_min, x_max, y_min, y_max];
    var currImg = undefined;
    var minimapImg = undefined;

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

    function renderSequences(canvas, sequences, boundary, ctx) {
        // scale from [x_min,y_min],[x_max,y_max] to [0,height],[width,0]
        var x_min = boundary[0],
            x_max = boundary[1],
            y_min = boundary[2],
            y_max = boundary[3];

        var xScale = function (x) {
            return Math.floor((x - x_min) * canvas.width / (x_max - x_min));
        };
        var yScale = function (y) {
            return Math.floor(canvas.height - (y - y_min) * canvas.height / (y_max - y_min));
        };

        sequences.forEach(function (sequence, age) {
            // fade with age, sharply at first
            var alpha = Math.pow(1.0 - 0.9 * age / sequences.length, 8);
            alpha = Math.max(0.1, alpha);

            // newest sequence is slightly larger and outlined
            var size = age === 0 ? 4 : 3;
            if (age === 0) {
                ctx.strokeStyle = POINT_STROKE_COLOR;
                ctx.lineWidth = POINT_STROKE_WEIGHT;
            }

            for (var i = 0; i < sequence.length; i++) {
                // do not render stable trails
                if (sequence.getDelta(i) > (x_max - x_min) / canvas.width / 2) {
                    var z = sequence.z_hist[i];
                    var x = Math.floor(xScale(z.re));
                    var y = Math.floor(yScale(z.im));

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
    }

    return function (sequences, forceRedraw, finishedAsync) {
        var canvas = document.getElementById("plot_canvas");
        var ctx = canvas.getContext("2d");

        var minimapCanvas = document.getElementById("minimap_canvas");
        var minimapCtx = minimapCanvas.getContext("2d");

        var cancelAsync;

        // if boundaries changed or saved image does not exist
        // render mandelbrot and save canvas
        if (boundsChanged() || currImg === undefined || forceRedraw) {
            var loadingModal = $(".loadingModal");

            renderMandelbrot(minimapCanvas, HOME_BOUNDARY, 2, function (img) {
                minimapImg = img;
                minimapCtx.putImageData(minimapImg, 0, 0);
            });

            loadingModal.show();
            cancelAsync = renderMandelbrot(canvas, boundary, MAIN_PIXEL_SIZE, function (img) {
                currImg = img;
                ctx.putImageData(currImg, 0, 0);
                renderSequences(canvas, sequences, boundary, ctx);

                loadingModal.hide();

                if (typeof finishedAsync === 'function') {
                    finishedAsync();
                }
            });
        } else {
            // restore canvas image
            ctx.putImageData(currImg, 0, 0);
        }
        renderSequences(canvas, sequences, boundary, ctx);

        if (minimapImg != null) {
            minimapCtx.putImageData(minimapImg, 0, 0);
        }
        renderSequences(minimapCanvas, sequences, HOME_BOUNDARY, minimapCtx);

        return cancelAsync;
    };
})();