export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export interface InvoiceEmailData {
  customerName: string;
  invoiceId: number;
  description: string;
  dueDate: string;
  total: number;
  items: Array<{
    description: string;
    amount: number;
  }>;
}

export class SendGridService {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string = "") {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: { email: options.from || this.fromEmail },
          content: [
            ...(options.text ? [{ type: "text/plain", value: options.text }] : []),
            ...(options.html ? [{ type: "text/html", value: options.html }] : []),
          ],
        }),
      });

      if (response.ok) {
        console.log(`Email sent successfully to ${options.to}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`Failed to send email: ${response.status} - ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  async sendInvoiceCreatedEmail(customerEmail: string, invoiceData: InvoiceEmailData): Promise<boolean> {
    const itemsHtml = invoiceData.items
      .map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">R${item.amount.toFixed(2)}</td>
        </tr>
      `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice #${invoiceData.invoiceId}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #00486d; color: white; padding: 20px; text-align: center;">
            <h1>Capitec Invoice Tracker</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #00486d;">Invoice #${invoiceData.invoiceId} Created</h2>
            
            <p>Dear ${invoiceData.customerName},</p>
            
            <p>A new invoice has been created:</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Invoice ID:</strong> #${invoiceData.invoiceId}</p>
              <p><strong>Description:</strong> ${invoiceData.description}</p>
              <p><strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
            </div>
            
            ${invoiceData.items.length > 0 ? `
            <h3 style="color: #00486d;">Invoice Items:</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 5px;">
              <thead>
                <tr style="background-color: #00486d; color: white;">
                  <th style="padding: 10px; text-align: left;">Description</th>
                  <th style="padding: 10px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            ` : ''}
            
            <div style="background-color: #00486d; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0;">Total Amount: R${invoiceData.total.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Invoice #${invoiceData.invoiceId} Created

Dear ${invoiceData.customerName},

A new invoice has been created:

Invoice ID: #${invoiceData.invoiceId}
Description: ${invoiceData.description}
Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}

${invoiceData.items.length > 0 ? `
Invoice Items:
${invoiceData.items.map(item => `- ${item.description}: R${item.amount.toFixed(2)}`).join('\n')}
` : ''}

Total Amount: R${invoiceData.total.toFixed(2)}
    `;

    return await this.sendEmail({
      to: customerEmail,
      subject: `Invoice #${invoiceData.invoiceId} - ${invoiceData.description}`,
      html,
      text,
    });
  }

  async sendInvoiceOverdueEmail(customerEmail: string, invoiceData: InvoiceEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Overdue Invoice #${invoiceData.invoiceId}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #e63934; color: white; padding: 20px; text-align: center;">
            <h1>Capitec Invoice Tracker</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #e63934;">Invoice #${invoiceData.invoiceId} is Overdue</h2>
            
            <p>Dear ${invoiceData.customerName},</p>
            
            <p><strong>This is a reminder that your invoice is overdue.</strong></p>
            
            <div style="background-color: #fff2f2; border-left: 4px solid #e63934; padding: 15px; margin: 20px 0;">
              <p><strong>Invoice ID:</strong> #${invoiceData.invoiceId}</p>
              <p><strong>Description:</strong> ${invoiceData.description}</p>
              <p><strong>Due Date:</strong> ${new Date(invoiceData.dueDate).toLocaleDateString()}</p>
              <p><strong>Amount Due:</strong> R${invoiceData.total.toFixed(2)}</p>
            </div>
            
          </div>
          
        </div>
      </body>
      </html>
    `;

    const text = `
OVERDUE INVOICE REMINDER

Dear ${invoiceData.customerName},

This is a reminder that your invoice is overdue.

Invoice ID: #${invoiceData.invoiceId}
Description: ${invoiceData.description}
Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString()}
Amount Due: R${invoiceData.total.toFixed(2)}

    `;

    return await this.sendEmail({
      to: customerEmail,
      subject: `OVERDUE: Invoice #${invoiceData.invoiceId} - Payment Required`,
      html,
      text,
    });
  }
}

// Export a singleton instance
let sendGridService: SendGridService | null = null;

export function getSendGridService(): SendGridService | null {
  if (!sendGridService) {
    const apiKey = Deno.env.get("SENDGRID_API_KEY");
    const fromEmail = Deno.env.get("SENDGRID_FROM_EMAIL");
    
    if (!apiKey) {
      console.warn("SENDGRID_API_KEY environment variable not set. Email functionality will be disabled.");
      return null;
    }
    
    sendGridService = new SendGridService(apiKey, fromEmail);
  }
  
  return sendGridService;
}