import util from './commonUtil'
import constant from './constantsUtil'
import crossHair from './timeCrossHair'

function DrawTimeLine() {
    this.svgElement = null;
    this.hcount = 2; //分时图的水平线数量
    this.startTime = 0; //开市时间
    this.endTime = 0; //闭市时间
    this.timeSpan = 6; //以小时为间隔
    this.timeWidth = 0;
    this.pk = {};
    this.originalData = []; //初始数据
    this.newData = []; //计算后数据(有x,y坐标)
    this.svgMargin = {
        top: 1,
        left: 45,
        right: 35,
        bottom: 15
    };
}

DrawTimeLine.prototype = {
    /**
     * 找到最近的分时数据，
     */
    _getTimeDataByMousePosition: function(x) {
        var list = this.newData,
            min = this.timeWidth;
        if (list.length) {
            var ob = list.filter(function(item, index, array) {
                return Math.abs(Math.floor(item.x - x)) <= min;
            });
            if (ob.length > 0) {
                return ob[0];
            } else {
                if (x < this.svgMargin.left) {
                    return list[0];
                } else {
                    return list[list.length - 1];
                }
            }
        }
        return null;
    },
    showCrossHair: function(x) {
        var data = this._getTimeDataByMousePosition(x);
        if (data) {
            crossHair.show(data.x, data.y, data.time, data.price, data.price - this.pk.c);
        }
    },
    hiddenCrossHair: function() {
        crossHair.hidden();
    },
    /**
     * 释放资源
     */
    dispose: function() {
        crossHair.hidden();
        this._initMain();
        this.originalData.length = 0;
        this.newData.length = 0;
        this.allowPkDraw = false;
    },
    /**
     * 初始化
     * @param w
     * @param h
     */
    init: function(elem, w, h, needInitialize) {
        if (needInitialize && w > 0 && h > 0) {
            this._initSize(elem, w, h);
        }
    },
    _initSize: function(elem, w, h) {
        this.svgElement = elem;
        this.svgElement.setAttribute("width", w);
        this.svgElement.setAttribute("height", h);
        this.svgElement.setAttribute("viewBox", "-0.5 -0.5 " + w + " " + h);
        this.svgWidth = this.svgElement.width.baseVal.value;
        this.svgHeight = this.svgElement.height.baseVal.value;
        this.chartWidth = this.svgWidth - this.svgMargin.left - this.svgMargin.right; //分时线区域的宽
        this.chartHeight = this.svgHeight - this.svgMargin.top - this.svgMargin.bottom;
        this._initMain();
    },
    _initMain: function() {
        this.svgElement.innerHTML = '';
        if (!this.charts) {
            this.charts = util.createCommonG({
                "class": "charts-main"
            }, this.svgElement); //主划线区域
        } else {
            this.svgElement.appendChild(this.charts);
        }
        crossHair.createCrossHair(this.svgElement, this.svgMargin, this.svgWidth, this.svgHeight,
            this.pk.c);
        this.linePath = null;
    },
    /**
     *重置大小
     * @param w
     * @param h
     */
    resize: function(w, h) {
        this._clearCanvas();
        this.init(w, h, true);
        this.allowPkDraw = false;
    },
    /**
     * 设置开始和结束时间
     * @param s
     * @param e
     */
    setStartAndEndTime: function(s, e) {
        this.startTime = s;
        this.endTime = e;
    },
    /*
     *初始化数据
     */
    _initData: function(data) {
        this.originalData.length = 0;
        this.originalData = data;
    },
    /**
     * 设置分时和盘口数据
     * @param pk
     * @param d
     */
    setTimeData: function(pk, data) {
        this.pk = pk;
        crossHair.setClosePrice(this.pk.c);
        this._initPriceDiff();
        this._initData(data);
        this._draw();
    },
    //设置来自盘口的数据
    _setPKData: function(arr) {
        var len = this.originalData.length;
        if (len > 0) {
            var last = this.originalData[len - 1];
            var ll = arr.length;
            var item = null;
            for (var i = 0; i < ll; i++) {
                item = arr[i];
                if (item) {
                    if (item.IDX > last.priceId) {
                        if ((new Date(last.time)).getMinutes() != (new Date(item.TIME)).getMinutes()) {
                            var temp = {
                                time: item.TIME,
                                price: item.PRI,
                                avgPrice: 0,
                                volume: item.TVOL,
                                priceId: item.IDX
                            };
                            this.originalData.push(temp);
                            last = temp;
                        } else {
                            var lastItem = this.originalData[this.originalData.length - 1];
                            lastItem.time = item.TIME;
                            lastItem.price = item.PRI;
                            lastItem.volume += item.TVOL;
                            lastItem.priceId = item.IDX;
                        }
                    }
                }
            }
        }
    },
    drawDynamicData: function(list, h, l) {
        if (!list || list.length === 0) {
            return;
        }
        this._setPKData(list);
        if (this.pk.h === 0 || h > this.pk.h) {
            this.pk.h = h;
        }
        if (this.pk.l === 0 || l < this.pk.l) {
            this.pk.l = l;
        }
        this._initPriceDiff();
        if (this.allowPkDraw) {
            this._draw();
        }
    },
    /**
     * 计算最大的价格差
     */
    _initPriceDiff: function() {
        if (this.pk.h === 0 && this.pk.l === 0) {
            this.diffPrice = this.pk.c * 0.02;
        } else {
            var diff1 = this.pk.h - this.pk.c;
            var diff2 = this.pk.c - this.pk.l;
            this.diffPrice = diff1 > diff2 ? diff1 : diff2;
            if (this.diffPrice === 0) {
                this.diffPrice = this.pk.c * 0.02;
            }
        }
    },

    _calc: function() {
        this.timeWidth = this.chartWidth / ((this.endTime - this.startTime) / 1000 - 60);
        if (this.diffPrice == 0) {
            this.priceHight = 0;
        } else {
            this.priceHight = (this.chartHeight / 2) / this.diffPrice;
        }
    },
    _draw: function() {
        if (!this.startTime) {
            throw new Error("没有设置开始时间");
        }
        if (this.svgWidth > 0 && this.svgHeight > 0) {
            this.charts.innerHTML = '';
            this._calc();
            this._drawCommon();
            if (this.originalData.length > 0) {
                this._drawLine();
            }
            this.allowPkDraw = true;
        }
    },
    _drawCommon: function() {
        var d = [];
        d.push("M{0},{1}L{0},{2}".format(this.svgMargin.left, this.svgMargin.top, this.svgHeight - this.svgMargin.bottom));
        d.push("M{0},{1}L{2},{1}".format(this.svgMargin.left, this.svgMargin.top, this.svgWidth - this.svgMargin.right));
        d.push("M{0},{1}L{0},{2}".format(this.svgWidth - this.svgMargin.right, this.svgMargin.top, this.svgHeight - this.svgMargin.bottom));
        d.push("M{0},{1}L{2},{1}".format(this.svgMargin.left, this.svgHeight - this.svgMargin.bottom, this.svgWidth - this.svgMargin.right));
        util.createPath({
            d: d.join(''),
            strokeColor: constant.LINE_COLOR
        }, this.charts);
        this._drawHorizontal();
        this._drawVertical();
        this._drawTime();
        this._drawPrice();
    },
    /**
     * 画水平线
     */
    _drawHorizontal: function() {
        var d = [];
        //画中线
        var mid = Math.round(this.svgMargin.top + this.chartHeight / 2);
        util.createPath({
            d: "M{0},{1}L{2},{1}".format(this.svgMargin.left, mid, this.svgWidth - this.svgMargin.right),
            "stroke-width": 1,
            strokeColor: constant.MIDDLE_COLOR
        }, this.charts);
        var distance = this.chartHeight / 2,
            diff = distance / this.hcount,
            w = this.svgWidth - this.svgMargin.right,
            i = 0,
            y = 0;
        //中线到最高点
        for (; i < this.hcount - 1; i++) {
            y = Math.round(this.svgMargin.top + distance - (i + 1) * diff);
            d.push("M{0},{1}L{2},{1}".format(this.svgMargin.left, y, w));
        }
        //从中线到最低点
        i = 0;
        for (; i < this.hcount - 1; i++) {
            y = Math.round(this.svgMargin.top + distance + (i + 1) * diff);
            d.push("M{0},{1}L{2},{1}".format(this.svgMargin.left, y, w));
        }
        util.createPath({
            d: d.join(''),
            strokeColor: constant.LINE_COLOR
        }, this.charts);
    },
    /**
     * 画水平线的价格和幅度
     */
    _drawPrice: function() {
        if (this.pk.c === 0) {
            return;
        }
        //中线
        var mid = Math.round(this.svgMargin.top + this.chartHeight / 2);
        util.createText({
            v: this.pk.c.toFixed(2),
            x: this.svgMargin.left - 3,
            y: mid,
            textColor: constant.CLOSEPRICE_COLOR,
            hAlign: "end",
            vAlign: "middle"
        }, this.charts);
        util.createText({
            v: "0.00%",
            x: this.svgMargin.left + this.chartWidth + 3,
            y: mid,
            textColor: constant.CLOSEPRICE_COLOR,
            hAlign: "start",
            vAlign: "middle"
        }, this.charts);
        mid = this.chartHeight / 2;
        var distance = mid / this.hcount,
            balance = this.diffPrice / this.hcount,
            i = 0,
            y = 0,
            price = 0,
            percent = null,
            vAlign = "middle";;
        //中线到最高点

        for (; i < this.hcount; i++) {
            y = Math.round(mid + this.svgMargin.top - (i + 1) * distance);
            price = (this.pk.c + balance * (i + 1)).toFixed(2);
            percent = (((balance * (i + 1)) / this.pk.c) * 100).toFixed(2) + "%";
            if (i == this.hcount - 1) {
                vAlign = "top";
            }
            util.createText({
                v: price,
                x: this.svgMargin.left - 3,
                y: y,
                textColor: constant.PRICE_UP_COLOR,
                hAlign: "end",
                vAlign: vAlign
            }, this.charts);
            util.createText({
                v: percent,
                x: this.svgMargin.left + this.chartWidth + 3,
                y: y,
                textColor: constant.PRICE_UP_COLOR,
                hAlign: "start",
                vAlign: vAlign
            }, this.charts);
        }
        //从中线到最低点
        i = 0;
        vAlign = "middle";
        for (; i < this.hcount; i++) {
            y = Math.round(mid + this.svgMargin.top + (i + 1) * distance);
            price = (this.pk.c - balance * (i + 1)).toFixed(2);
            percent = (((balance * (i + 1)) / this.pk.c) * 100).toFixed(2) + "%";
            if (i == this.hcount - 1) {
                vAlign = "bottom";
            }
            util.createText({
                v: price,
                x: this.svgMargin.left - 3,
                y: y,
                textColor: constant.PRICE_DOWN_COLOR,
                hAlign: "end",
                vAlign: vAlign
            }, this.charts);
            util.createText({
                v: percent,
                x: this.svgMargin.left + this.chartWidth + 3,
                y: y,
                textColor: constant.PRICE_DOWN_COLOR,
                hAlign: "start",
                vAlign: vAlign
            }, this.charts);
        }
    },
    _drawVertical: function() {
        var y = this.svgHeight - this.svgMargin.bottom,
            start = this.startTime + 60 * 60 * 1000 * this.timeSpan,
            x = 0,
            d = [];
        while (start < this.endTime) {
            x = Math.round(this.svgMargin.left + (start - this.startTime) / 1000 * this.timeWidth);
            d.push("M{0},{1}L{2},{3}".format(x, this.svgMargin.top, x, y));
            start += 60 * 60 * 1000 * this.timeSpan;
        }
        util.createPath({ d: d.join(''), strokeColor: constant.LINE_COLOR, dash: true }, this.charts);
    },
    /**
     * 绘制时间
     */
    _drawTime: function() {
        var y = this.svgHeight - this.svgMargin.bottom,
            start = this.startTime + 60 * 60 * 1000 * this.timeSpan,
            x = 0;
        util.createText({
            v: util.getTimeString(this.startTime),
            x: this.svgMargin.left,
            y: y,
            textColor: constant.TXT_COLOR,
            hAlign: "start",
            vAlign: "top"
        }, this.charts);
        while (start < this.endTime) {
            x = Math.round(this.svgMargin.left + (start - this.startTime) / 1000 * this.timeWidth);
            util.createText({
                v: util.getTimeString(start),
                x: x,
                y: y,
                textColor: constant.TXT_COLOR,
                hAlign: "middle",
                vAlign: "top"
            }, this.charts);
            start += 60 * 60 * 1000 * this.timeSpan;
        }
        if ((new Date(this.endTime)).getMinutes() === 0) {
            util.createText({
                v: util.getTimeString(this.endTime - 60 * 1000),
                x: this.svgMargin.left + this.chartWidth,
                y: y,
                textColor: constant.TXT_COLOR,
                hAlign: "middle",
                vAlign: "top"
            }, this.charts);
        }
    },
    /**
     * 画分时线
     */
    _drawLine: function() {
        this.newData.length = 0;
        var len = this.originalData.length;
        var first = this.originalData[0];
        var start = this.svgMargin.top + this.chartHeight / 2;
        var startPrice = this.pk.c;
        var startX = this.svgMargin.left;
        var startY = this.svgMargin.top + this.chartHeight / 2 + (this.pk.c - first.price) * this.priceHight;
        var item, lineX, lineY;
        if (this.linePath == null) {
            this.linePath = util.createPath({
                strokeColor: constant.TIME_LINE_COLOR
            });
        }
        var d = [],
            index = 1;
        d.push("M{0},{1}".format(startX, Math.round(startY)));
        this.newData.push({
            index: 0,
            x: startX,
            y: startY,
            price: first.price,
            volume: first.volume,
            time: util.getTimeString(first.time),
            millSeconds: first.time
        });
        for (var i = 1; i < len; i++) {
            item = this.originalData[i];
            lineX = this.svgMargin.left + util.getTimeDiff(first.time, item.time) * this.timeWidth;
            lineY = this.svgMargin.top + this.chartHeight / 2 + (this.pk.c - item.price) * this.priceHight;
            var ob = {
                index: index,
                x: lineX,
                y: lineY,
                price: item.price,
                volume: item.volume,
                time: util.getTimeString(item.time),
                millSeconds: item.time
            };
            this.newData.push(ob);
            d.push("L{0},{1}".format(Math.round(lineX), Math.round(lineY)));
            index++;
        }
        if (index > 1) {
            this.linePath.setAttribute("d", d.join(''));
        }
        this.charts.appendChild(this.linePath);
    }
}
export default new DrawTimeLine()
