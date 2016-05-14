


// SETTINGS

var MAIN_PIXEL_SIZE = 2;

var SKIP_DEMO = false;
var DEMO_SPEED = 1;

var POINT_STROKE_COLOR = 'hsl(320,80%,30%)';
var POINT_STROKE_WEIGHT = 1.5;

var HOME_BOUNDARY = [-1.6, 0.6, -1.1, 1.1];



// APPLICATION STATE

// sequences to plot
var sequenceQueue = new MRUQueue(30);

// plot boundaries for zooming
var x_min = HOME_BOUNDARY[0],
    x_max = HOME_BOUNDARY[1],
    y_min = HOME_BOUNDARY[2],
    y_max = HOME_BOUNDARY[3];
