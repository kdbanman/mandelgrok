

// CONTROL BEHAVIORS

var render = function (sequences, forceRedraw, finishedAsync) {
    renderDistancePlot(sequences);
    return renderComplexPlane(sequences, forceRedraw, finishedAsync);
};

var addAndRenderSequence = function (x, y) {
    if (x === undefined) x = x_min + (x_max - x_min) / 2;
    if (y === undefined) y = y_min + (y_max - y_min) / 2;

    sequenceQueue.push(new MandelSeq(x, y));
    render(sequenceQueue);
};

var getMouseComplexPlanePosition = function (evt) {
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

var complexPositionToCanvasCoord = function (complexPosition) {
    var canv = document.getElementById("plot_canvas");

    var viewportComplexX = complexPosition.x - x_min;
    var viewportComplexY = complexPosition.y - y_min;

    var viewportComplexWidth = x_max - x_min;
    var viewportComplexHeight = y_max - y_min;

    var x = viewportComplexX * canv.width / viewportComplexWidth;
    var y = canv.height - viewportComplexY * canv.height / viewportComplexHeight;

    return {x: x, y: y};
};

var getComplexPosition = function (canvasCoord) {
    var canv = document.getElementById("plot_canvas");

    var translatedX = (x_max - x_min) * canvasCoord.x / canv.width + x_min;
    var translatedY = (y_max - y_min) * (canv.height - canvasCoord.y) / canv.height+ y_min;

    return {
        x: translatedX,
        y: translatedY
    };
};

var getReticleComplexPosition = function () {
    var canvasCoord = {
        x: parseFloat($('.outerReticle').css('left')),
        y: parseFloat($('.outerReticle').css('top'))
    };

    return getComplexPosition(canvasCoord);
};

var moveReticle = function (complexPosition) {

    addAndRenderSequence(complexPosition.x, complexPosition.y);

    var canvasCoord = complexPositionToCanvasCoord(complexPosition);
    $('.outerReticle').css({
        left: "" + canvasCoord.x + "px",
        top: "" + canvasCoord.y + "px"
    });
};

// fill container divs with canvas
var resize = (function () {

    var resizing = false;
    var anotherResizeQueued = false;
    var asyncCancel;

    var guardedResize = function (asyncDone) {
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

        var reticlePos = getReticleComplexPosition();

        fillContainerWithCanvas($('#plot_canvas'), $('#plot'));
        fillContainerWithCanvas($('#dist_canvas'), $('#dist'));
        fillContainerWithCanvas($('#minimap_canvas'), $('#minimap'));

        moveReticle(reticlePos);

        asyncCancel = render(sequenceQueue, true, function () {
            resizing = false;

            if (anotherResizeQueued) {
                anotherResizeQueued = false;
                guardedResize(asyncDone);
            } else if (typeof asyncDone === 'function') {
                asyncDone();
            }
        });
    };

    return guardedResize;
}());

var zoomIn = function (zoomCenter) {
    var currentBoundWidth = x_max - x_min;
    var currentBoundHeight = y_max - y_min;

    var newBoundWidth = currentBoundWidth / 2;
    var newBoundHeight = currentBoundHeight / 2;

    zoom(zoomCenter, newBoundWidth, newBoundHeight);
};

var zoomOut = function (zoomCenter) {
    var currentBoundWidth = x_max - x_min;
    var currentBoundHeight = y_max - y_min;

    var newBoundWidth = currentBoundWidth * 2;
    var newBoundHeight = currentBoundHeight * 2;

    zoom(zoomCenter, newBoundWidth, newBoundHeight);
};

var zoom = function (zoomCenter, newBoundWidth, newBoundHeight) {
    x_min = zoomCenter.x - newBoundWidth / 2;
    x_max = zoomCenter.x + newBoundWidth / 2;
    y_min = zoomCenter.y - newBoundHeight / 2;
    y_max = zoomCenter.y + newBoundHeight / 2;

    moveReticle(zoomCenter);

    render(sequenceQueue);
};

var showDemo = function (asyncDone) {
    var step = -1;
    var lastStepTime = Date.now();
    var showNextStep = function (timestamp) {
        var stepDelta = timestamp - lastStepTime;
        var stepsPerSecond = DEMO_SPEED * 1000 / stepDelta;
        lastStepTime = timestamp;
        if (stepsPerSecond < 50) {
            DEMO_SPEED++;
        } else if (stepsPerSecond > 100 && DEMO_SPEED > 1) {
            DEMO_SPEED--;
        }

        step += DEMO_SPEED;

        if (step < demoPath.length) {
            moveReticle(demoPath[step]);
            requestAnimationFrame(showNextStep);
        } else {
            asyncDone();
        }
    };
    showNextStep();
};



var initialize = function () {
    var zoomInElement = $('.zoomIn');
    var zoomOutElement = $('.zoomOut');

    $("#plot_canvas").on('mousedown', function (event) {
        sequenceQueue.clear();
        var mousePosition = getMouseComplexPlanePosition(event, x_min, x_max, y_min, y_max);
        moveReticle(mousePosition);
        $('.outerReticle').trigger('mouseenter');
        $('.outerReticle').trigger('mousedown', event);
    });

    $('.zoomButton').on('mouseenter', function () {
        $('.outerReticle').addClass('dragging');
    });
    $('.zoomButton').on('mouseleave', function () {
        $('.outerReticle').removeClass('dragging');
    });

    zoomInElement.on('mousedown', function () {
        zoomInElement.addClass('zoomSelected');
    });
    zoomInElement.click(function () {
        zoomIn(getReticleComplexPosition());
        zoomInElement.removeClass('zoomSelected');
    });

    zoomOutElement.on('mousedown', function () {
        zoomOutElement.addClass('zoomSelected');
    });
    zoomOutElement.click(function () {
        zoomOut(getReticleComplexPosition());
        zoomOutElement.removeClass('zoomSelected');
    });

    $(".outerReticle").on('drag', function (e) {
        $('.message').fadeOut(300);

        var newOffset = $(this).position();
        var canvasCoord = {x: newOffset.left, y: newOffset.top};
        var complexPosition = getComplexPosition(canvasCoord);

        addAndRenderSequence(complexPosition.x, complexPosition.y);
    });

    $(window).resize(resize);
};


// GO!
resize(function () {

    setTimeout(function () {

        moveReticle({x: 0, y: 0});
        $('.outerReticle').fadeIn(300).css('display', 'flex').addClass('dragging');
        $('.skipMessage').fadeIn(300);
        $('.skipButton').click(function () {
            var speedUpDemo = function () {
                DEMO_SPEED += Math.max(2, Math.floor(DEMO_SPEED * 0.2));
                if (DEMO_SPEED < 50) {
                    setTimeout(speedUpDemo, 100);
                }
            };
            speedUpDemo();
            $(this).fadeOut(300);
        });
        
        var resizeAfterDemo = false;
        $(window).resize(function () { resizeAfterDemo = true; });

        showDemo(function () {
            
            if (resizeAfterDemo) {
                resize();
            }

            sequenceQueue.clear();
            moveReticle({x: 0, y: 0});
            $('.helpMessage').fadeIn(300);
            $('.skipMessage').fadeOut(300);
            $('.outerReticle').removeClass('dragging');
            
            setTimeout(initialize, 1000);
        });
    }, 800);
});
