import { IsString, IsEnum, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CollateralType } from '../../../domain/value-objects/collateral';

export class CreateMarketDto {
  @ApiProperty({ example: 'BTC-100K-DEC', description: 'Unique ticker symbol for the market' })
  @IsString()
  @IsNotEmpty()
  ticker: string;

  @ApiProperty({ example: 'Will Bitcoin hit $100k by December 31st?', description: 'The question to be predicted' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'CoinGecko price feed > 100000', description: 'Technical criteria for resolution' })
  @IsString()
  @IsNotEmpty()
  resolutionCriteria: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z', description: 'ISO 8601 expiry date' })
  @IsDateString()
  expiryAt: string;

  @ApiProperty({ enum: CollateralType, example: CollateralType.USDC, description: 'Collateral token used for betting' })
  @IsEnum(CollateralType)
  collateralType: CollateralType;
}
