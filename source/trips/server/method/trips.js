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
    createATrip: function (param) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(param.origin, LocationSchema);
            check(param.destination, LocationSchema);
            check(param.isRoundTrip, Boolean);
            check(param.tripType, Match.Where(function (tripType) {
                if (tripType !== 'one-time' && tripType !== 'often') {
                    throw Meteor.Errpr('Invalid trip type');
                } else
                    return true;
            }));
            check(param.travelDate, Match.Optional(Date));
            check(param.travelTime, Date);
            check(param.returnDate, Match.Optional(Date));
            check(param.returnTime, Match.Optional(Date));
            check(param.startDate, Match.Where(function (startDate) {
                if (param.tripType === 'often') {
                    check(startDate, Date);
                }
                return true;
            }));
            check(param.endDate, Match.Where(function (endDate) {
                if (param.tripType === 'often') {
                    check(endDate, Date);
                }
                return true;
            }));
            check(param.travelOften, Match.Where(function (travelOften) {
                if (param.tripType === 'often') {
                    check(travelOften, [Boolean]);
                    return travelOften.length == 7;
                } else {
                    return true;
                }
            }));
            check(param.returnOften, Match.Where(function (returnOften) {
                if (param.tripType === 'often' && param.isRoundTrip == true) {
                    check(returnOften, ([Boolean]));
                    return returnOften.length == 7;
                } else {
                    return true;
                }
            }));
            if (param.hasOwnProperty('travelDate')) {
                console.log(createATripDocument(param.origin, param.destination, param.travelDate, param.travelTime));
            }
            if (param.hasOwnProperty('returnDate')) {
                console.log(createATripDocument(param.destination, param.origin, param.returnDate, param.returnTime));
            }
            if (param.hasOwnProperty('startDate') && param.hasOwnProperty('endDate')) {
                if (param.isRoundTrip == true) {
                    for (i = param.startDate; i <= param.endDate; i.setDate(i.getDate() + 1)) {
                        if (param.travelOften[i.getDay()]) {
                            console.log(createATripDocument(param.origin, param.destination, i, param.travelTime));
                        }
                        if (param.returnOften[i.getDay()]) {
                            console.log(createATripDocument(param.destination, param.origin, i, param.returnTime));
                        }
                    }
                } else {
                    for (i = param.startDate; i <= param.endDate; i.setDate(i.getDate() + 1)) {
                        if (param.travelOften[i.getDay()]) {
                            console.log(createATripDocument(param.origin, param.destination, i, param.travelTime));
                        }
                    }
                }
            }
            Trips.insert({
                origin: param.origin,
                destination: param.destination
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