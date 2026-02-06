import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: '0x123...abc', description: 'Wallet address of the user' })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}
