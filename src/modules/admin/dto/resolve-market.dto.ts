import { IsEnum, IsString, IsDecimal } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AdminResolutionOutcome {
  YES = 'YES',
  NO = 'NO',
}

export class ResolveMarketDto {
  @ApiProperty({ enum: AdminResolutionOutcome, example: 'YES' })
  @IsEnum(AdminResolutionOutcome)
  outcome: AdminResolutionOutcome;
}
