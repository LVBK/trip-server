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
    }
});

Reports.attachSchema(ReportsSchema);