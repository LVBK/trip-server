PublicProfileSchema = new SimpleSchema({
    name: {
        type: String,
        optional: true
    },
    birthday: {
        type: Date,
        optional: true
    },
    gender: {
        type: String,
        allowedValues: ['male', 'female'],
        optional: true
    },
    avatar: {
        type: String,
        optional: true
    }
});
PrivateProfileSchema = new SimpleSchema({
    address: {
        type: String,
        optional: true
    },
    phoneNumber: {
        type: String,
        optional: true
    },
    idCardImage: {
        type:String,
        optional:true
    }
});
UsersSchema = new SimpleSchema({
    username: {
        type: String,
        // For accounts-password, either emails or username is required, but not both. It is OK to make this
        // optional here because the accounts-password package does its own validation.
        // Third-party login packages may not require either. Adjust this schema as necessary for your usage.
        optional: true
    },
    emails: {
        type: Array,
        // For accounts-password, either emails or username is required, but not both. It is OK to make this
        // optional here because the accounts-password package does its own validation.
        // Third-party login packages may not require either. Adjust this schema as necessary for your usage.
        optional: true
    },
    "emails.$": {
        type: Object
    },
    "emails.$.address": {
        type: String,
        regEx: SimpleSchema.RegEx.Email
    },
    "emails.$.verified": {
        type: Boolean
    },
    // Use this registered_emails field if you are using splendido:meteor-accounts-emails-field / splendido:meteor-accounts-meld
    registered_emails: {
        type: [Object],
        optional: true,
        blackbox: true
    },
    createdAt: {
        type: Date
    },
    publicProfile: {
        type: PublicProfileSchema,
        optional: true
    },
    privateProfile: {
        type: PrivateProfileSchema,
        optional: true
    },
    // Make sure this services field is in your schema if you're using any of the accounts packages
    services: {
        type: Object,
        optional: true,
        blackbox: true
    },
    // Add `roles` to your schema if you use the meteor-roles package.
    // Option 1: Object type
    // If you specify that type as Object, you must also specify the
    // `Roles.GLOBAL_GROUP` group whenever you add a user to a role.
    // Example:
    // Roles.addUsersToRoles(userId, ["admin"], Roles.GLOBAL_GROUP);
    // You can't mix and match adding with and without a group since
    // you will fail validation in some cases.
    roles: {
        type: Object,
        optional: true,
        blackbox: true
    },
    // In order to avoid an 'Exception in setInterval callback' from Meteor
    heartbeat: {
        type: Date,
        optional: true
    },
    isEmployee: {
        type: Boolean,
        optional: true
    },
    total_rate: {
        type: Number,
        defaultValue: 0,
        optional: true
    },
    total_rate_user: {
        type: Number,
        defaultValue: 0,
        optional: true
    },
    rate: {
        type: Number,
        defaultValue: 0,
        optional: true
    },
    total_comment: {
        type: Number,
        defaultValue: 0,
        optional: true
    },
    phoneVerified: {
        type: Boolean,
        defaultValue: false
    },
    identityAuthentication: {
        type: Boolean,
        defaultValue: false
    }
});

Meteor.users.attachSchema(UsersSchema);