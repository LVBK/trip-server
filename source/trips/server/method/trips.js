Meteor.methods({
    createATrip: function(origin, destination) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(origin, LocationSchema);
            check(destination, LocationSchema);
            Trips.insert({
                origin: origin,
                destination: destination
            }, function(err, result){
                if(err){
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