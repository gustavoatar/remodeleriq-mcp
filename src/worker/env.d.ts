// Email service types for Mocha email binding
interface EmailParams {
  to: string;
  subject: string;
  html_body?: string;
  text_body?: string;
  reply_to?: string;
  customer_id?: string;
  broadcast?: boolean;
}

interface EmailResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

interface EmailService {
  send(params: EmailParams): Promise<EmailResult>;
}

// Extend the global Env interface to include EMAILS binding
declare global {
  interface Env {
    EMAILS: EmailService;
  }
}

export {};
