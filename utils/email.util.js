

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "itnanda1987@gmail.com",
    pass: "jdlt yozr luhj qqzo",
  },
});

/**
 * Send bulk emails with template variables
 * @param {Array} recipients - Array of recipient objects
 * @param {String} subject - Email subject
 * @param {String} template - HTML template string
 * @param {Array} variables - Array of variable names to replace in template
 */
export const sendBulkEmails = async (
  recipientEmail,
  emailSubject,
  emailBody,
  variables
) => {
  console.log("Recipient Email is: ", recipientEmail);
  try {
    const results = await Promise.all(
      recipientEmail.map(async (recipient) => {
        let customizedTemplate = emailBody;

        // Replace variables in template
        variables.forEach((varName) => {
          const regex = new RegExp(`{{${varName}}}`, "g");
          customizedTemplate = customizedTemplate.replace(
            regex,
            recipient[varName] || ""
          );
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: recipient.email,
          subject: emailSubject,
          html: customizedTemplate,
        };

        return await transporter.sendMail(mailOptions);
      })
    );

    console.log(`📧 Successfully sent ${results.length} emails`);
    return results;
  } catch (error) {
    console.error("❌ Bulk email error:", error);
    throw error;
  }
};

/**
 * Send single email notification
 */
/**
 * Send single email notification with template variable replacement
 */
export const sendSingleEmailNotification = async (options) => {
  try {
    let customizedBody = options.emailBody;

    // Replace variables in template if variables are provided
    if (options.variables) {
      Object.keys(options.variables).forEach((varName) => {
        console.log("VarName:", varName);
        console.log("Variable:", options.variables["calculatedValue"]);

        const regex = new RegExp(`{{${varName}}}`, "g");
        customizedBody = customizedBody.replace(
          regex,
          options.variables[varName] || ""
        );
        console.log("Customized Body is: ", customizedBody);
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || "itnanda1987@gmail.com",
      to: options.recipientEmail,
      subject: options.emailSubject,
      html: customizedBody,
      text: options.sendAsHTML ? undefined : customizedBody,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
    // return null;
  } catch (error) {
    console.error("❌ Email send error:", error);
    throw error;
  }
};

// Send email verification link
export const sendVerificationEmail = async (email, emailHTML) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification",
      html: emailHTML,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully:", result.messageId);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error;
  }
};

// Controller function to send email notification
export const sendEmailNotification = async (req, res) => {
  try {
    const {
      recipientEmail,
      emailSubject,
      emailBody,
      sendAsHTML = false,
    } = req.body;

    // Validate required fields
    if (!recipientEmail || !emailSubject || !emailBody) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Configure mail options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: emailSubject,
      text: sendAsHTML ? undefined : emailBody, // Send as plain text if sendAsHTML is false
      html: sendAsHTML ? emailBody : undefined, // Send as HTML if sendAsHTML is true
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully:", result.messageId);

    // Send success response
    res.status(200).json({
      message: "Email sent successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("❌ Error sending email:", error.message);

    // Send error response
    res
      .status(500)
      .json({ message: "Failed to send email", error: error.message });
  }
};
