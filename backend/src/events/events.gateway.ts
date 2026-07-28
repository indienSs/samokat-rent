import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/',
  cors: { origin: true, credentials: true },
  path: '/events/',
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`WS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  onPing(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: unknown,
  ): { pong: true; echo: unknown } {
    return { pong: true, echo: data };
  }

  emitScooterChanged(payload: {
    action: 'created' | 'updated' | 'deleted';
    scooter: unknown;
  }) {
    this.server.emit('scooter:changed', payload);
    this.server.emit('analytics:changed', {});
  }

  emitRentalChanged(payload: {
    action: 'created' | 'completed';
    rental: unknown;
  }) {
    this.server.emit('rental:changed', payload);
    this.server.emit('analytics:changed', {});
  }
}
