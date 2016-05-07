Meteor.methods({
    updateCheckInTicketState: function () {
        try {
            var interval = new Meteor.setInterval(function () {
                var now = new Date();
                now.setSeconds(0, 0);
                var afterTwoMinutes = new Date(now.getTime());
                afterTwoMinutes.setMinutes(afterTwoMinutes.getMinutes() + 2);
                var checkInAbleTickets = CheckInTickets.find(
                    {
                        $and: [
                            {state: 'coming'},
                            {startCheckInAble: {$lte: now}},
                            {endCheckInAble: {$gte: now}},
                            {isDeleted: false}
                        ]
                    }
                );
                checkInAbleTickets.forEach(function (ticket) {
                    CheckInTickets.update(
                        ticket,
                        {
                            $set: {
                                state: "checkInAble"
                            }
                        }
                    )
                });
                var expiredTickets = CheckInTickets.find(
                    {
                        $and: [
                            {$or: [{state: 'coming'}, {state: 'checkInAble'}]},
                            {endCheckInAble: {$lt: now}},
                            {isDeleted: false}
                        ]
                    }
                );
                expiredTickets.forEach(function (ticket) {
                    CheckInTickets.update(
                        ticket,
                        {
                            $set: {
                                state: "expired"
                            }
                        }
                    )
                });
                var shouldCheckoutTickets = CheckInTickets.find(
                    {
                        $and: [
                            {state: 'checkedIn'},
                            {checkOutLimitTime: {$lt: afterTwoMinutes, $gte: now}},
                            {isDeleted: false}
                        ]
                    }
                );
                shouldCheckoutTickets.forEach(function(ticket){
                    Notifications.insert({
                        userId: ticket.userId,
                        actionType: Meteor.settings.actionTypes[6].type,
                        notificationType: Meteor.settings.notificationTypes[4].type,
                        state: "menu.checkInTicket",
                        params: {
                            checkInTicketId: ticket._id
                        }
                    });
                });
                var sosTickets = CheckInTickets.find(
                    {
                        $and: [
                            {state: 'checkedIn'},
                            {checkOutLimitTime: {$lt: now}},
                            {isDeleted: false}
                        ]
                    }
                );
                sosTickets.forEach(function (ticket) {
                    //TODO: create SOS report.
                });
            }, 1000 * 60);
        } catch (err) {
            console.log("updateCheckInTicketState", err.reason);
        }
    },
    checkIn: function (checkInTicketId, checkOutPassword, checkOutLimitMinute, checkInLocation) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            var self = this;
            checkLogin(self.userId);
            check(checkInTicketId, String);
            check(checkOutPassword, String);
            check(checkOutLimitMinute, Number);
            check(checkInLocation, Match.Optional(LocationSchema));
            if (checkOutLimitMinute <= 0) {
                throw new Meteor.Error(406, "checkOutLimitMinute must larger than 0");
            }
            var now = new Date();
            now.setSeconds(0,0);
            var checkOutLimitTime = new Date(now.getTime());
            checkOutLimitTime.setMinutes(checkOutLimitTime.getMinutes() + checkOutLimitMinute);
            var ticket = CheckInTickets.findOne({$and: [{_id: checkInTicketId}, {isDeleted: false}]});
            if (!ticket) {
                throw new Meteor.Error(407, 'Not found checkin ticket');
            }
            if (ticket.userId !== self.userId) {
                throw new Meteor.Error(407, 'You have no permission to use this checkin ticket');
            }
            if (ticket.state !== 'checkInAble' && ticket.state !== 'expired') {
                throw new Meteor.Error(408, 'C This checkin ticket is in ' + ticket.state + ' state! Can not checkin!');
            }
            //update if current
            CheckInTickets.update({
                $and: [
                    {_id: ticket._id},
                    {state: ticket.state}
                ]
            }, {
                $set: {
                    state: 'checkedIn',
                    checkOutPassword: checkOutPassword,
                    checkOutLimitTime: checkOutLimitTime,
                    checkedInAt: now,
                    checkedInLocation: checkInLocation
                }
            }, function (err, result) {
                if (err) {
                    myFuture.throw(err);
                } else {
                    if (result == 0) {
                        myFuture.throw(new Meteor.Error(410, "Checkin failed!"));
                    } else {
                        myFuture.return("Check in successful!");
                    }
                }
            });
        } catch (err) {
            console.log("checkIn: ", err.reason);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
    checkOut: function (checkInTicketId, checkOutPassword, checkOutLocation) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            var self = this;
            checkLogin(self.userId);
            check(checkInTicketId, String);
            check(checkOutPassword, String);
            console.log(checkOutLocation);
            check(checkOutLocation, Match.Optional(LocationSchema));
            var ticket = CheckInTickets.findOne({$and: [{_id: checkInTicketId}, {isDeleted: false}]});
            if (!ticket) {
                throw new Meteor.Error(407, 'Not found checkin ticket');
            }
            if (ticket.userId !== self.userId) {
                throw new Meteor.Error(408, 'You have no permission to use this checkin ticket');
            }
            if (ticket.state !== 'checkedIn') {
                throw new Meteor.Error(409, 'C This checkin ticket is in ' + ticket.state + ' state! Can not checkin!');
            }
            var checkOutPasswordReverse = checkOutPassword.split('').reverse().join('');
            if (ticket.checkOutPassword !== checkOutPassword && ticket.checkOutPassword !== checkOutPasswordReverse) {
                throw new Meteor.Error(410, 'Incorrect checkout password');
            }
            if (ticket.checkOutPassword == checkOutPasswordReverse) {
                //TODO: create SOS report with checkOutLocation
            }
            //update if current
            console.log(checkOutLocation);
            CheckInTickets.update({
                $and: [
                    {_id: ticket._id},
                    {state: ticket.state}
                ]
            }, {
                $set: {
                    state: 'checkedOut',
                    checkedOutAt: new Date(),
                    checkedOutLocation: checkOutLocation
                }
            }, function (err, result) {
                if (err) {
                    myFuture.throw(err);
                } else {
                    if (result == 0) {
                        myFuture.throw(new Meteor.Error(410, "Checkout failed!"));
                    } else {
                        myFuture.return("Checkout successful!");
                    }
                }
            });
        } catch (err) {
            console.log("checkOut: ", err);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    }
});