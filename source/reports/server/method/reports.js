Meteor.methods({
    report: function (reportUserId, reportType, detailReason) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            var self = this;
            checkLogin(self.userId);
            var reportRecord = {
                userId: self.userId,
                reportUserId: reportUserId,
                reportType: reportType,
                reason: detailReason
            };
            check(reportRecord, ReportsSchema);
            if (reportUserId == self.userId) {
                throw new Meteor.Error(408, "You can not report yourself!");
            }
            var reportUser = Meteor.users.findOne({
                $and: [
                    {_id: reportUserId},
                    {isDeleted: false}
                ]
            });
            if(!reportUser){
                throw new Meteor.Error(409, "Not found user for report!");
            }
            Reports.insert(reportRecord,
                function (err, result) {
                    if (err) {
                        myFuture.throw(err);
                        return myFuture.wait();
                    } else {
                        myFuture.return("Report successful!");
                    }
                }
            )
            ;
        } catch (err) {
            console.log("report: ", err);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    }
});