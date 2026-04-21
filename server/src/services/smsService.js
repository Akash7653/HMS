function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

function shouldUseTwilio() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && (process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_API_KEY_SECRET));
}

function getProvider() {
  const configured = (process.env.SMS_PROVIDER || "").trim().toLowerCase();
  if (configured) return configured;
  if (shouldUseTwilio()) return "twilio";
  return "textbelt";
}

function isTextbeltQuotaResult(result) {
  return Boolean(result?.simulated && result?.reason === "textbelt_quota_exceeded");
}

async function sendViaTwilio({ to, body }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  const apiKeySid = process.env.TWILIO_API_KEY_SID || "";
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const fromNumber = process.env.TWILIO_FROM_NUMBER || "";

  const username = apiKeySid || accountSid;
  const password = apiKeySecret || authToken;

  if (!accountSid || !username || !password || !fromNumber) {
    return { simulated: true, reason: "twilio_not_configured" };
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

    // Twilio trial accounts can only send to verified destination numbers.
    // Fall back to simulation so signup flow continues in demo environments.
    if (text.includes("21608") || text.toLowerCase().includes("unverified")) {
      console.log("[SMS_TRIAL_RESTRICTION]", { to, body });
      return {
        simulated: true,
        reason: "trial_unverified_destination",
      };
    }

    throw new Error(`SMS sending failed: ${text}`);
  }

  const data = await response.json();
  return { simulated: false, provider: "twilio", sid: data.sid };
}

async function sendViaTextbelt({ to, body }) {
  const key = process.env.TEXTBELT_KEY || "textbelt";

  const response = await fetch("https://textbelt.com/text", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone: to,
      message: body,
      key,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    const message = data.error || `textbelt_http_${response.status}`;

    // Free keys can hit strict limits quickly. Keep app flow alive for OTP and notifications.
    if (String(message).toLowerCase().includes("quota") || String(message).toLowerCase().includes("limit")) {
      return { simulated: true, reason: "textbelt_quota_exceeded" };
    }

    throw new Error(`SMS sending failed: ${message}`);
  }

  return { simulated: false, provider: "textbelt", sid: data.textId || "" };
}

async function sendSms({ phone, body }) {
  const to = normalizePhone(phone);
  if (!to) {
    throw new Error("Invalid phone number for SMS delivery");
  }

  const provider = getProvider();

  try {
    if (provider === "twilio") {
      return await sendViaTwilio({ to, body });
    }
    if (provider === "textbelt") {
      return await sendViaTextbelt({ to, body });
    }
    if (provider === "hybrid") {
      const textbeltResult = await sendViaTextbelt({ to, body });

      if (isTextbeltQuotaResult(textbeltResult) && shouldUseTwilio()) {
        const twilioResult = await sendViaTwilio({ to, body });
        return {
          ...twilioResult,
          fallbackFrom: "textbelt",
        };
      }

      return textbeltResult;
    }

    console.log("[SMS_SIMULATION_UNKNOWN_PROVIDER]", { provider, to, body });
    return { simulated: true, reason: "unknown_provider" };
  } catch (error) {
    console.log("[SMS_SIMULATION_FALLBACK]", { provider, to, error: error.message });
    return { simulated: true, reason: "provider_error" };
  }
}

exports.sendSms = sendSms;

