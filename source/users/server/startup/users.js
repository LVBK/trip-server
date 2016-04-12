ServiceConfiguration.configurations.upsert(
    {service: "facebook"},
    {
        $set: {
            appId: Meteor.settings.private.facebook.appId,
            secret: Meteor.settings.private.facebook.secret
        }
    }
);
Meteor.startup(function () {
    smtp = {
        username: 'gymappserver@gmail.com',   // eg: server@gentlenode.com
        password: '123qweqaz',   // eg: 3eeP1gtizk5eziohfervU
        server: 'smtp.gmail.com',  // eg: mail.gandi.net
        port: 465
    };
    mailUrl = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;
    Accounts.emailTemplates.from = "Gym Social Network<gymappserver@gmail.com>";

    Accounts.urls.resetPassword = function (token) {
        return token;
    };
    Accounts.emailTemplates.resetPassword.subject = function (user) {
        return "Lấy lại mật khẩu của bạn tại Gym Social Network"
    };
    Accounts.emailTemplates.resetPassword.text = function (user, token) {
        var url;
        if (userIsInAdminLoginRole(user._id)) {
            url = 'http://admin.gymapp.dev.ows.vn/#/reset-password/' + token;
        } else
            url = 'http://app.gymapp.dev.ows.vn/#/reset-password/' + token;
        return "Chào bạn\n"
            + "Bạn có thể đổi lại mật khẩu bằng cách nhấp vào liên kết dưới đây. Liên kết này chỉ có hiệu lực trong vòng 48 tiếng.\n\n"
            + "Xác nhận đổi mật khẩu:\n" + url
            + "\n\nThân mến,\nGym Social Network.";
    };
    Accounts.urls.enrollAccount = function (token) {
        return token;
    };
    Accounts.emailTemplates.enrollAccount.subject = function (user) {
        return "Vui lòng xác nhận email của bạn tại Gym Soscial Network"
    };
    Accounts.emailTemplates.enrollAccount.text = function (user, token) {
        var url;
        if (userIsInAdminLoginRole(user._id)) {
            url = 'http://admin.gymapp.dev.ows.vn/#/enroll-account/' + token;
        } else
            url = 'http://app.gymapp.dev.ows.vn/#/enroll-account/' + token;
        return "Chúc mừng bạn " + user.emails[0].address + " đã tham gia vào Gym Social Network.\n"
            + "Để có thể chính thức gia nhập thành viên của Gym Social Network, bạn vui lòng xác nhận email của mình bằng cách nhấp vào liên kết dưới đây.\n\n"
            + "Xác nhận địa chỉ email:\n " + url
            + "\n\nThân mến,\nGym Social Network.";
    };
    if (Meteor.users.find({'emails.address': Meteor.settings.private.admin.email}).count() == 0) {
        var adminEmail = Meteor.settings.private.admin.email;
        var adminPass = Meteor.settings.private.admin.password;
        var adminId = Accounts.createUser({
            email: adminEmail,
            password: adminPass
        });
        Roles.addUsersToRoles(adminId, Meteor.settings.public.ADMIN_ROLE, Roles.GLOBAL_GROUP);
        Meteor.users.update(
            {_id: adminId},
            {$set: {'isEmployee': true}}
        );
    }
});

