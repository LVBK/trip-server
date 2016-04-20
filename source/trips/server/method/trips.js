insertTripAsync = function (trip, callback) {
    try {
        check(trip, TripsSchema);
        Trips.insert(
            trip,
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
checkLogin = function(){
    if(!this.userId){
        throw new Meteor.Error(406, "Login first");
    }
}
Meteor.methods({
    createATrip: function (doc) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            checkLogin();
            doc = _.extend({}, doc, {owner: this.userId});
            var insertTripSync = Meteor.wrapAsync(insertTripAsync);
            var tripId = insertTripSync(doc);
            var roadMapIds = [], roadMapId;
            var insertRoadMapSync = Meteor.wrapAsync(insertRoadMapAsync);
            if (doc.tripType == 'one-time') {
                roadMapId = insertRoadMapSync(tripId, doc.origin, doc.destination, doc.travelDate, doc.travelTime);
                roadMapIds.push(roadMapId);
                if (doc.isRoundTrip == true) {
                    roadMapId = insertRoadMapSync(tripId, doc.destination, doc.origin, doc.returnDate, doc.returnTime);
                    roadMapIds.push(roadMapId);
                }
            }
            if (doc.tripType == 'often') {
                if (doc.isRoundTrip == true) {
                    for (i = doc.startDate; i <= doc.endDate; i.setDate(i.getDate() + 1)) {
                        if (doc.travelDaysInWeek[i.getDay()]) {
                            roadMapId = insertRoadMapSync(tripId, doc.origin, doc.destination, i, doc.travelTime);
                            roadMapIds.push(roadMapId);
                        }
                        if (doc.returnDaysInWeek[i.getDay()]) {
                            roadMapId = insertRoadMapSync(tripId, doc.destination, doc.origin, i, doc.returnTime);
                            roadMapIds.push(roadMapId);
                        }
                    }
                } else {
                    for (i = doc.startDate; i <= doc.endDate; i.setDate(i.getDate() + 1)) {
                        if (doc.travelDaysInWeek[i.getDay()]) {
                            roadMapId = insertRoadMapSync(tripId, doc.origin, doc.destination, i, doc.travelTime);
                            roadMapIds.push(roadMapId);
                        }
                    }
                }
            }
            myFuture.return(tripId);
        } catch (err) {
            console.log("createATrip: ", err.reason);
            if(tripId){
                Trips.remove({_id: tripId});
            }
            if(roadMapIds && roadMapIds.length > 0){
                RoadMaps.remove({_id: {$in: roadMapIds}});
            }
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
});