export class MarketCreatedEvent {
  constructor(
    public readonly marketId: string,
    public readonly ticker: string,
    public readonly question: string,
    public readonly resolutionCriteria: string,
    public readonly expiryAt: Date,
    public readonly collateralType: string,
  ) {}
}
