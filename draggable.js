

var draggable = $('.draggable');

var startDragging = function (e) {
    var element = $(this);
    element.addClass("dragging");
    element.prop("dragOffsetStart", {
        top: element.offset().top,
        left: element.offset().left});
    element.prop("dragMouseStart", {
        pageX: e.pageX,
        pageY: e.pageY});
};
var dragElement = function (e) {
    var element = $(this);
    if (element.hasClass("dragging")) {
        var dragDelta = {
            x: e.pageX - element.prop("dragMouseStart").pageX,
            y: e.pageY - element.prop("dragMouseStart").pageY
        };
        element.offset({
            top: element.prop("dragOffsetStart").top + dragDelta.y,
            left: element.prop("dragOffsetStart").left + dragDelta.x
        });
    }
};
var stopDragging = function (e) {
    draggable.removeClass("dragging");

    // Clear text selection.  When draggable elements "collide", empty content gets selected and bugs out the drag.
    if ( document.selection ) {
        document.selection.empty();
    } else if ( window.getSelection ) {
        window.getSelection().removeAllRanges();
    }
};

draggable.on("mousedown", startDragging);
draggable.on("mousemove", dragElement);
draggable.on("mouseleave", stopDragging);
draggable.on("mouseenter", stopDragging);
draggable.on("mouseup", stopDragging);