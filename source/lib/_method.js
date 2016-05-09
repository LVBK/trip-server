checkLogin = function (userId) {
    if (!userId) {
        throw new Meteor.Error(406, "Login first");
    }
}