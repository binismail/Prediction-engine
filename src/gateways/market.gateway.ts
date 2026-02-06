import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MarketGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinMarket')
  handleJoinMarket(client: Socket, marketId: string) {
    client.join(`market:${marketId}`);
    return { event: 'joined', data: marketId };
  }

  @OnEvent('TradeExecuted')
  handleTradeExecuted(payload: any) {
    // Broadcast trade info to room
    this.server.to(`market:${payload.marketId}`).emit('trade', payload);
  }

  @OnEvent('MarketPriceUpdated')
  handlePriceUpdate(payload: any) {
    // Broadcast new prices
    this.server.to(`market:${payload.marketId}`).emit('priceUpdate', payload);
  }
}
