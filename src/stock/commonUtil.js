import constantUtil from './constantsUtil'

String.prototype.format = function() {
    var regex = /\{(\d+)\}/g;
    var args = arguments;
    return this.replace(regex, function(match, position) {
        return args[position | 0];
    });
};
/*
 *将日期字符串转为毫秒值
 */
String.prototype.formatTime = function() {
    var yyyy = +this.substr(0, 4);
    var MM = (+this.substr(4, 2)) - 1;
    var dd = +this.substr(6, 2);
    var hh = +this.substr(8, 2);
    var mm = +this.substr(10, 2);
    return new Date(yyyy, MM, dd, hh, mm, 0).getTime();
};
Date.prototype.format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1, // 月份
        "d+": this.getDate(), // 日
        "H+": this.getHours(), // 小时
        "m+": this.getMinutes(), // 分
        "s+": this.getSeconds(), // 秒
        "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
        "S": this.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "")
            .substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

export default {
    dayArr: ["日", "一", "二", "三", "四", "五", "六"],
    sendRequest: function(req) {
        return $.ajax({
            url: this.getQuotationUrl(),
            type: "POST",
            timeout: 1000 * 90,
            dataType: "json",
            data:JSON.stringify(req)
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log(textStatus);
        });
    },
    setQuotationSession: function(value) {
        window.sessionStorage.setItem("sessionQId", value);
    },
    getQuotationSession: function() {
        return window.sessionStorage.getItem("sessionQId");
    },
    getQuotationUrl: function() {
        return "http://10.0.0.38:8080/collection_quotationqueryweb/jsonQuery.do";
    },
    getMarketId: function() {
        return "111";
    },
    getTimeString: function(t) {
        var d = new Date(t);
        return d.toTimeString().substr(0, 5);
    },
    getDateTime: function(d, t) {
        var time = "" + t;
        var date = "" + d;
        var datetime = date + (time.length == 3 ? "0" + time : time);
        var yyyy = +datetime.substr(0, 4);
        var MM = (+datetime.substr(4, 2)) - 1;
        var dd = +datetime.substr(6, 2);
        var hh = +datetime.substr(8, 2);
        var mm = +datetime.substr(10, 2);
        return new Date(yyyy, MM, dd, hh, mm, 0).getTime();
    },
    getDateString: function(d, p) {
        var datestr = d.format("yyyy/MM/dd"),
            day;
        if (p >= 6) {
            return datestr ;
        } else {
            var timestr = d.toTimeString();
            day = this.dayArr[d.getDay()];
            return datestr.substr(5) + " " + timestr.substr(0, 5);
        }
    },
    getTimeDiff: function(t1, t2) {
        return (t2 - t1) / 1000;
    },
    getPriceColor: function(p) {
        if (p > 0) {
            return constantUtil.PRICE_UP_COLOR;
        } else if (p < 0) {
            return constantUtil.PRICE_DOWN_COLOR;
        } else {
            return constantUtil.CLOSEPRICE_COLOR;
        }
    },
    getCandleColor: function(p) {
        var color = null;
        if (p < 0) {
            color = "rgb(84,255,255)";
        } else if (p > 0) {
            color = "rgb(255,50,50)";
        } else {
            color = "rgb(84,255,255)";
        }
        return color;
    },
    timeEqual: function(t1, t2) {
        var dt1 = new Date(t1);
        var dt2 = new Date(t2);
        return dt1.getFullYear() === dt2.getFullYear() && dt1.getMonth() == dt2.getMonth() && dt1.getDate() == dt2.getDate() && dt1.getHours() == dt2.getHours() && dt1.getMinutes() == dt2.getMinutes();
    },
    dayEqual: function(t1, t2) {
        return t1.getFullYear() === t2.getFullYear() && t1.getMonth() == t2.getMonth() && t1.getDate() == t2.getDate();
    },
    createLinearGradient: function(el) {
        var defs = document.createElementNS(constantUtil.SVG_NS, "defs");
        var lg = document.createElementNS(constantUtil.SVG_NS, "linearGradient");
        lg.setAttribute("id", "lg");
        lg.setAttribute("x1", "0");
        lg.setAttribute("x2", "0");
        lg.setAttribute("y1", "0");
        lg.setAttribute("y2", "1");
        var stop = document.createElementNS(constantUtil.SVG_NS, "stop");
        stop.setAttribute("stop-color", "#152746");
        stop.setAttribute("offset", "0");
        lg.appendChild(stop);
        stop = document.createElementNS(constantUtil.SVG_NS, "stop");
        stop.setAttribute("stop-color", "#121213");
        stop.setAttribute("offset", "1");
        lg.appendChild(stop);
        defs.appendChild(lg);
        el.appendChild(defs);
        return defs;

    },
    createPath: function(attr, el) {
        var path = document.createElementNS(constantUtil.SVG_NS, "path");
        if (attr.d) {
            path.setAttribute("d", attr.d);
        }
        if (attr["stroke-width"]) {
            path.setAttribute("stroke-width", attr["stroke-width"]);
        } else {
            path.setAttribute("stroke-width", 1);
        }
        if (attr.strokeColor) {
            path.setAttribute("stroke", attr.strokeColor);
        } else {
            path.setAttribute("stroke", "none");
        }
        if (attr.fillColor) {
            path.setAttribute("fill", attr.fillColor)
        } else {
            path.setAttribute("fill", "none");
        }
        if (attr.dash) {
            path.setAttribute("stroke-dasharray", 1.5);
        }
        if (attr.opacity) {
            path.setAttribute("opacity", attr.opacity);
        }
        if (el) {
            el.appendChild(path);
        }
        return path;

    },
    createTextG: function(parent) {
        var g = document.createElementNS(constantUtil.SVG_NS, "g");
        parent.appendChild(g);
        return g;
    },
    createRect: function(attr, el) {
        var rect = document.createElementNS(constantUtil.SVG_NS, "rect");
        rect.setAttribute("x", attr.x);
        rect.setAttribute("y", attr.y);
        rect.setAttribute("width", attr.width);
        rect.setAttribute("height", attr.height);
        rect.setAttribute("fill", attr.fillColor);
        rect.setAttribute("stroke", attr.strokeColor);
        rect.setAttribute("stroke-width", 1);
        if (el) {
            el.appendChild(rect);
        }
        return rect;
    },
    createText: function(attr, el) {
        var text = document.createElementNS(constantUtil.SVG_NS, "text");
        text.setAttribute("x", attr.x);
        text.setAttribute("y", attr.y);
        text.setAttribute("text-anchor", attr.hAlign);
        text.setAttribute("fill", attr.textColor);
        if (attr["font-size"]) {
            text.setAttribute("font-size", attr["font-size"]);
            text.setAttribute("font-family", constantUtil.FONT_FAMILY);
        } else {
            text.setAttribute("style", "font-size:" + constantUtil.FONT_SIZE + ";font-family:" + constantUtil.FONT_FAMILY);
        }
        var tSpan = document.createElementNS(constantUtil.SVG_NS, "tspan");
        tSpan.textContent = attr.v;
        text.appendChild(tSpan);
        if (el) {
            el.appendChild(text);
            var box = text.getBBox();
            if (attr.vAlign == "middle") {
                tSpan.setAttribute("dy", attr.y - (box.y + box.height / 2));
            } else if (attr.vAlign == "top") {
                tSpan.setAttribute("dy", attr.y - box.y);
            } else if (attr.vAlign == "bottom") {
                tSpan.setAttribute("dy", attr.y - (box.y + box.height));
            }
        }
        return text;
    },
    createTextNoSpan: function(attr, el) {
        var text = document.createElementNS(constantUtil.SVG_NS, "text");
        text.setAttribute("x", attr.x);
        text.setAttribute("y", attr.y);
        text.setAttribute("dy", 5);
        text.setAttribute("text-anchor", attr["text-anchor"]);
        text.setAttribute("fill", attr.fill);
        if (attr["font-size"]) {
            text.setAttribute("font-size", attr["font-size"]);
            text.setAttribute("font-family", constantUtil.FONT_FAMILY);
        } else {
            text.setAttribute("style", "font-size:" + constantUtil.FONT_SIZE + ";font-family:" + constantUtil.FONT_FAMILY);
        }
        if (el) {
            el.appendChild(text);
        }
        return text;
    },
    createTSpan: function(attr, el) {
        var tSpan = document.createElementNS(constantUtil.SVG_NS, "tspan");
        tSpan.textContent = attr.v;
        attr.fill && tSpan.setAttribute("fill", attr.fill);
        attr.dx && tSpan.setAttribute("dx", attr.dx);
        if (el) {
            el.appendChild(tSpan);
        }
        return tSpan;
    },
    setTSpanValue: function(el, value) {
        el.textContent = value;
    },
    setTextAttr: function(el, attr) {
        for (var a in attr) {
            if (el.hasAttribute(a)) {
                el.setAttribute(a, attr[a]);
            }
        }
        var tspan = el.getElementsByTagNameNS(constantUtil.SVG_NS, "tspan");
        if (tspan.length) {
            tspan[0].textContent = attr.v;
        }
    },
    setCommonAttr: function(el, attrs) {
        for (var a in attrs) {
            el.setAttribute(a, attrs[a]);
        }
    },
    createCommonG: function(attrs, parent) {
        var g = document.createElementNS(constantUtil.SVG_NS, "g");
        if (attrs) {
            this.setCommonAttr(g, attrs);
        }
        if (parent) {
            parent.appendChild(g);
        }
        return g;
    },
    createCommonPath: function(attrs, parent) {
        var path = document.createElementNS(constantUtil.SVG_NS, "path");
        if (attrs) {
            this.setCommonAttr(path, attrs);
        }
        if (parent) {
            parent.appendChild(path);
        }
        return path;
    },
    createCommonText: function(attrs, parent) {
        var text = document.createElementNS(constantUtil.SVG_NS, "text");
        if (attrs) {
            this.setCommonAttr(text, attrs);
        }
        if (parent) {
            parent.appendChild(text);
        }
        return text;
    },
    createCommonSpan: function(attrs, parent) {
        var tSpan = document.createElementNS(constantUtil.SVG_NS, "tspan");
        if (attrs) {
            this.setCommonAttr(tSpan, attrs);
        }
        if (parent) {
            parent.appendChild(tSpan);
        }
        return tSpan;
    }
}
