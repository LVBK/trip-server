Feedbacks.after.insert(function (userId, doc) {
    try {
        Meteor.users.update(
            {_id: doc.to},
            {
                $inc: {
                    total_rate_user: 1,
                    total_rate: doc.rate
                }
            }
        )
    } catch (err) {
        console.log("After insert Feedbacks", err);
    }
});
Feedbacks.after.remove(function (userId, doc) {
    try {
        Meteor.users.update(
            {_id: doc.to},
            {
                $inc: {
                    total_rate_user: -1,
                    total_rate: -doc.rate
                }
            }
        )
    } catch (err) {
        console.log("After remove Feedbacks", err);
    }
});

