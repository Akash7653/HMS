const PDFDocument = require("pdfkit");
const { sendEmail } = require("./emailService");

function addHeader(doc, title) {
  doc
    .fontSize(28)
    .font("Helvetica-Bold")
    .text("Horizon-Hotels", 50, 50)
    .fontSize(10)
    .font("Helvetica")
    .text("Hotel Management System", 50, 85)
    .text("Your trusted booking platform", 50, 100)
    .moveTo(50, 115)
    .lineTo(550, 115)
    .stroke("#3B82F6");

  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(title, 50, 140);
}

function addInvoiceDetails(doc, payment) {
  const invoiceY = 200;

  doc.fontSize(10).font("Helvetica-Bold");

  // Left column
  doc.text("INVOICE DETAILS", 50, invoiceY);
  doc
    .fontSize(9)
    .font("Helvetica")
    .text(`Date: ${new Date(payment.createdAt).toLocaleDateString("en-IN")}`, 50, invoiceY + 20)
    .text(`Reference: ${payment.reference}`, 50, invoiceY + 35)
    .text(`Status: ${payment.status.toUpperCase()}`, 50, invoiceY + 50);

  // Right column
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("BILLING TO", 350, invoiceY);
  doc
    .fontSize(9)
    .font("Helvetica")
    .text(`${payment.userName || "Customer"}`, 350, invoiceY + 20)
    .text(`Email: ${payment.userEmail || "N/A"}`, 350, invoiceY + 35)
    .text(`Phone: ${payment.userPhone || "N/A"}`, 350, invoiceY + 50);
}

function addItemsTable(doc, payment) {
  const tableY = 320;
  const itemHeight = 25;

  // Table header
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#1E293B")
    .rect(50, tableY, 500, 25)
    .fill();

  doc
    .fillColor("white")
    .text("Description", 60, tableY + 5)
    .text("Amount", 450, tableY + 5, { align: "right" });

  // Reset color
  doc.fillColor("black");

  // Item row
  doc
    .fontSize(9)
    .font("Helvetica")
    .text(`${payment.hotelName || "Hotel Booking"}`, 60, tableY + itemHeight + 5)
    .text(`Rs. ${payment.amount.toFixed(2)}`, 450, tableY + itemHeight + 5, { align: "right" });

  // Separator line
  doc
    .moveTo(50, tableY + itemHeight * 2 - 5)
    .lineTo(550, tableY + itemHeight * 2 - 5)
    .stroke("#E2E8F0");

  // Total
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("TOTAL AMOUNT", 60, tableY + itemHeight * 2 + 15)
    .text(`Rs. ${payment.amount.toFixed(2)}`, 450, tableY + itemHeight * 2 + 15, { align: "right" });
}

function addPaymentInfo(doc, payment) {
  const infoY = 500;

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("PAYMENT INFORMATION", 50, infoY);

  doc
    .fontSize(9)
    .font("Helvetica")
    .text(`Method: ${payment.paymentMethod === "razorpay-sim" ? "Razorpay" : "Credit Card"}`, 50, infoY + 20)
    .text(`Provider: ${payment.provider}`, 50, infoY + 35)
    .text(`Currency: ${payment.currency || "INR"}`, 50, infoY + 50)
    .text(`Status: ${payment.status}`, 50, infoY + 65);

  if (payment.note) {
    doc
      .fontSize(9)
      .font("Helvetica-Italic")
      .text(`Note: ${payment.note}`, 50, infoY + 85);
  }
}

function addFooter(doc) {
  const pageHeight = doc.page.height;

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("#64748B")
    .text(
      "Thank you for booking with Horizon-Hotels. For support, contact: support@horizonhms.com",
      50,
      pageHeight - 50,
      { align: "center" }
    )
    .text("Invoice ID: " + new Date().getTime(), 50, pageHeight - 30, { align: "center" });
}

exports.generateInvoicePDF = (payment) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const title = payment.status === "refunded" ? "Refund Receipt" : "Invoice";
      addHeader(doc, title);
      addInvoiceDetails(doc, payment);
      addItemsTable(doc, payment);
      addPaymentInfo(doc, payment);
      addFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

exports.sendInvoiceEmail = async (payment, userEmail) => {
  try {
    const pdfBuffer = await exports.generateInvoicePDF(payment);
    const fileName = `${payment.status === "refunded" ? "refund" : "invoice"}-${payment.reference}.pdf`;

    await sendEmail({
      to: userEmail,
      subject: `${payment.status === "refunded" ? "Refund" : "Payment"} Receipt - Horizon-Hotels`,
      html: `
        <h2>${payment.status === "refunded" ? "Refund Processed" : "Payment Confirmed"}</h2>
        <p>Dear Customer,</p>
        <p>${
          payment.status === "refunded"
            ? `Your refund of Rs. ${payment.amount.toFixed(2)} has been processed.`
            : `Your payment of Rs. ${payment.amount.toFixed(2)} has been received successfully.`
        }</p>
        <p><strong>Reference:</strong> ${payment.reference}</p>
        <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString("en-IN")}</p>
        <p>Your invoice is attached to this email.</p>
        <p>Thank you for your business!</p>
        <p>Regards,<br>Horizon-Hotels Team</p>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return true;
  } catch (error) {
    console.error("Invoice email send failed:", error);
    // Don't throw - payment is already recorded
    return false;
  }
};

