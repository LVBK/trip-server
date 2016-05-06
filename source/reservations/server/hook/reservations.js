Reservations.after.insert(function (userId, doc) {
    try {
        Notifications.insert({
            userId: doc.to,
            senderId: doc.userId,
            actionType: Meteor.settings.actionTypes[0].type,
            notificationType: Meteor.settings.notificationTypes[0].type,
            state: "menu.reservationDetail",
            params: {
                reservationId: doc._id
            }
        });
    } catch (err) {
        console.log("Reservations after insert", err);
    }
});
Reservations.after.update(function (userId, doc, fieldNames, modifier, options) {
    try {
        if (modifier.$set && modifier.$set.hasOwnProperty('bookState')) {
            if (modifier.$set.bookState == "denied") {
                Notifications.insert({
                    userId: doc.userId,
                    senderId: doc.to,
                    actionType: Meteor.settings.actionTypes[2].type,
                    notificationType: Meteor.settings.notificationTypes[1].type,
                    state: "menu.myReservationDetail",
                    params: {
                        reservationId: doc._id
                    }
                });
            } else if (modifier.$set.bookState == "accepted") {
                Notifications.insert({
                    userId: doc.userId,
                    senderId: doc.to,
                    actionType: Meteor.settings.actionTypes[1].type,
                    notificationType: Meteor.settings.notificationTypes[1].type,
                    state: "menu.myReservationDetail",
                    params: {
                        reservationId: doc._id
                    }
                });
            }
        }
    } catch (err) {
        console.log("Reservations after update", err);
    }
});
Reservations.after.update(function (userId, doc, fieldNames, modifier, options) {
    try {
        if (modifier.$set && modifier.$set.hasOwnProperty('bookState')) {
            if (modifier.$set.bookState == "accepted") {
                var startCheckInAble, endCheckInAble;
                var trip = Trips.findOne({$and:[{_id: doc.tripId}, {isDeleted: false}]});
                if(trip){
                    startCheckInAble = new Date(trip.startAt.getTime());
                    endCheckInAble = new Date(startCheckInAble.getTime());
                    endCheckInAble.setMinutes(endCheckInAble.getMinutes() + trip.flexibleTime);
                    var checkInRecord = {
                        userId: doc.userId,
                        tripId: doc.tripId,
                        startCheckInAble: startCheckInAble,
                        endCheckInAble: endCheckInAble
                    };
                    Checkins.insert(checkInRecord);
                }
            }
        }
    } catch (err) {
        console.log("Reservations after update", err.reason);
    }
});