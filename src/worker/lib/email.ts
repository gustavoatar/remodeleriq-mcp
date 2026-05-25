// Resend-backed email service replacing Mocha's EMAILS service binding.
// Keeps the same EmailParams / EmailResult shape so callsites don't change.

export interface EmailParams {
  to: string;
  subject: string;
  html_body?: string;
  text_body?: string;
  reply_to?: string;
  customer_id?: string;
  broadcast?: boolean;
}

export interface EmailResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

interface EmailEnv {
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
}

const DEFAULT_FROM = "RemodelerIQ <noreply@remodeleriq.com>";

interface ResendApiResponse {
  id?: string;
  message?: string;
  name?: string;
}

export async function sendEmail(
  env: EmailEnv,
  params: EmailParams
): Promise<EmailResult> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const from = env.RESEND_FROM || DEFAULT_FROM;

  const body: Record<string, unknown> = {
    from,
    to: [params.to],
    subject: params.subject,
  };

  if (params.html_body) body.html = params.html_body;
  if (params.text_body) body.text = params.text_body;
  if (params.reply_to) body.reply_to = params.reply_to;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as ResendApiResponse;

    if (!res.ok) {
      return {
        success: false,
        error: data.message || data.name || `Resend error (${res.status})`,
      };
    }

    return { success: true, message_id: data.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown email send error",
    };
  }
}
