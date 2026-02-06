import { IsString, IsNotEmpty, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TradeSide } from '../../../domain/value-objects/collateral';

export class SellTradeDto {
  @ApiProperty({ description: 'The Market ID', example: 'uuid-here' })
  @IsString()
  @IsNotEmpty()
  marketId: string;

  @ApiProperty({ description: 'The User ID', example: 'uuid-here' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: TradeSide, description: 'Which side to sell (YES/NO)' })
  @IsEnum(TradeSide)
  side: TradeSide;

  @ApiProperty({ description: 'Amount of SHARES to sell', example: 10.0 })
  @IsNumber()
  @Min(0.000001)
  shares: number;
}
