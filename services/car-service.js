/**
 * Created by dmytro on 15.08.16.
 */
'use strict';
let EmptyQueueError = require('../common/errors/empty-queue-error');
let DeactivationError = require('../common/errors/deactivation-error');

let orderService = require('./order-service');
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
                            orderService.changeOrderStateToDelivered(orders, car)
                                .then(()=> {
                                    if (!car.isActive) {
                                        throw new DeactivationError('deactivation');
                                    } else {
                                        return
                                    }
                                })
                                .then(()=> {
                                    return orderService.pollOrderFromQueue(orders)
                                }).then((order)=> {
                                if (!order) {
                                    throw new EmptyQueueError('empty queue')
                                }
                                return orderService.changeOrderStateToTrans(orders, order);
                            }).then((order)=> {
                                return pickOrderByCar(cars, car, order);
                            }).then(()=> {
                                i++;
                                forloop();
                            }).catch(err=> {
                                console.log(err.message);
                                if (err instanceof EmptyQueueError || err instanceof DeactivationError) {
                                    makeCarFree(cars, car).then(()=> {
                                        i++;
                                        forloop();
                                    }).catch(err=> {
                                        console.log(err);
                                    })
                                }
                            })
                        }

                    };
                    forloop()

                })(carsArray.length);
            }).then((ordersArray)=> {
                console.log('orders processed: ' + ordersArray.length);
                callback(ordersArray);
            })
        } else {
            console.log('there is no arriverd cars');
            callback();
        }
    });
};
function findArrivedCars(cars) {
    return new Promise((resolve, reject)=> {
        cars.find({"arrivalTime": {$lt: new Date()}}).toArray(function (err, carsArray) {
            if (err) {
                reject(err);
            }
            resolve(carsArray);
        })
    });

};
function pickOrderByCar(cars, car, order) {
    return new Promise((resolve, reject)=> {
        cars.updateOne({"_id": car._id}, {
                $set: {
                    "arrivalTime": new Date(Date.now() + order.travelTime * 1000),
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

exports.checkActiveCars = function (db) {
    let cars = db.collection('cars');
    return new Promise((resolve, reject)=> {
        cars.find({"isActive": true}).toArray(function (err, carsArray) {
            if (err) {
                reject(err);
            }
            resolve(carsArray);
        })
    })
}
exports.getCarsTravelTime = function (db) {
    let cars = db.collection('cars');
    return new Promise((resolve, reject)=> {
        cars.find({'isActive': true}).toArray(function (err, cars) {
            if (err) {
                reject(err);
            }

            let carsTime = [];

            for (let i = 0; i < cars.length; i++) {
                let travelTimeLeft;
                if (( travelTimeLeft = cars[i].arrivalTime - Date.now()) < 0) {
                    resolve([0]);
                    return;
                }
                carsTime[i] = travelTimeLeft;
            }
            resolve(carsTime);
        })
    })
};