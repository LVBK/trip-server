insertTripAsync = function (trip, date, time, slots, callback) {
    try {
        date.setHours(time.getHours());
        date.setMinutes(time.getMinutes());
        date.setMilliseconds(0);
        date.setSeconds(0);
        Trips.insert(
            {
                owner: trip.owner,
                origin: trip.origin,
                destination: trip.destination,
                vehicle: trip.vehicle,
                seats: trip.seats,
                startAt: date,
                slots: slots,
                pricePerSeat: trip.pricePerSeat,
                baggageSize: trip.baggageSize,
                flexibleTime: trip.flexibleTime,
                flexibleDistance: trip.flexibleDistance,
                note: trip.note,
            },
            function (err, result) {
                if (err) {
                    callback(err)
                } else {
                    callback(false, result);
                }
            })
    } catch (err) {
        console.log("insertTripAsync", err);
        callback(err);
    }
};
checkLogin = function (userId) {
    if (!userId) {
        throw new Meteor.Error(406, "Login first");
    }
}
Meteor.methods({
    createATrip: function (doc) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            checkLogin(this.userId);
            doc = _.extend({}, doc, {owner: this.userId});
            check(doc, TripsValidationSchema);
            var insertTripSync = Meteor.wrapAsync(insertTripAsync);
            var tripIds = [], tripId, slots = [];
            for (var i = (doc.seats - doc.emptySeats); i >= 1; i--) {
                slots.push(this.userId);
            }
            if (doc.tripType == 'one-time') {
                tripId = insertTripSync(doc, doc.travelDate, doc.travelTime, slots);
                tripIds.push(tripId);
                if (doc.isRoundTrip == true) {
                    tripId = insertTripSync(doc, doc.returnDate, doc.returnTime, slots);
                    tripIds.push(tripId);
                }
            }
            if (doc.tripType == 'often') {
                if (doc.isRoundTrip == true) {
                    for (i = doc.startDate; i <= doc.endDate; i.setDate(i.getDate() + 1)) {
                        if (doc.travelDaysInWeek[i.getDay()]) {
                            tripId = insertTripSync(doc, i, doc.travelTime, slots);
                            tripIds.push(tripId);
                        }
                        if (doc.returnDaysInWeek[i.getDay()]) {
                            tripId = insertTripSync(doc, i, doc.returnTime, slots);
                            tripIds.push(tripId);
                        }
                    }
                } else {
                    for (i = doc.startDate; i <= doc.endDate; i.setDate(i.getDate() + 1)) {
                        if (doc.travelDaysInWeek[i.getDay()]) {
                            tripId = insertTripSync(doc, i, doc.travelTime, slots);
                            tripIds.push(tripId);
                        }
                    }
                }
            }
            myFuture.return(tripId);
        } catch (err) {
            console.log("createATrip: ", err.reason);
            if (tripIds && tripIds.length > 0) {
                Trips.remove({_id: {$in: tripIds}});
            }
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
});