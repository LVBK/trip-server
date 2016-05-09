Feedbacks = new Meteor.Collection("feedbacks");
FeedbacksSchema = new SimpleSchema({
    from: {
        type: String
    },
    to: {
        type: String,
        index: 1,
    },
    tripId: {
        type: String
    },
    rate: {
        type: Number,
        allowedValues: [1, 2, 3, 4, 5]
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

Feedbacks.attachSchema(FeedbacksSchema);