Checkins = new Meteor.Collection("checkins");
CheckinsSchema = new SimpleSchema({
    userId: {
        type: String
    },
    tripId: {
        type: String
    },
    state: {
        type: String,
        allowedValues: ['coming', 'checkInAble', 'checkedIn', 'checkedOut', 'expired'],
        autoValue: function () {
            if (this.isInsert) {
                return 'coming';
            }
        },
    },
    checkOutPassword: {
        type: String,
        optional: true,
        custom: function () {
            if (this.field('state').value == 'checkedIn') {
                // updates
                if (this.isSet) {
                    if (this.operator === "$set" && this.value === null) return "required";
                }
            }
        }
    },
    checkOutLimitTime: {
        type: Date,
        optional: true,
        custom: function () {
            if (this.field('state').value == 'checkedIn') {
                // updates
                if (this.isSet) {
                    if (this.operator === "$set" && this.value === null) return "required";
                }
            }
        }
    },
    startCheckInAble: {
        type: Date
    },
    endCheckInAble: {
        type: Date,
        custom: function () {
            if (this.field('startCheckInAble').value > this.value) {
                return 'endCheckInAbleShouldL'
            }
        }
    },
    isDeleted: {
        type: Boolean,
        optional: true,
        defaultValue: false
    },
});

Checkins.attachSchema(CheckinsSchema);
CheckinsSchema.messages = {
    endCheckInAbleShouldLater: 'endCheckInAble field should have value later or same time than startCheckInAble',
};