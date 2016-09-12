import util from './commonUtil'
import constant from './constantsUtil'
import crossHair from './klineCrossHair'

function DrawKLine(element, overlayElement, detail) {
    this.period = 6;
    this.svgMargin = {
        left: 1,
        right: 50,
        top: 1,
        bottom: 20
    };
    this.kLineData = [];
    this.newData = [];
    this.minCandleCount = 11;
    this.maxCandleCount = 300;
}
DrawKLine.prototype = {
    getStartTime: function() {
        var startItem = this.kLineData.length && this.kLineData[this.kLineData.length - 1];
        if (startItem) {
            var t = new Date(startItem.TIME - this.period * 60000);
            if (this.period < 6) {
                return t.format("yyyyMMddHHmm");
            } else {
                return t.format("yyyyMMdd");
            }
        }
        return -1;
    },
    isAllowQuery: function(value) {
        var temp = this.candleCountInScreen + value * 2;
        if (temp > this.kLineData.length && temp <= this.maxCandleCount) {
            return true;
        }
        return false;
    },
    /**
     * 设置当前柱子数量
     * @param value
     */
    setCandleCount: function(value) {
        var len = this.kLineData.length;
        if (len < this.minCandleCount) {
            this.candleCountInScreen = this.minCandleCount;
            return;
        }
        if (value > 0) {
            if (this.endIndex !== 0) {
                var end = this.endIndex - value;
                if (end <= 0) {
                    this.endIndex = 0;
                } else {
                    this.endIndex -= value;
                }
            }
            var temp = this.candleCountInScreen + value * 2;
            if (temp > this.maxCandleCount) {
                this.candleCountInScreen = this.maxCandleCount;
            } else {
                this.candleCountInScreen = temp;
            }
        } else {
            var diff = this.candleCountInScreen + value * 2;
            if (diff < this.minCandleCount) {
                this.endIndex = 0;
                this.candleCountInScreen = this.minCandleCount;
            } else {
                if (this.endIndex >= Math.abs(value)) {
                    this.endIndex -= value;
                } else {
                    this.endIndex = 0;
                }
                this.candleCountInScreen = diff;
            }
        }
    },
    /**
     * 获取当前柱子的前一个柱子
     * @param index
     * @private
     */
    _getPreCandle: function(index) {
        index--;
        if (index < 0) {
            return null;
        }
        return this.newData[index];
    },
    /**
     * 根据鼠标位置获取K线数据
     * @param x
     * @returns {*}
     * @private
     */
    _getDataByMousePosition: function(x) {
        var list = this.newData,
            w = this.candleWidth;
        if (list.length) {
            var ob = list.filter(function(item, index, array) {
                return x >= item.sx && x <= item.ex;
            });
            if (ob.length > 0) {
                return ob[0];
            }
        }
        return null;
    },
    showCrossHair: function(x) {
        var data = this._getDataByMousePosition(x);
        if (data) {
            var pre = this._getPreCandle(data.i);
            crossHair.show(data, pre ? pre.closePrice : null);
        }
    },
    hiddenCrossHair: function() {
        crossHair.hidden();
    },
    /**
     * 重置大小
     * @param w
     * @param h
     */
    resize: function(w, h) {
        this.init(w, h, true);
    },
    /**
     * 释放资源
     */
    dispose: function() {
        crossHair.hidden();
        this.newData.length = 0;
        this.kLineData.length = 0;
        this._initSetting();
    },

    /**
     * 初始化基础设置
     */
    _initSetting: function() {
        this.firstCandle = null;
        this.endIndex = 0;
        this.candleCountInScreen = 60; //当前显示的柱子数量
        this.svgElement.innerHTML = '';
        if (!this.charts) {
            this.charts = util.createCommonG({
                "class": "charts-main"
            }, this.svgElement); //主划线区域
        } else {
            this.svgElement.appendChild(this.charts);
        }
        crossHair.createCrossHair(this.svgElement, this.svgMargin, this.svgWidth, this.svgHeight);
    },
    setLastTime: function(value) {
        this.endTime = value;
    },

    /**
     * 设置k线周期
     * @param value
     */
    setPeriod: function(value) {
        this.period = value;
    },
    getPeriod: function() {
        return this.period;
    },
    /**
     *设置数据
     * @param value
     */
    setKlineData: function(list) {
        if (Array.isArray(list) && list.length > 0) {
            if (this.kLineData.length === 0) {
                this.kLineData = list.reverse();
            } else {
                var last = this.kLineData[this.kLineData.length - 1],
                    item = null;
                for (var i = list.length - 1; i >= 0; i--) {
                    item = list[i];
                    if (item.TIME < last.TIME) {
                        this.kLineData.push(item);
                    }
                }
            }
            this.draw();
        }
    },
    /**
     * 判断时间是否在最后一个柱子的事件内
     * @param lastTime
     * @param newTime
     * @returns {boolean}
     */
    _judgeTime: function(lastTime, newTime) {
        var t = new Date(lastTime);
        var startTime = (new Date(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours(), t.getMinutes(), 0)).getTime();
        var result = false;
        switch (this.period) {
            case 1:
                result = (newTime - startTime < 59 * 1000);
                break;
            case 2:
                result = (newTime - startTime < (4 * 60 + 59) * 1000);
                break;
            case 3:
                result = (newTime - startTime < (13 * 60 + 59) * 1000);
                break;
            case 4:
                result = (newTime - startTime < (29 * 60 + 59) * 1000);
                break;
            case 5:
                result = (newTime - startTime < (59 * 60 + 59) * 1000);
                break;
            case 6:
                result = newTime < this.endTime;
                break;
            case 7:
                result = true;
                break;
            case 8:
                result = true;
                break;
            case 9:
                result = true;
                break;
        }
        return result;
    },
    /**
     * 设置来自盘口的数据
     * @param data 基础数据
     * @param arr 分笔数据
     */
    setDataFromPanKou: function(data) {
        if (this.kLineData.length === 0 || !Array.isArray(data) || data.length === 0) {
            return;
        }
        var last = this.kLineData[0],
            ll = 0,
            item = null,
            i = 0,
            vol = 0,
            flag = false;
        var list = data.filter(function(item, array, index) {
            return item.IDX > last.PRID;
        });
        ll = list.length;
        if (ll > 0) {
            for (i = 0; i < ll; i++) {
                item = list[i];
                if (this._judgeTime(last.TIME, item.TIME)) {
                    if (item.PRI > last.HIGP) {
                        last.HIGP = item.PRI
                    } else if (item.PRI < last.LOWP) {
                        last.LOWP = item.PRI;
                    }
                    last.CLOP = item.PRI;
                    last.PRID = item.IDX;
                } else {
                    var ob = {
                        HIGP: item.PRI,
                        LOWP: item.PRI,
                        OPEP: item.PRI,
                        CLOP: item.PRI,
                        TIME: item.TIME,
                        PRID: item.IDX
                    };
                    this.kLineData.unshift(ob);
                    last = this.kLineData[0];
                }
            }
            this.draw();
        }
    },
    /**
     * 初始化
     * @param w
     * @param h
     */
    init: function(elem, w, h, needInitialize) {
        this.svgElement = elem;
        if (needInitialize && w > 0 && h > 0) {
            this.svgElement.setAttribute("width", w);
            this.svgElement.setAttribute("height", h);
            this.svgElement.setAttribute("viewBox", "-0.5 -0.5 " + w + " " + h);
            this.svgWidth = this.svgElement.width.baseVal.value;
            this.svgHeight = this.svgElement.height.baseVal.value;
            this.drawWidth = this.svgWidth - this.svgMargin.right;
            this.drawHeight = this.svgHeight - this.svgMargin.top - this.svgMargin.bottom;
            this.timeAxisY = this.svgHeight - this.svgMargin.bottom / 2; //时间
            this._initSetting();
        }
    },
    /**
     * 绘制
     */
    draw: function() {
        this.charts.innerHTML = '';
        if (this.kLineData.length != 0) {
            this.drawKline();
        }
    },
    /**
     * 绘制k线
     */
    drawKline: function() {
        this._getHighAndLowPrice();
        this._drawHorizonAndVertical();
        this._drawKlineHorizonAndText();
        this._drawCandle();
        this._drawTimeAxis();
    },
    /**
     *得到当前k线的最高价和最低价
     */
    _getHighAndLowPrice: function() {
        var end = this.endIndex,
            start = this.endIndex + this.candleCountInScreen - 1,
            item = null,
            high = 0,
            index = 0,
            low = 0;
        for (start; start >= end; start--) {
            item = this.kLineData[start];
            if (item) {
                if (index == 0) {
                    high = item.HIGP;
                    low = item.LOWP;
                } else {
                    if (item.HIGP > high) {
                        high = item.HIGP;
                    }
                    if (item.LOWP < low) {
                        low = item.LOWP;
                    }
                }
                index++;
            }
        }
        this.highPrice = high;
        this.lowPrice = low;
        if (this.highPrice === this.lowPrice) {
            this.lowPrice -= this.highPrice * 0.01;
        }
    },
    /**
     * 垂直线和水平线
     */
    _drawHorizonAndVertical: function() {
        var d = [];
        d.push("M{0},{1}L{0},{2}".format(this.svgMargin.left, this.svgMargin.top, this.svgHeight - this.svgMargin.bottom));
        d.push("M{0},{1}L{2},{1}".format(this.svgMargin.left, this.svgMargin.top, this.svgWidth - this.svgMargin.right));
        d.push("M{0},{1}L{0},{2}".format(this.svgWidth - this.svgMargin.right, this.svgMargin.top, this.svgHeight - this.svgMargin.bottom));
        d.push("M{0},{1}L{2},{1}".format(this.svgMargin.left, this.svgHeight - this.svgMargin.bottom, this.svgWidth - this.svgMargin.right));
        d.push("M{0},{1}L{2},{1}".format(this.svgMargin.left, this.svgMargin.top + this.drawHeight / 2, this.svgWidth - this.svgMargin.right));
        util.createPath({
            d: d.join(''),
            strokeColor: constant.LINE_COLOR
        }, this.charts);
    },
    /**
     * K线区域的水平线和价格
     */
    _drawKlineHorizonAndText: function() {
        var w = this.svgWidth - this.svgMargin.right;
        util.createText({
            v: this.highPrice.toFixed(2),
            x: w + 5,
            y: this.svgMargin.top,
            textColor: constant.TXT_COLOR,
            hAlign: "start",
            vAlign: "top"
        }, this.charts);
        var diff = this.drawHeight / 2;
        var priceDiff = this.highPrice - this.lowPrice;
        var heightPrice = priceDiff / this.drawHeight; //每一像素的价格
        var price = (this.highPrice - diff * heightPrice).toFixed(2);
        util.createText({
            v: price,
            x: w + 5,
            y: Math.round(this.svgMargin.top + diff),
            textColor: constant.TXT_COLOR,
            hAlign: "start",
            vAlign: "middle"
        }, this.charts);
        util.createText({
            v: this.lowPrice.toFixed(2),
            x: w + 5,
            y: this.svgMargin.top + this.drawHeight,
            textColor: constant.TXT_COLOR,
            hAlign: "start",
            vAlign: "middle"
        }, this.charts);
    },
    /*
     *计算柱子的颜色
     */
    _calcCandleColor: function(curClop, curOpen, preClop) {
        if (curClop === curOpen) {
            if (preClop === 0) {
                return constant.KLINE_CANDLE_UP;
            } else {
                if (curClop >= preClop) {
                    return constant.KLINE_CANDLE_UP;
                } else {
                    return constant.KLINE_CANDLE_DOWN;
                }

            }
        }
        return curClop - curOpen > 0 ? constant.KLINE_CANDLE_UP : constant.KLINE_CANDLE_DOWN
    },
    /**
     * 绘制蜡烛图
     */
    _drawCandle: function() {
        this.newData.length = 0;
        //每个柱子宽度
        this.candleWidth = this.drawWidth / this.candleCountInScreen;
        var start = this.endIndex + this.candleCountInScreen - 1,
            diffPrice = this.highPrice - this.lowPrice;
        this.priceHeight = diffPrice == 0 ? 0 : this.drawHeight / diffPrice;
        var i = 0,
            x = 0,
            ox = 0,
            w = 0,
            h = 0,
            oy = 0,
            y0 = 0,
            y1 = 0,
            y2 = 0,
            y3 = 0,
            color = "",
            fillColor = "none",
            w = Math.round(this.candleWidth * 3 / 5),
            pre = null;
        for (; start >= this.endIndex; start--) {
            var item = this.kLineData[start];
            if (item) {
                x = Math.round(this.svgMargin.left + this.candleWidth * i + this.candleWidth / 2);
                ox = x - Math.floor(w / 2);
                oy = item.CLOP > item.OPEP ? Math.round(this.svgMargin.top + (this.highPrice - item.CLOP) * this.priceHeight) : Math.round(this.svgMargin.top + (this.highPrice - item.OPEP) * this.priceHeight);
                y0 = Math.round(this.svgMargin.top + (this.highPrice - item.HIGP) * this.priceHeight);
                y1 = Math.round(item.CLOP > item.OPEP ? this.svgMargin.top + (this.highPrice - item.CLOP) * this.priceHeight : this.svgMargin.top + (this.highPrice - item.OPEP) * this.priceHeight);
                y2 = Math.round(item.CLOP > item.OPEP ? this.svgMargin.top + (this.highPrice - item.OPEP) * this.priceHeight : this.svgMargin.top + (this.highPrice - item.CLOP) * this.priceHeight);
                y3 = Math.round(this.svgMargin.top + (this.highPrice - item.LOWP) * this.priceHeight);
                w = w % 2 == 0 ? w : w - 1;
                w = w < 1 ? 1 : w;
                h = y2 - y1 < 1 ? 1 : y2 - y1;
                var temp = {
                    x: x,
                    ox: ox,
                    w: w,
                    sx: this.svgMargin.left + this.candleWidth * i,
                    ex: this.svgMargin.left + this.candleWidth * (i + 1),
                    y: item.CLOP > item.OPEP ? y1 : y2,
                    i: i,
                    index: start,
                    highPrice: item.HIGP,
                    lowPrice: item.LOWP,
                    openPrice: item.OPEP,
                    closePrice: item.CLOP,
                    time: new Date(item.TIME),
                    priceId: item.PRID
                };
                this.newData.push(temp);
                pre = this.kLineData[start + 1];
                color = this._calcCandleColor(item.CLOP, item.OPEP, typeof pre === "undefined" ? 0 : pre.CLOP);
                fillColor = color === constant.KLINE_CANDLE_UP ? "none" : color;
                util.createPath({
                    d: "M{0},{1}L{0},{2}M{0},{3}L{0},{4}".format(x, y0, y1, y2, y3),
                    strokeColor: color
                }, this.charts);
                util.createRect({
                    x: ox,
                    y: oy,
                    width: w,
                    height: h,
                    fillColor: fillColor,
                    strokeColor: color
                }, this.charts);
                i++;
            }
        }
        this.firstCandle = this.newData[0];
        this.lastCandle = this.newData[this.newData.length - 1];
    },
    /**
     * 画时间轴
     */
    _drawTimeAxis: function() {
        var list = this.newData,
            len = list.length,
            i = 1,
            y = this.timeAxisY,
            first = list[0],
            time = first.time,
            startX = first.x,
            firstDate = util.getDateString(first.time, 6),
            item = null,
            d = [];
        var firstText = util.createText({
                v: firstDate,
                x: startX,
                y: y,
                textColor: constant.TXT_COLOR,
                hAlign: "start",
                vAlign: "middle"
            }, this.charts),
            tw = firstText.getBBox().width;
        for (; i < len; i++) {
            item = list[i];
            if (!util.dayEqual(time, item.time)) {
                if (item.x - startX > tw) {
                    d.push("M{0},{1}L{0},{2}".format(item.x, this.svgHeight - this.svgMargin.bottom, this.svgHeight - this.svgMargin.bottom + 5));
                    util.createText({
                        v: item.time.getDate(),
                        x: item.x,
                        y: y,
                        textColor: constant.TXT_COLOR,
                        hAlign: "start",
                        vAlign: "middle"
                    }, this.charts);
                    startX = item.x;
                    time = item.time;
                }
            }
        }
        if (d.length > 0) {
            util.createPath({
                d: d.join(''),
                strokeColor: constant.LINE_COLOR
            }, this.charts);
        }
    }
};

export default new DrawKLine()
