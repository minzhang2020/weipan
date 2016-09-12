import timeline from './timeline'
import kline from './kline'
import http from '../http/quotationhttp'

var startTime = null,
    elem = null,
    width = 0,
    height = 0,
    period = 0,
    nextId = 0,
    timeFlag = false,
    klineFlag = false,
    allowQueryKline = true,
    commodityId;
export default {
    init: function(el, w, h) {
        elem = el;
        width = w;
        height = h;
        this.timeInit();
        return this;
    },
    setCommodity: function(id) {
        commodityId = id;
        return this;
    },
    timeInit: function() {
        if (!timeFlag) {
            timeFlag = true;
            timeline.init(elem, width, height, true);
        }

    },
    klineInit: function() {
        if (!klineFlag) {
            klineFlag = true;
            kline.init(elem, width, height, true);
        }
    },
    setPeriod: function(value) {
        if (value !== period) {
            if (value != 0) {
                if (klineFlag) {
                    kline.dispose();
                }
                kline.setPeriod(value);
            } else {
                if (timeFlag) {
                    timeline.dispose();
                }
            }
            period = value;
        }
    },
    getPeriod: function() {
        return period;
    },
    getStartTime: function() {
        return kline.getStartTime()
    },
    touchStart: function(x) {
        if (period === 0) {
            timeline.showCrossHair(x);
        } else {
            kline.showCrossHair(x);
        }
    },
    touchMove: function(x) {
        if (period === 0) {
            timeline.showCrossHair(x);
        } else {
            kline.showCrossHair(x);
        }
    },
    touchEnd: function() {
        if (period === 0) {
            timeline.hiddenCrossHair();
        } else {
            kline.hiddenCrossHair();
        }
    },
    zoomIn: function() {
        kline.hiddenCrossHair();
        kline.setCandleCount(-10);
        kline.draw();
    },
    zoomOut: function() {
        kline.hiddenCrossHair();
        if (kline.isAllowQuery(10)) {
            if (allowQueryKline) {
                allowQueryKline = false;
                this.getKlineData().done(function() {
                    allowQueryKline = true;
                    kline.setCandleCount(10);
                    kline.draw();
                })
            }
        } else {
            kline.setCandleCount(10);
            kline.draw();
        }
    },
    draw: function() {
        if (period === 0) {
            this.timeInit();
            this.getTimeData();
        } else {
            this.klineInit();
            this.getKlineData();
        }
    },
    setTradeTime: function(start, end) {
        timeline.setStartAndEndTime(start, end);
        kline.setLastTime(end);
    },
    setPanKouData: function(list, highPrice, lowPrice) {
        if (period === 0) {
            timeline.drawDynamicData(list, highPrice, lowPrice);
        } else {
            kline.setDataFromPanKou(list);
        }
    },
    getPanKou: function() {
        return http.getPanKou({
            CID: commodityId,
            DIVN: 0,
            FIVN: 0,
            HANN: nextId,
            PRIN: 0
        }, this.handlerPanKou.bind(this));
    },
    handlerPanKou: function(rep) {
        var mmts = rep.MMTS,
            data = mmts.REPB;
        if (mmts.REPH.RET == 0) {
            if (mmts.REPB.CID == commodityId) {
                this.setPanKouData(data.DIVL, data.HIGP, data.LOWP);
            }
        }
    },
    setTimeData: function(pk, list) {
        timeline.setTimeData(pk, list);
    },
    getTimeData: function() {
        return http.getTimeData({
                CID: commodityId,
                PER: 1,
                AST: -1,
                DIR: 0,
                REQN: 1440
            },
            this.handlerTimeData.bind(this));
    },
    handlerTimeData: function(rep) {
        var mmts = rep.MMTS,
            header = mmts.REPH,
            body = mmts.REPB;
        if (header.RET === 0) {
            if (body.CID !== commodityId) {
                return;
            }
            var panKouOb = {
                h: +body.HIGP,
                l: +body.LOWP,
                c: +body.YCLO
            };
            timeline.setTimeData(panKouOb, this._resolveTimeData(body.TDLI));
        }
    },
    _resolveTimeData: function(list) {
        var data = [],
            dataItem = null,
            item = null,
            tradeDay = null,
            timeList = null,
            timeItem = null,
            tradeTime = "",
            timestr = "";
        if (list) {
            for (var i = 0, len = list.length; i < len; i++) {
                item = list[i];
                if (item) {
                    tradeDay = item.TDAY;
                    timeList = item.TDLL;
                    if (timeList) {
                        for (var j = 0, jlen = timeList.length; j < jlen; j++) {
                            timeItem = timeList[j];
                            if (timeItem) {
                                tradeTime = "" + timeItem.DIVT;
                                if (tradeTime.length === 3) {
                                    tradeTime = "0" + tradeTime;
                                }
                                var timestr = "" + tradeDay + tradeTime;
                                dataItem = {
                                    time: timestr.formatTime(),
                                    price: timeItem.LATP,
                                    avgPrice: timeItem.AVGP,
                                    volume: timeItem.NVOL,
                                    priceId: timeItem.PRID
                                }
                                data.push(dataItem);
                            }
                        }
                    }
                }
            }
        }
        return data;
    },
    setKlineData: function(list) {
        kline.setKlineData(list);
    },
    getKlineData: function() {
        return http.getKLine({
            CID: commodityId,
            PER: kline.getPeriod(),
            AST: kline.getStartTime(),
            DIR: 0,
            REQN: 60
        }, this.handlerKline);
    },
    handlerKline: function(rep) {
        var mmts = rep.MMTS,
            header = mmts.REPH,
            body = mmts.REPB;
        if (header.RET === 0) {
            if (body.PER == kline.getPeriod() && body.CID == commodityId) {
                kline.setKlineData(body.TDLL);
            }
        }
    }
}
