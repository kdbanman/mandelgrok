

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