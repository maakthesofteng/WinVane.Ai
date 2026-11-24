import { IMailMessage } from './IMailMessage';

export interface IMailProvider {
  send(message: IMailMessage): Promise<void>;
}
