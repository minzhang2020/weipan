<template>
    <div>
        <div>
            <input type="button" value="分时" key="0" @click="toggle(0)" />
            <input type="button" value="日线" key="6" @click="toggle(6)" />
            <input type="button" value="周线" key="7" @click="toggle(7)" />
            <input type="button" value="分钟" key="1" @click="toggle(1)" />
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" id="chart" style="background-color: black;" @touchstart="handlerTouch" @touchmove="handlerTouch" v-touch:pan="zoom | debounce 100">
    </div>
    </svg>
</template>
<script>
import stock from '../stock/controller'
import http from '../http/quotationhttp'
let intervalId = null,
    nextId = 0,
    needGetTradeTime = true,
    crossHairFlag = false;

function drawHq(flag) {
    if (flag) {
        intervalId = setInterval(function() {
            getPanKou();
        }, 1000);
        getPanKou();
    }
    getTradeTime(drawHandler)
}

function drawHandler() {
    let period = stock.getPeriod();
    if (period === 0) {
        stock.timeInit();
        getTimeLine();
    } else {
        stock.klineInit();
        getKline();
    }
}

function getPanKou() {
    http.getPanKou(nextId, function(rep) {
        nextId = rep.PanNum;
        stock.setPanKouData(rep.TimeDataList, rep.HighPrice, rep.LowPrice);
    })
}

function getTradeTime(handler) {
    if (needGetTradeTime) {
        http.getTradeTime(function(rep) {
            stock.setTradeTime(rep.StartTime, rep.EndTime);
        }).then(handler)
    } else {
        handler();
    }
}

function getTimeLine() {
    http.getTimeData(function(rep) {
        stock.setTimeData({
            h: rep.HighPrice,
            l: rep.LowPrice,
            c: rep.ClosePrice
        }, rep.TradeDataList);
    })
}

function getKline() {
    http.getKLine(stock.getPeriod(), stock.getStartTime(), function(rep) {
        stock.setKlineData(rep.DataList);
    })
}

export default {
    ready: function() {
        var h = document.documentElement.clientHeight / 2;
        var w = document.documentElement.clientWidth;
        stock.init(this.$el.children[1], w, h);
        drawHq(true);
    },
    methods: {
        toggle(key) {
            stock.setPeriod(key);
            drawHq(false);
        },
        handlerTouch(e) {
            if (e.touches.length === 1) {
                switch (e.type) {
                    case "touchstart":
                        crossHairFlag = !crossHairFlag;
                        if (crossHairFlag) {
                            stock.touchStart(e.touches[0].clientX);
                        } else {
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
        },
        zoom(ev) {
            if (ev.scale < 1) {
                //zoom out
                stock.zoomOut();
            } else {
                //zoom in
                stock.zoomIn();
            }
        }
    }
}
</script>
