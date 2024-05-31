import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { WppConnectService } from './wppconnect.service';
import { HandleResponseService } from './handle-response.service';

@Injectable()
export class StartService implements OnModuleInit {
  private readonly logger = new Logger(StartService.name);

  constructor(
    private readonly wppConnectService: WppConnectService,
    private readonly handleResponseService: HandleResponseService,
  ) {}

  async onModuleInit() {
    const connected = await this.wppConnectService.connect();
    if (connected) {
      const client = this.wppConnectService.getClient();
      client.onMessage(async (message) => {
        this.logger.log('Mensagem recebida:', message);
        const chatId = message.chatId;

        if (
          message.type === 'chat' &&
          !message.isGroupMsg &&
          chatId !== 'status@broadcast'
        ) {
          await this.handleResponseService.handleMessage(client, chatId, message.body);
        }
      });
    } else {
      this.logger.error('Falha ao conectar ao cliente do WhatsApp');
    }
  }
}
