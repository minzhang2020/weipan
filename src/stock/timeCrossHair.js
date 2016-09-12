/*
 * 分时线的十字线以及显示的数据
 */
import util from './commonUtil'
import constant from './constantsUtil'

let crossHair = util.createCommonG({
    "transform": "translate(0, -9999)",
    "class": "charts-tooltip"
});
let crossHair_v = util.createCommonPath({
    "stroke": constant.CROSS_LINE_COLOR,
    visibility: "hidden",
    "stroke-width": 1
});
let crossHair_h = util.createCommonPath({
    "stroke": constant.CROSS_LINE_COLOR,
    visibility: "hidden",
    "stroke-width": 1
});
let crossHair_data_path = util.createCommonPath({
    stroke: "#7cb5ec",
    "stroke-width": 1
}, crossHair);
let crossHair_data = util.createCommonText({
    style: "font-size:12px;",
    x: 8,
    y: 5
}, crossHair);
let crossHair_data_time = util.createCommonSpan({
    fill:constant.CLOSEPRICE_COLOR,
    x: 8,
    dy: 13
}, crossHair_data);
let crossHair_data_price = util.createCommonSpan({
    x: 8,
    dy: 13
}, crossHair_data);
let crossHair_data_change = util.createCommonSpan({
    x: 8,
    dy: 13
}, crossHair_data);
var margin =null,
    height, width,closePrice=0;
export default {
    createCrossHair: function(parent, m, w, h) {
        parent.appendChild(crossHair_h);
        parent.appendChild(crossHair_v);
        parent.appendChild(crossHair);
        margin=m;
        width = w;
        height = h;
    },
    setClosePrice:function(value){
        closePrice=value;
    },
    hidden: function() {
        crossHair_v.setAttribute("visibility", "hidden");
        crossHair_h.setAttribute("visibility", "hidden");
        crossHair.setAttribute("transform", "translate(0, -9999)");
    },
    show: function(x, y, time, price, chg) {
        util.setCommonAttr(crossHair_v, {
            d: "M{0},{1}L{0},{2}".format(Math.round(x), margin.top, height - margin.bottom),
            "visibility": "visible"
        });
        util.setCommonAttr(crossHair_h, {
            d: "M{0},{1}L{2},{1}".format(margin.left, Math.round(y), width - margin.right),
            "visibility": "visible"
        });
        //默认显示100*60
        var tx = x - 50,
            ty = y - 60;
        if (tx < margin.left) {
            tx = x + 5;
        }
        if (x + 50 > width - margin.right) {
            tx = width - margin.right - 100;
        }
        if (ty < margin.top) {
            ty = margin.top;
        }
        if (ty + 60 > y) {
            ty = y + 5;
        }
        crossHair.setAttribute("transform", "translate({0}, {1})".format(Math.round(tx), Math.round(ty)));

        util.setCommonAttr(crossHair_data_path, {
            d: "M{0},{1}L{2},{3},L{4},{5}L{6},{7}Z".format(3, 0, 98, 0, 98, 55, 3, 55)
        })
        crossHair_data_time.textContent = "时间：" + time;

        crossHair_data_price.textContent = "价格：" + price;
        util.setCommonAttr(crossHair_data_price,{
            fill:util.getPriceColor(price-closePrice)
        })
        crossHair_data_change.textContent = "涨跌：" + chg;
        util.setCommonAttr(crossHair_data_change,{
            fill:util.getPriceColor(price-closePrice)
        })
    }
}
