import { Injectable } from '@nestjs/common';
import { Whatsapp } from '@wppconnect-team/wppconnect';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class HandleResponseService {
  private genAI = new GoogleGenerativeAI(process.env.API_KEY);

  async handleMessage(client: Whatsapp, chatId: string, message: string) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'Quem é você?' }],
        },
        {
          role: 'model',
          parts: [
            {
              text:
                'Sou a recepcionista pessoal do Fábio, minha função é falar com os contatos dele caso ele esteja ocupado, pegar recados, entre outras tarefas de assistência pessoal.',
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Adicionar o prefixo à mensagem
    const mensagemComPrefixo = `*Recepcionista Gemini*: ${text}`;

    // Enviar a resposta de volta para o cliente do WhatsApp
    await client.sendText(chatId, mensagemComPrefixo);
  }
}
