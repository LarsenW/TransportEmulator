/**
 * Created by dmytro on 15.08.16.
 */
'use strict';
let eachSeries = require('async/eachSeries');
let array = [8, 5, 6];

eachSeries(array, function (element, callback) {
    setTimeout(function () {
        console.log(element);
        callback();
    }, 3000)
})