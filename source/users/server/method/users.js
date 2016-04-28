updateUserAsync = function (_id, modifier, callback) {
    try {
        Meteor.users.update(
            {'_id': _id},
            {
                $set: {
                    'publicProfile.name': modifier.publicProfile.name,
                    'publicProfile.gender': modifier.publicProfile.gender,
                    'publicProfile.birthday': modifier.publicProfile.birthday,
                    'privateProfile.phoneNumber': modifier.privateProfile.phoneNumber,
                    'privateProfile.address': modifier.privateProfile.address
                }
            },
            function (err, result) {
                if (err)
                    callback(err);
                else {
                    callback(false, result);
                }
            }
        );
    } catch (err) {
        console.log("updateUserAsync", err);
        callback(err);
    }
};
$FB = function () {
    if (Meteor.isClient) {
        throw new Meteor.Error(500, "Cannot run on client.");
    }

    var args = Array.prototype.slice.call(arguments);
    if (args.length === 0) {
        return;
    }
    var path = args[0];
    var i = 1;
    // Concatenate strings together in args
    while (_.isString(args[i])) {
        path = path + "/" + args[i];
        i++;
    }

    if (_.isUndefined(path)) {
        throw new Meteor.Error(500, 'No Facebook API path provided.');
    }
    var FB = Meteor.npmRequire('fb');

    var fbResponse = Meteor.sync(function (done) {
        FB.napi.apply(FB, [path].concat(args.splice(i)).concat([done]));
    });

    if (fbResponse.error !== null) {
        console.error(fbResponse.error.stack);
        throw new Meteor.Error(500, "Facebook API error.", {error: fbResponse.error, request: args});
    }

    return fbResponse.result;
};
Accounts.registerLoginHandler("facebook-login", function (loginRequest) {
    try {
        var serviceData, accessToken;
        if (!loginRequest.facebook) {
            return undefined;
        }
        accessToken = loginRequest.accessToken;
        var FB = Meteor.npmRequire('fb');
        try {
            var tokenInfo = $FB('debug_token', {
                input_token: accessToken,
                access_token: Meteor.settings.private.facebook.appId + '|' + Meteor.settings.private.facebook.secret
            });
        } catch (e) {
            console.log(e);
            throw new Meteor.Error(500, 'Facebook login failed. An API error occurred.');
        }

        if (!tokenInfo.data.is_valid) {
            throw new Meteor.Error(503, 'This access token is not valid.');
        }

        if (tokenInfo.data.app_id !== Meteor.settings.private.facebook.appId) {
            throw new Meteor.Error(503, 'This token is not for this app.');
        }
        var result = Meteor.http.get("https://graph.facebook.com/me", {
            params: {
                access_token: accessToken,
                fields: ['email', 'name', 'gender']
            }
        });
        if (!result.data.email) {
            throw new Meteor.Error(503, 'Invalid email');
        }
        serviceData = {
            id: result.data.id,
            accessToken: accessToken,
            email: result.data.email,
            name: result.data.name,
            gender: result.data.gender,
            avatar: "http://graph.facebook.com/" + result.data.id + "/picture?type=large"
        };
        return Accounts.updateOrCreateUserFromExternalService("facebook", serviceData, {});
    } catch (err) {
        console.log("facebook-login", err);
        throw new Meteor.Error(500, err.reason);
    }
});
Accounts.onCreateUser(function (options, user) {
    try {
        var referral_code, referral_code_exist;
        if (options.roles) {
            delete options.roles;
        }
        if (user.services) {
            var service = _.keys(user.services)[0];
            if (service === "password" || service === "facebook") {
                check(options.publicProfile, Match.Optional(PublicProfileSchema));
                user.publicProfile = options.publicProfile || {};
                check(options.privateProfile, Match.Optional(PrivateProfileSchema));
                user.privateProfile = options.privateProfile || {};
            }

            var email = user.services[service].email;
            if (!email)
                return user;

            // see if any existing user has this email address, otherwise create new
            var existingUser = Meteor.users.findOne({'emails.address': email});
            if (!existingUser) {
                user.emails = [];
                user.emails.push({address: email, verified: true});
                user.publicProfile.name = user.services[service].name;
                user.publicProfile.avatar = user.services[service].avatar;
                user.publicProfile.gender = user.services[service].gender;
                return user;
            }
            // precaution, these will exist from accounts-password if used
            if (!existingUser.services)
                existingUser.services = {resume: {loginTokens: []}};
            if (!existingUser.services.resume)
                existingUser.services.resume = {loginTokens: []};

            // copy across new service info
            existingUser.services[service] = user.services[service];
            if (user.services.resume) {
                existingUser.services.resume.loginTokens.push(
                    user.services.resume.loginTokens[0]
                );
            }
            // even worse hackery
            Meteor.users.remove({_id: existingUser._id}); // remove existing record
            return existingUser;                          // record is re-inserted
        }
    } catch (err) {
        console.log("Accounts.onCreateUser", err);
        throw new Meteor.Error(500, err.reason);
    }

});
Accounts.validateLoginAttempt(function (object) {
    //TODO handling 2 clients
    if (!object.error && object.user) {
        //var user = object.user;
        //if (user.status.online) throw new Meteor.Error(406, "Account is logging in");
        return true;
    }
    else return true;
});
Meteor.methods({
    deleteEmployee: function (_id) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(_id.String);
            if (!this.userId) {
                throw new Meteor.Error(406, "Login first");
            }
            if (!userIsInAdminRole(this.userId)) {
                throw new Meteor.Error(405, "permission denied");
            }
            Meteor.users.remove(
                {'_id': _id},
                function (err, result) {
                    if (err) {
                        myFuture.throw(err);
                        return myFuture.wait();
                    }
                    myFuture.return(result);
                }
            );
        } catch (err) {
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
    insertEmployee: function (employee) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(employee, Match.ObjectIncluding({
                email: String,
                username: Match.Optional(String),
                password: String,
                retype_password: String,
                publicProfile: Match.Optional(PublicProfileSchema),
                privateProfile: Match.Optional(PrivateProfileSchema),
                role: Match.Optional(String)
            }));
            if (!this.userId) {
                throw new Meteor.Error(406, "Login first");
            }
            if (!userIsInAdminRole(this.userId)) {
                throw new Meteor.Error(405, "permission denied");
            }
            var checkRoleInListSync = Meteor.wrapAsync(checkRoleInList);
            var result = checkRoleInListSync(employee.role);
            //After role valid
            var emailAlreadyExist = Meteor.users.find({"emails.address": employee.email}, {limit: 1}).count() > 0;
            if (emailAlreadyExist == true) {
                throw new Meteor.Error(403, "email already registered")
            } else {
                if (employee.password || employee.retype_password) {
                    if (employee.password != employee.retype_password) {
                        throw new Meteor.Error(408, "Password not match");
                    }
                }
                var employeeId = Accounts.createUser({
                    email: employee.email,
                    username: employee.username,
                    password: employee.password,
                    publicProfile: employee.publicProfile,
                    privateProfile: employee.privateProfile
                });
                Roles.addUsersToRoles(employeeId, employee.role, Roles.GLOBAL_GROUP);
                Meteor.users.update({_id: employeeId},
                    {
                        $set: {'isEmployee': true}
                    }
                );
                myFuture.return(employeeId);
            }
        } catch (err) {
            console.log("insertEmployee", err);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
    updateEmployee: function (modifier, _id) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(_id, String);
            check(modifier, Match.ObjectIncluding({
                role: Match.Optional(String),
                password: Match.Optional(String),
                retype_password: Match.Optional(String),
                publicProfile: Match.Optional(PublicProfileSchema),
                privateProfile: Match.Optional(PrivateProfileSchema),
            }));
            if (!this.userId) {
                throw new Meteor.Error(406, "Login first");
            }
            if (!userIsInAdminRole(this.userId)) {
                throw new Meteor.Error(405, "permission denied");
            }
            if (modifier.role) {
                var checkRoleInListSync = Meteor.wrapAsync(checkRoleInList);
                var result = checkRoleInListSync(modifier.role);
                //After valid role
                var oldRoles = Roles.getRolesForUser(_id, Roles.GLOBAL_GROUP);
                if (oldRoles)
                    Roles.removeUsersFromRoles(_id, oldRoles, Roles.GLOBAL_GROUP);
                Roles.addUsersToRoles(_id, modifier.role, Roles.GLOBAL_GROUP);
                delete modifier.role;
            }
            if (modifier.password || modifier.retype_password) {
                if (modifier.password != modifier.retype_password) {
                    throw new Meteor.Error(408, "Password not match");
                } else {
                    Accounts.setPassword(_id, modifier.password, [{logout: true}]);
                    delete modifier.password;
                    delete modifier.retype_password;
                }
            }
            var updateUserSync = Meteor.wrapAsync(updateUserAsync);
            var updateResult = updateUserSync(_id, modifier);
            myFuture.return(updateResult);
        } catch (err) {
            console.log("updateEmployee", err);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
    checkEmailExist: function (email) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(email, String);
            var emailAlreadyExist = Meteor.users.find({"emails.address": email}, {limit: 1}).count() > 0;
            if (emailAlreadyExist) {
                throw new Meteor.Error(406, "email already exxist");
            } else {
                myFuture.return(emailAlreadyExist);
            }
        } catch (err) {
            console.log("checkEmailExist:", err);
            throw err;
        }
        return myFuture.wait();
    },
    checkRoleLoginToAdminWebClient: function (email) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(email, String);
            var user = Meteor.users.findOne({"emails.address": email});
            if (user) {
                if (userIsInAdminLoginRole(user._id)) {
                    myFuture.return(true);
                } else {
                    throw new Meteor.Error(406, "This user have no permission for access to here");
                }
            } else {
                throw new Meteor.Error(406, "Not Found User");
            }
        } catch (err) {
            console.log("checkRoleLoginToAdminWebClient", err);
            throw err;
        }
        return myFuture.wait()
    },
    adminSetUserPassword: function (userId, newPlaintextPassword) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(userId, String);
            check(newPlaintextPassword, String);
            if (userIsInAdminRole(this.userId)) {
                Accounts.setPassword(userId, newPlaintextPassword, [{logout: true}]);
                myFuture.return(true);
            } else if (userIsInUserManagerRole(this.userId)) {
                if (userIsInAdminLoginRole(userId)) {
                    throw new Meteor.Error(405, "No permission set password this account");
                }
                else {
                    Accounts.setPassword(userId, newPlaintextPassword, [{logout: true}]);
                    myFuture.return(true);
                }
            } else {
                throw new Meteor.Error(405, "permission denied");
            }
        } catch (err) {
            console.log("adminSetUserPassword:", err);
            throw err;
        }
        return myFuture.wait();
    },
    deleteUser: function (_id) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(_id, String);
            if (!this.userId) {
                throw new Meteor.Error(406, "Login first");
            }
            if (!userIsInUserManagerRole(this.userId)) {
                throw new Meteor.Error(405, "permission denied");
            }
            Meteor.users.remove(
                {'_id': _id},
                function (err, result) {
                    if (err) {
                        myFuture.throw(err);
                        return myFuture.wait();
                    }
                    myFuture.return(result);
                }
            );
        } catch (err) {
            console.log("deleteUser", err);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
    updateUser: function (modifier, _id, fileData) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(modifier, Match.ObjectIncluding({
                password: Match.Optional(String),
                retype_password: Match.Optional(String),
                publicProfile: Match.Optional(PublicProfileSchema),
                privateProfile: Match.Optional(PrivateProfileSchema),
            }));
            check(_id.String);
            if (!this.userId) {
                throw new Meteor.Error(406, "Login first");
            }
            if (!userIsInUserManagerRole(this.userId)) {
                throw new Meteor.Error(405, "permission denied");
            }
            if (modifier.password || modifier.retype_password) {
                if (modifier.password != modifier.retype_password) {
                    throw new Meteor.Error(408, "Password not match");
                } else {
                    Accounts.setPassword(_id, modifier.password, [{logout: true}]);
                    delete modifier.password;
                    delete modifier.retype_password;
                }
            }
            if (fileData) {
                var updateUserAvatarSync = Meteor.wrapAsync(updateUserAvatarAsync);
                var avatarResult = updateUserAvatarSync(_id, fileData);
            }
            var updateUserSync = Meteor.wrapAsync(updateUserAsync);
            var updateResult = updateUserSync(_id, modifier);
            myFuture.return(updateResult);
        } catch (err) {
            console.log("Update user: ", err);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
    userChangeProfile: function (modifier) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(modifier, Match.ObjectIncluding({
                publicProfile: Match.Optional(PublicProfileSchema),
                privateProfile: Match.Optional(PrivateProfileSchema),
            }));
            if (!this.userId) {
                throw new Meteor.Error(406, "Login first");
            }
            var updateUserSync = Meteor.wrapAsync(updateUserAsync);
            var updateResult = updateUserSync(this.userId, modifier);
            myFuture.return(updateResult);
        } catch (err) {
            console.log("UserchangeProfile: ", err);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
    checkTokenExpired: function (token) {
        Future = Npm.require('fibers/future');
        var myFuture = new Future();
        try {
            check(token, String);
            var user = Meteor.users.findOne({                                                                                // 652
                "services.password.reset.token": token
            });
            if (!user)
                throw new Meteor.Error(403, "Token expired");
            else
                myFuture.return(true);
        } catch (err) {
            console.log("checkTokenExpired: ", err);
            throw new Meteor.Error(407, err.reason || err.message);
        }
        return myFuture.wait();
    },
});
