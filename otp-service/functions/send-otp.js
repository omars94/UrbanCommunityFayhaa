exports.handler = async function(context, event, callback) {
  const client = require('twilio')(context.ACCOUNT_SID, context.AUTH_TOKEN);

  try {
    const verification = await client.verify.v2
      .services(context.VERIFY_SERVICE_SID)
      .verifications
      .create({ to: event.phone, channel: 'sms' });

    return callback(null, { status: verification.status });
  } catch (error) {
    return callback(error);
  }
};
