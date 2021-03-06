Trips.before.update(function (userId, doc, fieldNames, modifier, options) {
    if (modifier.$set && modifier.$set.hasOwnProperty('isDeleted')) {
        if (modifier.$set.isDeleted == true) {
            Reservations.update(
                {
                    tripId: doc._id
                }, {
                    $set: {
                        'isDeleted': true
                    }
                }, {
                    multi: true
                }
            );
            CheckInTickets.update(
                {
                    tripId: doc._id
                }, {
                    $set: {
                        'isDeleted': true
                    }
                }, {
                    multi: true
                }
            )
        }
    }
});
Trips.before.update(function (userId, doc, fieldNames, modifier, options) {
    try {
        if (modifier.$set) {
            if (modifier.$set.hasOwnProperty('note') || modifier.$set.hasOwnProperty('baggageSize')
                || modifier.$set.hasOwnProperty('flexibleTime') || modifier.$set.hasOwnProperty('flexibleDistance')
                || modifier.$set.hasOwnProperty('pricePerSeat')) {
                var isChange = false;
                var sent = [doc.owner];
                _.each(modifier.$set, function (value, field) {
                    if (modifier.$set[field] !== doc[field]) {
                        isChange = true;
                    }
                });
                if (isChange) {
                    _.each(doc.slots, function (passengerId) {
                        if (sent.indexOf(passengerId) == -1) {
                            Notifications.insert({
                                userId: passengerId,
                                senderId: doc.owner,
                                actionType: Meteor.settings.actionTypes[3].type,
                                notificationType: Meteor.settings.notificationTypes[2].type,
                                state: "menu.tripDetail",
                                params: {
                                    tripId: doc._id
                                }
                            });
                            sent.push(passengerId)
                        }
                    });
                }
            }
        }
    } catch (err) {
        console.log("Trip update", err);
    }
});
Trips.after.insert(function (userId, doc) {
    try {
        var startCheckInAble, endCheckInAble;
        startCheckInAble = new Date(doc.startAt.getTime());
        endCheckInAble = new Date(startCheckInAble.getTime());
        endCheckInAble.setMinutes(endCheckInAble.getMinutes() + doc.flexibleTime);
        var checkInRecord = {
            userId: doc.owner,
            tripId: doc._id,
            startCheckInAble: startCheckInAble,
            endCheckInAble: endCheckInAble
        }
        CheckInTickets.insert(checkInRecord);
    } catch (err) {
        console.log("Trips after insert", err.reason);
    }
});

