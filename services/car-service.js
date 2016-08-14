/**
 * Created by dmytro on 14.07.16.
 */
'use strict';

exports.handleArrivedCars = function (db, callback) {
    let cars = db.collection('cars');
    findArrivedCars(cars).then((carsArray)=> {
        if (carsArray.length > 0) {
            new Promise((resolve, reject)=> {
                let orders = db.collection('orders');
                let ordersArray = [];

                (function (iterations) {
                    let i = 0;

                    function forloop() {
                        if (i <= iterations) {
                            if (i == iterations) {
                                resolve(ordersArray);
                                return;
                            }
                            let car = carsArray[i];
                            ordersArray.push(car._order);
                            changeOrderStateToDelivered(orders, car).then(()=> {
                                return pollOrderFromQueue(orders)
                            }).then((order)=> {
                                if (order) {
                                    return changeOrderStateToTrans(orders, order);
                                }
                            }).then((order)=> {
                                if (order) {
                                    return pickOrderByCar(cars, car, order);
                                } else {
                                    return makeCarFree(cars, car);
                                }
                            }).then(()=> {
                                i++;
                                forloop();
                            });
                        }

                    };
                    forloop()

                })(carsArray.length);
            }).then((ordersArray)=> {
                console.log(ordersArray.length);
                callback(ordersArray);
            })
        } else {
            console.log('there is no arriverd cars');
            callback();
        }
    });
}
function findArrivedCars(cars) {
    return new Promise((resolve, reject)=> {
        cars.find({"arrivalTime": {$lt: new Date()}}).toArray(function (err, carsArray) {
            if (err) {
                reject(err);
            }
            resolve(carsArray);
        })
    });

}
function changeOrderStateToDelivered(orders, car) {
    return new Promise((resolve, reject)=> {
        orders.updateOne({"_id": car._order}, {$set: {"state": 2}}, function (err, r) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}
function pollOrderFromQueue(orders) {
    return new Promise((resolve, reject)=> {
        orders.find({"state": 0}).sort({"created": 1}).limit(1).next(function (err, order) {
            if (err) {
                reject(err)
            }
            resolve(order);
        });
    })
}
function changeOrderStateToTrans(orders, order) {
    return new Promise((resolve, reject)=> {
        orders.updateOne({"_id": order._id}, {$set: {"state": 1}}, function (err, r) {
            if (err) {
                reject(err)
            }
            resolve(order);
        });
    });
}
function pickOrderByCar(cars, car, order) {
    return new Promise((resolve, reject)=> {
        cars.updateOne({"_id": car._id}, {
                $set: {
                    "arrivalTime": new Date(Date.now() + order.estimatedTime * 1000),
                    "_order": order._id
                }
            },
            function (err, r) {
                if (err) {
                    reject(err);
                }
                resolve();
            })
    });
}

function makeCarFree(cars, car) {
    return new Promise((resolve, reject)=> {
        cars.updateOne({"_id": car._id}, {
            $set: {
                "arrivalTime": null,
                "isAvailable": true,
                "_order": null
            }
        }, function (err, r) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}