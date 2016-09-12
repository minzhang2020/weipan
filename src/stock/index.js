import $ from 'jquery'
import _ from 'underscore'
import stock from './controller'
import Hammer from 'hammerjs'
let intervalId = null,
    crossHairFlag = false;
$(function() {
    var h = document.documentElement.clientHeight / 2;
    var w = document.documentElement.clientWidth;
    var svgElement = document.getElementById("chart");
    stock.init(svgElement, w, h, true);
    addEvents();
    drawHq(true);
})

function addEvents() {
    $("input[type='button'][key]").click(function() {
        stock.setPeriod(+$(this).attr("key"));
        drawHq(false);
    });
    var chart = document.getElementById("chart");
    chart.addEventListener("touchstart", handlerTouch, false);
    chart.addEventListener("touchmove", handlerTouch, false);
    var hammertime = new Hammer(chart);
    hammertime.get('pan').set({ pointers: 2 });
    var func = _.debounce(function(ev) {
        if (ev.scale < 1) {
            //zoom out
            stock.zoomOut();
        } else {
            //zoom in
            stock.zoomIn();
        }
    }, 100)
    hammertime.on('pan', func);
}

function handlerTouch(e) {
    if (e.touches.length === 1) {
        switch (e.type) {
            case "touchstart":
                crossHairFlag = !crossHairFlag;
                if (crossHairFlag) {
                    stock.touchStart(e.touches[0].clientX);
                }else{
                    stock.touchEnd();
                }
                break;
            case "touchmove":
                e.preventDefault();
                if (crossHairFlag) {
                    stock.touchMove(e.changedTouches[0].clientX);
                }
                break;
        }
    }
}

function drawHq(flag) {
    if (flag) {
        intervalId = setInterval(function() {
            stock.getPanKou();
        }, 1000);
        stock.getPanKou();
    }
    stock.getTime().done(drawHandler)
}

function drawHandler() {
    stock.draw();
}
