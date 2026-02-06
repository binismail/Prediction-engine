import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({ example: 1000, description: 'Amount to deposit' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
