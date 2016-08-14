/**
 * Created by dmytro on 22.07.16.
 */
"use strict";
let request = require("request");
let config = require('../config');

let url = config.get('delivery:host') + config.get('delivery:path');
exports.notify = function (ordersArray) {
    let requestBody = JSON.stringify(ordersArray);
    request({
        uri: url,
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: requestBody
    }, function (err, resposne, body) {
        if (err) {
            console.log(err)
        } else {
            console.log(body);
        }
    })
}