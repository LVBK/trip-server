Meteor.methods({
    bookSeats: function (roadMapId, totalSeat) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            checkLogin(this.userId);
            check(roadMapId, String);
            check(totalSeat, Match.Where(function(totalSeat){
                check(totalSeat, Number);
                if(totalSeat <= 0){
                    throw new Meteor.Error(405, "Number of bookSeat must be larger than 0");
                }
                return totalSeat > 0;
            }));

            var roadMap = RoadMaps.findOne({_id: roadMapId});
            if(!roadMap){
                throw new Meteor.Error(406, "Not found roadmap for booking");
            }
            var trip = Trips.findOne({_id: roadMap.tripId});
            if(!trip){
                throw new Meteor.Error(407, "Not found trip for booking");
            }
            if(trip.hasOwnProperty('isDeleted') && trip.isDeleted == true){
                throw new Meteor.Error(408, "This trip has been deleted");
            }
            if(trip.hasOwnProperty('isFreezing') && trip.isFreezing == true){
                throw new Meteor.Error(409, "This trip do not accept for booking now");
            }
            var user = Meteor.users.findOne({_id: roadMap.owner});
            if(!user || (user.hasOwnProperty('isDeleted') && user.isDeleted == true)){
                throw new Meteor.Error(410, "Not found driver, can't book this trip");
            }
            if(totalSeat > (trip.seats - roadMap.slots.length)){
                throw new Meteor.Error(411, "Not enough empty seat for book");
            }
            //Create order
            Reservations.insert({
                roadMapid: roadMap._id,
                userId: this.userId,
                totalSeat: totalSeat
            }, function(err, result){
                if(err){
                    myFuture.throw(err);
                    return myFuture.wait();
                } else {
                    myFuture.return(result);
                    return myFuture.wait();
                }
            })
        } catch (err) {
            console.log("bookSeats: ", err.reason);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
    //TODO: 2 Method for driver accept or deny reservation
});