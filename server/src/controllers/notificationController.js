exports.getNotifications = async (_req, res) => {
  const notifications = [
    { id: 1, type: "info", title: "Welcome", message: "Email notifications are simulated in dev mode." },
    { id: 2, type: "success", title: "Tip", message: "Enable SMTP credentials in .env for real email dispatch." },
  ];

  res.json({ data: notifications });
};
