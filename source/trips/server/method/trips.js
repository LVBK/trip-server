function createATripDocument(origin, destination, date, time) {
    date.setHours(time.getHours());
    date.setMinutes(time.getMinutes());
    date.setMilliseconds(0);
    date.setSeconds(0);
    var output = {
        origin: origin,
        destination: destination,
        date: date,

    };
    return output;
}
Meteor.methods({
    createATrip: function (origin, destination, tripDateTime) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(origin, LocationSchema);
            check(destination, LocationSchema);
            check(tripDateTime.isRoundTrip, Boolean);
            check(tripDateTime.tripType, Match.Where(function (tripType) {
                if (tripType !== 'one-time' && tripType !== 'often') {
                    throw Meteor.Errpr('Invalid trip type');
                } else
                    return true;
            }));
            check(tripDateTime.travelDate, Match.Optional(Date));
            check(tripDateTime.travelTime, Date);
            check(tripDateTime.returnDate, Match.Optional(Date));
            check(tripDateTime.returnTime, Match.Optional(Date));
            check(tripDateTime.startDate, Match.Where(function (startDate) {
                if (tripDateTime.tripType === 'often') {
                    check(startDate, Date);
                }
                return true;
            }));
            check(tripDateTime.endDate, Match.Where(function (endDate) {
                if (tripDateTime.tripType === 'often') {
                    check(endDate, Date);
                }
                return true;
            }));
            check(tripDateTime.travelOften, Match.Where(function (travelOften) {
                if (tripDateTime.tripType === 'often') {
                    check(travelOften, [Boolean]);
                    return travelOften.length == 7;
                } else {
                    return true;
                }
            }));
            check(tripDateTime.returnOften, Match.Where(function (returnOften) {
                if (tripDateTime.tripType === 'often' && tripDateTime.isRoundTrip == true) {
                    check(returnOften, ([Boolean]));
                    return returnOften.length == 7;
                } else {
                    return true;
                }
            }));
            if (tripDateTime.hasOwnProperty('travelDate')) {
                console.log(createATripDocument(origin, destination, tripDateTime.travelDate, tripDateTime.travelTime));
            }
            if (tripDateTime.hasOwnProperty('returnDate')) {
                console.log(createATripDocument(destination, origin, tripDateTime.returnDate, tripDateTime.returnTime));
            }
            if (tripDateTime.hasOwnProperty('startDate') && tripDateTime.hasOwnProperty('endDate')) {
                if (tripDateTime.isRoundTrip == true) {
                    for (i = tripDateTime.startDate; i <= tripDateTime.endDate; i.setDate(i.getDate() + 1)) {
                        if (tripDateTime.travelOften[i.getDay()]) {
                            console.log(createATripDocument(origin, destination, i, tripDateTime.travelTime));
                        }
                        if (tripDateTime.returnOften[i.getDay()]) {
                            console.log(createATripDocument(destination, origin, i, tripDateTime.returnTime));
                        }
                    }
                } else {
                    for (i = tripDateTime.startDate; i <= tripDateTime.endDate; i.setDate(i.getDate() + 1)) {
                        if (tripDateTime.travelOften[i.getDay()]) {
                            console.log(createATripDocument(origin, destination, i, tripDateTime.travelTime));
                        }
                    }
                }
            }
            Trips.insert({
                origin: origin,
                destination: destination
            }, function (err, result) {
                if (err) {
                    myFuture.throw(err);
                    return myFuture.wait();
                } else {
                    myFuture.return(result);
                }
            })
        } catch (err) {
            console.log("createATrip: ", err);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
});