Meteor.methods({
    comment: function(tripId, receiveUserId, content) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            checkLogin(this.userId);
            check(tripId, String);
            check(receiveUserId, Match.Optional(String));
            check(content,String);
            var trip = Trips.findOne({_id: tripId});
            if (!trip) {
                throw new Meteor.Error(406, "Not found trip for feedback");
            }
            if (trip.hasOwnProperty('isDeleted') && trip.isDeleted == true) {
                throw new Meteor.Error(407, "This trip has been removed, can't feedback");
            }
            receiveUserId = receiveUserId || trip.owner;
            Comments.insert({
                tripId: trip._id,
                from: this.userId,
                to: receiveUserId,
                content: content,
            }, function (err, result) {
                if (err) {
                    myFuture.throw(err);
                    return myFuture.wait();
                } else {
                    myFuture.return(result);
                    return myFuture.wait();
                }
            })
        } catch (err) {
            console.log("comment: ", err);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
});