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