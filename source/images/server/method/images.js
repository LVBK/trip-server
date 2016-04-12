updateUserAvatarAsync = function (userId, fileData, callback) {
    try {
        Images.insert(fileData, function (err, fileObj) {
            if (err) {
                callback(err);
            } else {
                var user = Meteor.users.findOne({_id: userId});
                Meteor.setTimeout(function () {
                    try {
                        if (user && user.publicProfile.avatar != null) {
                            Images.remove({_id: user.publicProfile.avatar})
                        }
                        Meteor.users.update(user, {$set: {'publicProfile.avatar': fileObj._id}}, function () {
                            callback(false, true);
                        });
                    } catch (err2) {
                        callback(err2);
                    }
                }, 1000);
            }
        });
    } catch (err) {
        console.log("updateUserAvatarAsync", err);
        callback(err);
    }
};
Meteor.methods({
    userUploadProfileImage: function (fileData) {
        // load Future
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            var updateUserAvatarSync = Meteor.wrapAsync(updateUserAvatarAsync);
            var result = updateUserAvatarSync(this.userId, fileData);
            myFuture.return(result);
        } catch (err) {
            console.log("userUploadProfileImage", err);
            throw new Meteor.Error(405, err.reason || err.message);
        }
        return myFuture.wait();
    }
});