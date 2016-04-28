Meteor.publish("employee_list", function (selector, options) {
    var self = this;
    try {
        check(selector, Match.Optional(Object));
        check(options, Match.Optional(Object));
        check(options.sort, Match.Optional(Object));
        check(options.skip, Match.Optional(Number));
        check(options.limit, Match.Optional(Number));
        selector = selector || {};
        options = options || {};
        options.limit = options.limit || 10;
        options.skip = options.skip || 0;

        if (!self.userId) {
            self.ready();
            return;
        }
        if (!userIsInAdminRole(self.userId)) {
            self.ready();
            return;
        }
        var findSelector = {
            $and: [
                {'isEmployee': true},
                selector
            ]
        }

        var findOptions = {
            skip: options.skip,
            fields: {emails: 1, publicProfile: 1, roles: 1}
        };
        if (options.limit > 0) {
            findOptions.limit = options.limit;
        }
        if (_.isArray(options.sort)) {
            findOptions.sort = options.sort;
        }
        Counts.publish(self, 'Employees', Meteor.users.find(findSelector, {fields: {_id: 1}}), {noReady: true});
        return Meteor.users.find(findSelector, findOptions);
    } catch (err) {
        console.log("employee_list", err);
        self.ready();
        return;
    }
});
Meteor.publish("user_list", function (selector, options) {
    var self = this;
    try {
        check(selector, Match.Optional(Object));
        check(options, Match.Optional(Object));
        check(options.sort, Match.Optional(Object));
        check(options.skip, Number);
        check(options.limit, Match.Optional(Number));
        check(options.skip, Match.Optional(Number));
        check(options.limit, Match.Optional(Number));
        selector = selector || {};
        options = options || {};
        options.limit = options.limit || 10;
        options.skip = options.skip || 0;

        if (!self.userId) {
            self.ready();
            return;
        }
        if (!userIsInUserManagerRole(self.userId)) {
            self.ready();
            return;
        }
        var findSelector = {
            $and: [
                {$nor: [{'isEmployee': true}]},
                selector
            ]
        }
        var findOptions = {
            skip: options.skip,
            fields: {emails: 1, publicProfile: 1}
        };
        if (options.limit > 0) {
            findOptions.limit = options.limit;
        }
        if (_.isArray(options.sort)) {
            findOptions.sort = options.sort;
        }
        Counts.publish(self, 'Users', Meteor.users.find(findSelector, {fields: {_id: 1}}), {noReady: true});
        return Meteor.users.find(findSelector, findOptions);
    } catch (err) {
        console.log(err);
        self.ready();
        return;
    }
});
Meteor.publish(null, function () {
    if (this.userId) {
        return Meteor.users.find({_id: this.userId});
    }
});
Meteor.publish("user_detail", function (userId) {
    var self = this;
    try {
        check(userId, String);
        var findOptions = {
            limit: 1,
            fields: {publicProfile: 1, rate: 1, total_rate_user: 1, total_comment: 1}
        };
        if (userIsInUserManagerRole(self.userId)) {
            findOptions = {
                limit: 1,
                fields: {emails: 1, publicProfile: 1, privateProfile: 1}
            };
        }
        return Meteor.users.find({_id: userId}, findOptions);
    } catch (err) {
        console.log(err);
        self.ready();
        return;
    }
});
