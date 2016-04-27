

// SETTINGS
var MAIN_PIXEL_SIZE = 2;

// GLOBAL STACICS AND STATE
var POINT_STROKE_COLOR = 'hsl(320,80%,30%)';
var POINT_STROKE_WEIGHT = 1.5;

var HOME_BOUNDARY = [-1.6, 0.6, -1.1, 1.1];

// sequences to plot
var sequenceQueue = new MRUQueue(30);

// plot boundaries for zooming
var x_min = HOME_BOUNDARY[0],
    x_max = HOME_BOUNDARY[1],
    y_min = HOME_BOUNDARY[2],
    y_max = HOME_BOUNDARY[3];



// APP FUNCTIONS
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

var render = function (sequences, forceRedraw, finishedAsync) {
    renderDistancePlot(sequences);

    // return async cancellation callback
    return renderComplexPlane(sequences, forceRedraw, finishedAsync);
};

var addAndRenderSequence = function (x, y) {
    if (x === undefined) x = x_min + (x_max - x_min) / 2;
    if (y === undefined) y = y_min + (y_max - y_min) / 2;

    sequenceQueue.push(new MandelSeq(x, y));
    render(sequenceQueue);
};

var getMouseComplexPlanePosition = function (evt, x_min, x_max, y_min, y_max) {
    var canv = document.getElementById("plot_canvas");
    var rect = canv.getBoundingClientRect();

    var x = evt.clientX - rect.left;
    var y = evt.clientY - rect.top;

    var translatedX = (x_max - x_min) * x / canv.width + x_min;
    var translatedY = (y_max - y_min) * (canv.height - y) / canv.height+ y_min;

    return {
        x: translatedX,
        y: translatedY
    };
};

// fill container divs with canvas
var resize = (function () {

    var resizing = false;
    var anotherResizeQueued = false;
    var asyncCancel;

    var guardedResize = function () {
        if ($(window).height() < $('#minimap').height() * 1.3) {
            return;
        }

        if (resizing) {
            anotherResizeQueued = true;

            if (typeof asyncCancel === 'function') {
                asyncCancel();
            }

            return;
        }

        resizing = true;

        var fillContainerWithCanvas = function (canvas, container) {
            canvas.height(container.height());
            canvas.attr('height', container.height());

            canvas.width(container.width());
            canvas.attr('width', container.width());
        };

        fillContainerWithCanvas($('#plot_canvas'), $('#plot'));
        fillContainerWithCanvas($('#dist_canvas'), $('#dist'));
        fillContainerWithCanvas($('#minimap_canvas'), $('#minimap'));

        asyncCancel = render(sequenceQueue, true, function () {
            resizing = false;

            if (anotherResizeQueued) {
                anotherResizeQueued = false;
                guardedResize();
            }
        });
    };

    return guardedResize;
}());



// EVENT LISTENERS
var zoomInElement = $('.zoomIn');
var zoomOutElement = $('.zoomOut');
var zoomHelpShown = false;

var updateZoomUI = function () {
    var zoomHelp = $(".zoomHelp");
    if (!zoomHelpShown) {
        zoomHelp.css("visibility", "visible");
        zoomHelp.hide().fadeIn(400);
        setTimeout(function () {
            zoomHelp.fadeOut(2300, function () {
                zoomHelp.css("visibility", "hidden");
            });
        }, 4400);

        zoomHelpShown = true;
    }


    if (zoomInElement.hasClass('zoomSelected') || zoomOutElement.hasClass('zoomSelected')) {
        $('.zoomControls').addClass('zoomSelected');
    } else {
        $('.zoomControls').removeClass('zoomSelected');
    }

    if (zoomInElement.hasClass('zoomSelected')) {
        $('#plot_canvas').css('cursor', 'zoom-in');
    } else if (zoomOutElement.hasClass('zoomSelected')) {
        $('#plot_canvas').css('cursor', 'zoom-out');
    } else {
        $('#plot_canvas').css('cursor', 'default');
    }
};

document.getElementById("plot_canvas").addEventListener('mousemove', function (event) {
    if (!(zoomInElement.hasClass('zoomSelected') || zoomOutElement.hasClass('zoomSelected'))) {
        var complexPosition = getMouseComplexPlanePosition(event, x_min, x_max, y_min, y_max);
        addAndRenderSequence(complexPosition.x, complexPosition.y);
    }
});

document.getElementById("plot_canvas").addEventListener('click', function (event) {
    if (!(zoomInElement.hasClass('zoomSelected') || zoomOutElement.hasClass('zoomSelected'))) {
        return;
    }

    var currentBoundWidth = x_max - x_min;
    var currentBoundHeight = y_max - y_min;
    var zoomCenter, newBoundWidth, newBoundHeight;

    if (zoomInElement.hasClass('zoomSelected')) {
        zoomCenter = getMouseComplexPlanePosition(event, x_min, x_max, y_min, y_max);

        newBoundWidth = currentBoundWidth / 2;
        newBoundHeight = currentBoundHeight / 2;
    } else if (zoomOutElement.hasClass('zoomSelected')) {
        zoomCenter = {
            x: x_min + currentBoundWidth / 2,
            y: y_min + currentBoundHeight / 2
        };
        newBoundWidth = currentBoundWidth * 2;
        newBoundHeight = currentBoundHeight * 2;
    }

    x_min = zoomCenter.x - newBoundWidth / 2;
    x_max = zoomCenter.x + newBoundWidth / 2;
    y_min = zoomCenter.y - newBoundHeight / 2;
    y_max = zoomCenter.y + newBoundHeight / 2;

    render(sequenceQueue);
});

$(window).resize(resize);

zoomInElement.click(function () {
    zoomInElement.toggleClass('zoomSelected');
    zoomOutElement.removeClass('zoomSelected');

    updateZoomUI();
});
zoomOutElement.click(function () {
    zoomOutElement.toggleClass('zoomSelected');
    zoomInElement.removeClass('zoomSelected');

    updateZoomUI();
});

var minimap = $('#minimap');
minimap.dragging = false;
minimap.on("mousemove", function (e) {
    if (minimap.dragging) {
        var dragDelta = {
            x: e.pageX - minimap.dragMouseStart.pageX,
            y: e.pageY - minimap.dragMouseStart.pageY
        };
        minimap.offset({
            top: minimap.dragOffsetStart.top + dragDelta.y,
            left: minimap.dragOffsetStart.left + dragDelta.x
        });
    }
});
minimap.on("mousedown", function (e) {
    minimap.dragging = true;
    minimap.dragOffsetStart = {
        top: minimap.offset().top,
        left: minimap.offset().left};
    minimap.dragMouseStart = {
        pageX: e.pageX,
        pageY: e.pageY}
});
minimap.on("mouseup", function () {
    minimap.dragging = false;
});


// GO!
resize();