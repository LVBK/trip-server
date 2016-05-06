Meteor.methods({
    updateCheckinState: function () {
        try {
            var interval = new Meteor.setInterval(function () {
                var now = new Date();
                now.setSeconds(0, 0);
                var afterTwoMinutes = new Date(now.getTime());
                afterTwoMinutes.setMinutes(afterTwoMinutes.getMinutes() + 2);
                var checkInAbles = Checkins.find(
                    {
                        $and: [
                            {state: 'coming'},
                            {startCheckInAble: {$lte: now}},
                            {endCheckInAble: {$gte: now}}
                        ]
                    }
                );
                checkInAbles.forEach(function (checkin) {
                    Checkins.update(
                        checkin,
                        {
                            $set: {
                                state: "checkInAble"
                            }
                        }
                    )
                });
                var expireds = Checkins.find(
                    {
                        $and: [
                            {$or: [{state: 'coming'}, {state: 'checkInAble'}]},
                            {endCheckInAble: {$lt: now}}
                        ]
                    }
                );
                expireds.forEach(function (checkin) {
                    Checkins.update(
                        checkin,
                        {
                            $set: {
                                state: "expired"
                            }
                        }
                    )
                });
                var shouldCheckoutTickets = Checkins.find(
                    {
                        $and: [
                            {state: 'checkedIn'},
                            {checkOutLimitTime: {$lt: afterTwoMinutes, $gte: now}}
                        ]
                    }
                );
                shouldCheckoutTickets.forEach(function(ticket){
                    Notifications.insert({
                        userId: ticket.userId,
                        actionType: Meteor.settings.actionTypes[6].type,
                        notificationType: Meteor.settings.notificationTypes[4].type,
                        state: "menu.checkIn",
                        params: {
                            checkInId: ticket._id
                        }
                    });
                });
                var sosTickets = Checkins.find(
                    {
                        $and: [
                            {state: 'checkedIn'},
                            {checkOutLimitTime: {$lt: now}}
                        ]
                    }
                );
                sosTickets.forEach(function (ticket) {
                    //TODO: create SOS report.
                });
            }, 1000 * 60);
        } catch (err) {
            console.log("updateCheckinState", err.reason);
        }
    },
    checkIn: function (checkInId, checkOutPassword, checkOutLimitMinute, checkInLocation) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            var self = this;
            checkLogin(self.userId);
            check(checkInId, String);
            check(checkOutPassword, String);
            check(checkOutLimitMinute, Number);
            if (checkOutLimitMinute <= 0) {
                throw new Meteor.Error(406, "checkOutLimitMinute must larger than 0");
            }
            var now = new Date();
            var checkOutLimitTime = new Date(now.getTime());
            checkOutLimitTime.setMinutes(checkOutLimitTime.getMinutes + checkOutLimitMinute);
            var checkin = Checkins.findOne({$and: [{_id: checkInId}, {isDeleted: false}]});
            if (!checkin) {
                throw new Meteor.Error(407, 'Not found checkin ticket');
            }
            if (checkin.userId !== self.userId) {
                throw new Meteor.Error(407, 'You have no permission to use this checkin ticket');
            }
            if (checkin.state !== 'checkInAble' && checkin.state !== 'expired') {
                throw new Meteor.Error(408, 'C This checkin ticket is in ' + checkin.state + ' state! Can not checkin!');
            }
            //update if current
            Checkins.update({
                $and: [
                    {_id: checkin._id},
                    {state: checkin.state}
                ]
            }, {
                $set: {
                    state: 'checkedIn',
                    checkOutPassword: checkOutPassword,
                    checkOutLimitTime: checkOutLimitTime
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
    checkOut: function (checkInId, checkOutPassword, checkOutLocation) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            var self = this;
            checkLogin(self.userId);
            check(checkInId, String);
            check(checkOutPassword, String);
            var checkin = Checkins.findOne({$and: [{_id: checkInId}, {isDeleted: false}]});
            if (!checkin) {
                throw new Meteor.Error(407, 'Not found checkin ticket');
            }
            if (checkin.userId !== self.userId) {
                throw new Meteor.Error(408, 'You have no permission to use this checkin ticket');
            }
            if (checkin.state !== 'checkedIn') {
                throw new Meteor.Error(409, 'C This checkin ticket is in ' + checkin.state + ' state! Can not checkin!');
            }
            var checkOutPasswordReverse = checkOutPassword.split('').reverse().join('');
            console.log("Reverse", checkOutPasswordReverse);
            if (checkin.checkOutPassword !== checkOutPassword && checkin.checkOutPassword !== checkOutPasswordReverse) {
                throw new Meteor.Error(410, 'Incorrect checkout password');
            }
            if (checkin.checkOutPassword == checkOutPasswordReverse) {
                //TODO: create SOS report with checkOutLocation
            }
            //update if current
            Checkins.update({
                $and: [
                    {_id: checkin._id},
                    {state: checkin.state}
                ]
            }, {
                $set: {
                    state: 'checkedOut',
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
            console.log("checkOut: ", err.reason);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    }
});