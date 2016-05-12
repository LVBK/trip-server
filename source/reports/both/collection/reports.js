Reports = new Meteor.Collection("reports");
ReportsSchema = new SimpleSchema({
    userId:
    {
        type:String
    },
    reportUserId:
    {
        type:String
    },
    reportType: {
        type: String,
        allowedValues: ['scam', 'corrupt', 'impolite', 'late']
    },
    reason: {
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
    },
});

Reports.attachSchema(ReportsSchema);