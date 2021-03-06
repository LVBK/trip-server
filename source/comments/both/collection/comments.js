Comments = new Meteor.Collection("comments");
CommentsSchema = new SimpleSchema({
    from: {
        type: String
    },
    to: {
        type: String
    },
    tripId: {
        type: String,
        index: 1,
    },
    content: {
        type: String,
        optional: true
    },
    createdAt: {
        type: Date,
        autoValue: function () {
            if (this.isInsert) {
                return new Date();
            }
        }
    },
    isDeleted: {
        type: Boolean,
        optional: true,
        defaultValue: false
    }
});

Comments.attachSchema(CommentsSchema);