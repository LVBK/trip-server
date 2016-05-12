Sos = new Meteor.Collection("sos");
SosSchema = new SimpleSchema({
    userId: {
        type: String
    },
    tripId: {
        type: String
    },
    createdAt: {
        type: Date,
        autoValue: function () {
            if (this.isInsert) {
                return new Date();
            }
        }
    },
    sosLocation: {
        type: LocationSchema,
        optional: true
    }
});

Sos.attachSchema(SosSchema);