Meteor.publish("trip_search", function (origin, destination, distance) {
    var self = this, tripsIds, destinationIdSelector, destinationLocationSelector, destinationQuery={$and:[]};
    try {
        if(origin && origin.length == 2){
            tripsIds = Trips.find({
                origin: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [origin[0], origin[1]]
                        },
                        $maxDistance: distance
                    }
                }
            }).map(function (trip) {
                return trip._id;
            });
            destinationIdSelector = {_id: {$in: tripsIds}};
        } else {
            destinationIdSelector = {};
        }
        destinationQuery.$and.push(destinationIdSelector);
        if(destination && destination.length == 2){
            destinationLocationSelector = {
                destination: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [destination[0], destination[1]]
                        },
                        $maxDistance: distance
                    }
                }
            }
        } else {
            destinationLocationSelector = {};
        }
        destinationQuery.$and.push(destinationLocationSelector);
        return Trips.find(destinationQuery);
    } catch
        (err) {
        console.log("trip_search", err);
        self.ready();
        return;
    }
})
;