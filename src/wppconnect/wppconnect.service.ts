import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { create, Whatsapp } from '@wppconnect-team/wppconnect';
import * as fs from 'fs';

@Injectable()
export class WppConnectService {
  private client: Whatsapp;
  private qrCode: string;
  private qrCodeGenerated = false;

  async connect(): Promise<boolean> {
    const chromePath = process.env.CHROME_PATH;
    let connected = false;
    let attempts = 1;
    const maxAttempts = 3;
    do {
      try {
        this.client = await create({
          session: "session-name",
          headless: process.env.HEADLESS === 'true' ? true : process.env.HEADLESS === 'false' ? false : 'shell',
          puppeteerOptions: {
            executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
            args: ["--no-sandbox"],
          },
          logQR: true,
          catchQR: async (base64Qr, asciiQR) => {
            this.qrCode = base64Qr;
            this.qrCodeGenerated = true;
            this.sendQrCodeNotification();
            setTimeout(() => {
              this.qrCodeGenerated = false;
              // Notificar a aplicação Laravel que o QRCode expirou
              this.sendQrCodeExpirationNotification();
            }, 60000);
          },
        });
        connected = true;
      } catch (error) {
        console.error('Erro ao conectar:', error);
        attempts++;
        console.log('Tentativa ' + attempts + '/' + maxAttempts);
        if (attempts >= maxAttempts) {
          console.error('Número máximo de tentativas atingido');
          break;
        }
      }
    } while (!connected && attempts <= maxAttempts);
    return connected;
  }

  getClient(): Whatsapp {
    if (!this.client) {
      throw new Error("Client is not connected");
    }
    return this.client;
  }

  private sendQrCodeNotification() {
    axios.post('http://exemple-dash.com/endpoint', {
      message: 'QR Code gerado',
      session: "session-name",
      qrCodeUrl: this.getQrCodeUrl()
    })
      .then(response => {
        console.log('Notificação enviada com sucesso');
      })
      .catch(error => {
        console.error('Erro ao enviar notificação:', error);
      });
  }

  private sendQrCodeExpirationNotification() {
    axios.post('http://exemple-dash.com/endpoint', {
      message: 'QR Code expirou',
      session: "session-name"
    })
      .then(response => {
        console.log('Notificação de expiração enviada com sucesso');
      })
      .catch(error => {
        console.error('Erro ao enviar notificação de expiração:', error);
      });
  }

  getQrCode(): string {
    return this.qrCode;
  }

  getQrCodeUrl(): string {
    return `data:image/png;base64,${this.qrCode}`;
  }

  async sendMessage(phone: string, text: string): Promise<any> {
    try {
      if (!this.client) {
        throw new Error("Client is not connected");
      }
      await this.client.sendText(phone, text);
      return {
        success: true,
        message: `Message sent successfully: phone: ${phone} message: ${text}`,
      };
    } catch (error) {
      return {
        success: false,
        error: `${error.message} phone: ${phone} message: ${text}`,
      };
    }
  }
}
