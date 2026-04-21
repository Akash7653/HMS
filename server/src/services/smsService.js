function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

async function sendSms({ phone, body }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  const apiKeySid = process.env.TWILIO_API_KEY_SID || "";
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const fromNumber = process.env.TWILIO_FROM_NUMBER || "";

  const to = normalizePhone(phone);
  if (!to) {
    throw new Error("Invalid phone number for SMS delivery");
  }

  const username = apiKeySid || accountSid;
  const password = apiKeySecret || authToken;

  if (!accountSid || !username || !password || !fromNumber) {
    console.log("[SMS_SIMULATION]", { to, body });
    return { simulated: true };
  }

  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  const params = new URLSearchParams();
  params.append("From", fromNumber);
  params.append("To", to);
  params.append("Body", body);

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SMS sending failed: ${text}`);
  }

  const data = await response.json();
  return { simulated: false, sid: data.sid };
}

exports.sendSms = sendSms;

exports.sendSmsOtp = async ({ phone, otp, reason = "verification" }) => {
  const body = `Horizon-Hotels OTP for ${reason}: ${otp}. Valid for 10 minutes.`;
  return sendSms({ phone, body });
};

