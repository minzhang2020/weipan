import Vue from 'vue'
export default {
    getTradeTime(handler) {
            return Vue.http.get("http://172.31.100.64/stock/tradetime/605?marketType=0")
                .then(function(response) {
                    return response.body;
                }).then(handler)
        },
        getPanKou(nextId, handler) {
            return Vue.http.get("http://172.31.100.64/stock/pankou/605/1/" + nextId + "?marketType=0")
                .then(function(response) {
                    return response.body;
                })
                .then(handler);
        },
        getKLine(period, time, handler) {
            return Vue.http.get("http://172.31.100.64/stock/kline/605/1/" + period + "/60/" + time + "?marketType=0")
                .then(function(response) {
                    return response.body;
                })
                .then(handler);
        },
        getTimeData(handler) {
            return Vue.http.get("http://172.31.100.64/stock/time/605/1?marketType=0")
                .then(function(response) {
                    return response.body;
                })
                .then(handler);
        }


}
