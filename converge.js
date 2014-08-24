var plotDist = function (newSeq, size) {
    size = size || 3;

    var canvas = document.getElementById('dist_canvas');
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var maxH = 0.0,
        i;
    for (i = 0; i < newSeq.length; i++) {
        maxH = Math.max(maxH, newSeq['dist_hist'][i]);
    }
    maxH *= 1.2
        
    var div = canvas.height/ newSeq.length;

    var redMax = 100;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    for (i = 0; i < newSeq.length; i++) {
        var val = newSeq['dist_hist'][i];
        var x = Math.floor(canvas.width * val / maxH);
        var y = Math.floor(i * div);

        var red = Math.floor(redMax - redMax * i / newSeq.length);
        ctx.fillStyle = "rgba(" + red + ",0,0,0.5)";
        ctx.fillRect(x - size / 2, y - size / 2, size, Math.max(div, size));
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

document.getElementById("plot_canvas").addEventListener('mousemove', function (event) {
    var mouse = getMousePos(event, -2.0, 2.0, -2.0, 2.0);
    newBounded(mouse.x, mouse.y);
});

$(window).resize(resize);

resize();
newBounded();
