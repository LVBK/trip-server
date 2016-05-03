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
            )
        }
    }
});