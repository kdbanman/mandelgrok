

var draggable = $('.draggable');
var currentlyDragged = null;


var dragElement = function (e) {
    if (currentlyDragged == null) {
        return;
    }

    var dragDelta = {
        x: e.pageX - currentlyDragged.prop("dragMouseStart").pageX,
        y: e.pageY - currentlyDragged.prop("dragMouseStart").pageY
    };
    var newOffset = {
        top: currentlyDragged.prop("dragOffsetStart").top + dragDelta.y,
        left: currentlyDragged.prop("dragOffsetStart").left + dragDelta.x
    };
    currentlyDragged.offset(newOffset);
    currentlyDragged.trigger('drag');
};

var startDragging = function (eDefault, eTriggered) {

    var e = eDefault;
    if (e.pageX == null) {
        e = eTriggered
    }

    currentlyDragged = $(this);
    currentlyDragged.addClass("dragging");
    currentlyDragged.prop("dragOffsetStart", {
        top: currentlyDragged.offset().top,
        left: currentlyDragged.offset().left});
    currentlyDragged.prop("dragMouseStart", {
        pageX: e.pageX,
        pageY: e.pageY});

    $(document).on("mousemove", dragElement);
};

var stopDragging = function (e) {
    draggable.removeClass("dragging");
    currentlyDragged = null;
    $(document).off("mousemove", dragElement);

    // Clear text selection.  When draggable elements "collide", empty content gets selected and bugs out the drag.
    if ( document.selection ) {
        document.selection.empty();
    } else if ( window.getSelection ) {
        window.getSelection().removeAllRanges();
    }
};

draggable.on("mousedown", startDragging);
draggable.on("mouseup", stopDragging);
$(document).on("mouseup", stopDragging);