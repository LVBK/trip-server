Meteor.methods({
    feedback: function (tripId, rate, content) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            checkLogin(this.userId);
            check(tripId, String);
            check(content, Match.Optional(String));
            check(rate, Match.Where(function (rate) {
                check(rate, Number);
                if (rate < 1 || rate > 5) {
                    throw new Meteor.Error(405, "Rating out of range (1-5)");
                }
                return rate >= 1 && rate <= 5;
            }));
            var trip = Trips.findOne({_id: tripId});
            if (!trip) {
                throw new Meteor.Error(406, "Not found trip for feedback");
            }
            if (trip.hasOwnProperty('isDeleted') && trip.isDeleted == true) {
                throw new Meteor.Error(407, "This trip has been removed, can't feedback");
            }
            var feedback = Feedbacks.findOne({
                $and: [
                    {tripId: trip._id},
                    {from: this.userId}
                ]
            });
            if(feedback){
                throw new Meteor.Error(408, "Already have feedback, can not anymore");
            }
            Feedbacks.insert({
                tripId: trip._id,
                from: this.userId,
                to: trip.owner,
                rate: rate,
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
            console.log("feedback: ", err.reason);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
});