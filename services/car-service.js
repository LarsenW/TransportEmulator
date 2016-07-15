/**
 * Created by dmytro on 14.07.16.
 */
'use strict';
let assert = require('assert');

exports.handleArrivedCars = function (db, callback) {
    let cars = db.collection('cars');
    cars.find({"arrivalTime": {$lt: new Date()}}).toArray(function (err, carsArray) {
        assert.equal(err, null);
        if (carsArray.length > 0) {
            new Promise((resolve, reject)=> {
                let orders = db.collection('orders');
                for (let i = 0; i < carsArray.length; i++) {
                    let car = carsArray[i];
                    orders.updateOne({"_id": car._order}, {$set: {"state": 2}}, function (err, r) {
                        assert.equal(null, err);
                        cars.updateOne({"_id": car._id}, {
                            $set: {
                                "arrivalTime": null,
                                "isAvailable": true,
                                "_order": null
                            }
                        }, function (err, r) {
                            assert.equal(null, err);
                            if (i == carsArray.length - 1) {
                                resolve(i);
                            }
                        })
                    })
                }
            }).then((i)=> {
                console.log(i);
                callback();
            })
        } else {
            console.log('else callback');
            callback();
        }

    })
}
/*
 exports.pullOrderFromQueue = function (db, callback) {
 var orders = db.collection('orders');
 orders.find({"state": 0}).toArray(function (err, docs) {
 assert.equal(err, null);
 });
 }*/
