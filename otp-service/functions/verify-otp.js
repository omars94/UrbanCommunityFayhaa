exports.handler = async function(context, event, callback) {
  const client = require('twilio')(context.ACCOUNT_SID, context.AUTH_TOKEN);

  try {
    const check = await client.verify.v2
      .services(context.VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: event.phone, code: event.code });

    if (check.status === 'approved') {
      return callback(null, { success: true });
    } else {
      return callback(null, { success: false });
    }
  } catch (error) {
    return callback(error);
  }
};

//    [public] https://otp-service-3402-dev.twil.io/send-otp
//    [public] https://otp-service-3402-dev.twil.io/verify-otp