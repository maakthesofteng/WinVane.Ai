export interface IMailMessage {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}
