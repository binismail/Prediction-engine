import { IsString, IsEnum, IsNumber, IsPositive, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TradeSide } from '../../../domain/value-objects/collateral';

export class PlaceTradeDto {
  @ApiProperty({ example: 'uuid-string', description: 'ID of the market to trade on' })
  @IsUUID()
  marketId: string;

  @ApiProperty({ example: 'uuid-string', description: 'ID of the user placing the trade' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: TradeSide, example: TradeSide.YES, description: 'Side of the trade (YES/NO)' })
  @IsEnum(TradeSide)
  side: TradeSide;

  @ApiProperty({ example: 100.50, description: 'Amount of collateral to wager' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
