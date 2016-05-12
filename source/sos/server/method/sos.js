Meteor.methods({
    sos: function (checkInTicketId, currentLocation) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            var self = this;
            checkLogin(self.userId);
            check(checkInTicketId, String);
            check(currentLocation, Match.Optional(LocationSchema));
            var ticket = CheckInTickets.findOne({$and: [{_id: checkInTicketId}, {isDeleted: false}]});
            if (!ticket) {
                throw new Meteor.Error(407, 'Not found checkin ticket');
            }
            if (ticket.userId !== self.userId) {
                throw new Meteor.Error(408, 'You have no permission to use this checkin ticket');
            }
            Sos.insert({
                    userId: self.userId,
                    sosLocation: currentLocation,
                    tripId: ticket.tripId
                },
                function (err, result) {
                    if (err) {
                        myFuture.throw(err);
                        return myFuture.wait();
                    } else {
                        myFuture.return("SOS report successful!");
                    }
                }
            )
            ;
        } catch (err) {
            console.log("sos: ", err);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    }
});