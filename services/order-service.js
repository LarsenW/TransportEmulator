/**
 * Created by dmytro on 15.08.16.
 */
'use strict';
let carService = require('./car-service');
let eachSeries = require('async/eachSeries');
let _ = require("underscore");

exports.changeOrderStateToDelivered = function changeOrderStateToDelivered(orders, car) {
    return new Promise((resolve, reject)=> {
        orders.updateOne({"_id": car._order}, {$set: {"state": 2}}, function (err, r) {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}
exports.pollOrderFromQueue = function (orders) {
    return new Promise((resolve, reject)=> {
        orders.find({"state": 0}).sort({"created": 1}).limit(1).next(function (err, order) {
            if (err) {
                reject(err)
            }
            resolve(order);
        });
    })
}
exports.changeOrderStateToTrans = function (orders, order) {
    return new Promise((resolve, reject)=> {
        orders.updateOne({"_id": order._id}, {$set: {"state": 1}}, function (err, r) {
            if (err) {
                reject(err)
            }
            resolve(order);
        });
    });
};
function getAllShippingOrders(db) {
    let orders = db.collection('orders');
    return new Promise((resolve, reject)=> {
        orders.find({"state": 0}).sort({"created": 1}).toArray(function (err, ordersArray) {
            if (err) {
                reject(err);
            } else {
                resolve(ordersArray);
            }
        })
    })

}
exports.updateOrdersArrivalTime = function (db) {
    return new Promise((resolve, reject)=> {
        let shippingOrders;
        getAllShippingOrders(db)
            .then((ordersArray)=> {
                shippingOrders = ordersArray;
                return carService.getCarsTravelTime(db);
            }).then((carsTravelTime)=> {
            return determineArrivalTime(db, shippingOrders, carsTravelTime);
        }).then(()=> {
            resolve();
        }).catch(()=> {
            reject();
        })
    })
}
function determineArrivalTime(db, shippingOrders, carsTravelTime) {
    return new Promise((resolve, reject)=> {
        let orders = db.collection('orders');
        let currentIndex = -1;
        eachSeries(shippingOrders, function (order, callback) {
            currentIndex++;
            let minElement = _.min(carsTravelTime);
            let minElementIndex = carsTravelTime.indexOf(minElement);
            carsTravelTime[minElementIndex] += order.travelTime * 1000;
            console.log(new Date(Date.now() + carsTravelTime[minElementIndex]));
            orders.updateOne({"_id": order._id},
                {$set: {"arrivalTime": new Date(Date.now() + carsTravelTime[minElementIndex])}},
                function (err, r) {
                    if (err) {
                        reject(err);
                        return;
                    } else {
                        if (currentIndex == shippingOrders.length - 1) {
                            resolve();
                        }
                        callback();
                    }
                });
        })
    })
}