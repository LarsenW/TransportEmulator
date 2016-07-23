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
                let ordersArray=[];
                
                (function (iterations) {
                    let i = 0;

                    function forloop() {
                        if (i < iterations) {
                            let car = carsArray[i];
                            ordersArray.push(car._order);
                            orders.updateOne({"_id": car._order}, {$set: {"state": 2}}, function (err, r) {
                                assert.equal(null, err);
                                orders.find({"state": 0}).sort({"created": 1}).limit(1).next(function (err, order) {
                                    if (order != null) {
                                        orders.updateOne({"_id": order._id}, {$set: {"state": 1}}, function (err, r) {
                                            assert.equal(err, null);
                                            cars.updateOne({"_id": car._id}, {
                                                    $set: {
                                                        "arrivalTime": new Date(Date.now() + order.estimatedTime * 1000),
                                                        "_order": order._id
                                                    }
                                                },
                                                function (err, r) {
                                                    assert.equal(null, err);
                                                    i++;
                                                    forloop();
                                                    if (i == carsArray.length) {
                                                        resolve(ordersArray);
                                                    }
                                                }
                                            )
                                        });
                                    } else {
                                        cars.updateOne({"_id": car._id}, {
                                            $set: {
                                                "arrivalTime": null,
                                                "isAvailable": true,
                                                "_order": null
                                            }
                                        }, function (err, r) {
                                            assert.equal(null, err);
                                            i++;
                                            forloop()
                                            if (i == carsArray.length) {
                                                resolve(ordersArray);
                                            }
                                        })
                                    }
                                });
                            })
                        }
                    }

                    forloop();
                })(carsArray.length);
            }).then((ordersArray)=> {
                console.log(ordersArray.length);
                callback(ordersArray);
            })
        } else {
            console.log('else callback');
            callback();
        }
    })
}
