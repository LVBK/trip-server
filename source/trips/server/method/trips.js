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
            if(!this.userId){
                throw new Meteor.Error(406, "Login first");
            }
            param = _.extend({}, param, {owner: this.userId});
            check(param, TripsSchema);
            if (param.hasOwnProperty('travelDate')) {
                console.log(createATripDocument(param.origin, param.destination, param.travelDate, param.travelTime));
            }
            if (param.hasOwnProperty('returnDate')) {
                console.log(createATripDocument(param.destination, param.origin, param.returnDate, param.returnTime));
            }
            if (param.hasOwnProperty('startDate') && param.hasOwnProperty('endDate')) {
                if (param.isRoundTrip == true) {
                    for (i = param.startDate; i <= param.endDate; i.setDate(i.getDate() + 1)) {
                        if (param.travelDaysInWeek[i.getDay()]) {
                            console.log(createATripDocument(param.origin, param.destination, i, param.travelTime));
                        }
                        if (param.returnDaysInWeek[i.getDay()]) {
                            console.log(createATripDocument(param.destination, param.origin, i, param.returnTime));
                        }
                    }
                } else {
                    for (i = param.startDate; i <= param.endDate; i.setDate(i.getDate() + 1)) {
                        if (param.travelDaysInWeek[i.getDay()]) {
                            console.log(createATripDocument(param.origin, param.destination, i, param.travelTime));
                        }
                    }
                }
            }
            Trips.insert(
                param,
                function (err, result) {
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