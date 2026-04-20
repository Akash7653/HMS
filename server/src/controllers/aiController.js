const { getAiResponse } = require("../services/aiService");

exports.chat = async (req, res, next) => {
  try {
    const { message, history, context } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const result = await getAiResponse({
      message,
      history: Array.isArray(history) ? history : [],
      userContext: context || {},
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
