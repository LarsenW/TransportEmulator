/**
 * Created by dmytro on 14.07.16.
 */
'use strict';
var assert = require('assert');

exports.handleArrivedCars = function (db, callback) {
    var cars = db.collection('cars');
    cars.find({"arrivalTime": {$lt: new Date()}}).toArray(function (err, docs) {
        assert.equal(err, null);
        new Promise((resolve, reject)=> {
            if (docs.length > 0) {
                var orders = db.collection('orders');
                for (var i = 0; i <= docs.length; i++) {
                    if (i == docs.length) {
                        resolve(i);
                    }
                    orders.updateOne({"_id": docs[i].order}, {$set: {"state": 2}}, function (err, r) {
                        assert.equal(null, err);
                    });
                    cars.updateOne({"_id": docs[i]._id}, {
                        $set: {
                            "arrivalTime": null,
                            "isAvailable": true,
                            "order": null
                        }
                    }, function (err, r) {
                        assert.equal(null, err);
                    })
                }
            } else {
                resolve();
            }
        }).then((i)=> {
            var result = i ? i : 0;
            console.log(result + " cars has been handled");
            callback();
        });

    });
}