import nodemailer from "nodemailer";

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email sending options interface
interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;

  private constructor() {
    this.initializeTransporter();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private initializeTransporter(): void {
    // Gmail-specific configuration with better settings
    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true", // false for 587, true for 465
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASSWORD || "", // Gmail app password
      },
    };

    // Validate email configuration
    if (!config.auth.user || !config.auth.pass) {
      console.error(
        "❌ Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables."
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        ...config,
        // Gmail-specific options
        service: "gmail",
        tls: {
          rejectUnauthorized: false,
        },
      });
    } catch {
      // Silent fail
    }
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      const mailOptions = {
        from: `"Daily Flow Reminders" <${process.env.EMAIL_USER}>`, // From your host email
        to: options.to, // To user's registered email
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: process.env.EMAIL_USER, // Reply goes back to your host email
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  public async sendTaskReminder(
    userEmail: string,
    userName: string,
    taskTitle: string,
    taskDescription: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Use the same timezone as the client (Bangladesh timezone UTC+6)
    const timeZone = "Asia/Dhaka";

    const formattedStartTime = startDate.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timeZone,
    });

    const formattedEndTime = endDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timeZone,
    });

    const subject = `⏰ Task Reminder: ${taskTitle}`;

    const html = this.generateReminderEmailHTML(
      userName,
      taskTitle,
      taskDescription,
      formattedStartTime,
      formattedEndTime
    );

    const text = `
Hello ${userName},

This is a reminder about your upcoming task:

Task: ${taskTitle}
Description: ${taskDescription}
Start Time: ${formattedStartTime}
End Time: ${formattedEndTime}

Don't forget to complete your task on time!

Best regards,
Daily Flow Team
    `.trim();

    return await this.sendEmail({
      to: userEmail,
      subject,
      html,
      text,
    });
  }

  private generateReminderEmailHTML(
    userName: string,
    taskTitle: string,
    taskDescription: string,
    formattedStartTime: string,
    formattedEndTime: string
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Reminder</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; margin-bottom: 20px; }
        .task-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .task-title { font-size: 20px; font-weight: 600; color: #1e40af; margin-bottom: 10px; }
        .task-description { color: #64748b; margin-bottom: 15px; }
        .time-info { display: flex; flex-wrap: wrap; gap: 15px; }
        .time-item { background: white; padding: 10px 15px; border-radius: 6px; border: 1px solid #cbd5e1; }
        .time-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .time-value { font-size: 14px; font-weight: 600; color: #1e293b; }
        .cta { text-align: center; margin: 30px 0; }
        .cta-button { display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; }
        .footer { background: #f1f5f9; padding: 20px 30px; text-align: center; color: #64748b; font-size: 14px; }
        @media (max-width: 600px) {
            .time-info { flex-direction: column; }
            .time-item { margin-bottom: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Daily Flow</h1>
            <p>Task Reminder</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello ${userName}! 👋
            </div>
            
            <p>This is a friendly reminder about your upcoming task:</p>
            
            <div class="task-card">
                <div class="task-title">${taskTitle}</div>
                ${
                  taskDescription
                    ? `<div class="task-description">${taskDescription}</div>`
                    : ""
                }
                
                <div class="time-info">
                    <div class="time-item">
                        <div class="time-label">Start Time</div>
                        <div class="time-value">⏰ ${formattedStartTime}</div>
                    </div>
                    <div class="time-item">
                        <div class="time-label">End Time</div>
                        <div class="time-value">🏁 ${formattedEndTime}</div>
                    </div>
                </div>
            </div>
            
            <div class="cta">
                <a href="${
                  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
                }/dashboard" class="cta-button">
                    View in Daily Flow
                </a>
            </div>
            
            <p>Don't forget to mark your task as complete once you're done!</p>
        </div>
        
        <div class="footer">
            <p>This email was sent by Daily Flow - Your Personal Task Manager</p>
            <p>If you no longer wish to receive these reminders, you can disable them in your task settings.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  public async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
