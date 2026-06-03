import { formatCurrencyDecimal } from '../../../utils/formatCurrency';

export default function BalanceSheet({ data }) {
  if (!data) return null;

  const { assets, liabilitiesAndEquity, period } = data;

  return (
    <div className="bg-white p-8 border border-border shadow-sm print-friendly" id="balance-sheet">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-bangla-display">Statement of Financial Position (Balance Sheet)</h2>
        <p className="text-text-secondary font-bangla mt-1">
          As of {period.type === 'yearly' ? `December 31, ${period.year}` : `End of Month ${period.month}, ${period.year}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* ASSETS */}
        <div>
          <h3 className="font-bold text-lg border-b-2 border-primary pb-2 mb-4">ASSETS</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-medium">
                <span>Fixed Assets (At Cost)</span>
                <span>{formatCurrencyDecimal(assets.fixedAssets)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary ml-4">
                <span>Less: Accumulated Depreciation</span>
                <span>({formatCurrencyDecimal(assets.accumulatedDepreciation)})</span>
              </div>
              <div className="flex justify-between font-bold mt-1 border-t border-border pt-1">
                <span>Net Fixed Assets</span>
                <span>{formatCurrencyDecimal(assets.netFixedAssets)}</span>
              </div>
            </div>

            <div className="flex justify-between font-medium">
              <span>Investments</span>
              <span>{formatCurrencyDecimal(assets.investments)}</span>
            </div>

            <div>
              <span className="font-bold block mb-1">Current Assets</span>
              <div className="flex justify-between text-sm ml-4">
                <span>Cash in Hand</span>
                <span>{formatCurrencyDecimal(assets.currentAssets.cashInHand)}</span>
              </div>
              <div className="flex justify-between text-sm ml-4">
                <span>Cash at Bank</span>
                <span>{formatCurrencyDecimal(assets.currentAssets.cashAtBank)}</span>
              </div>
              <div className="flex justify-between text-sm ml-4">
                <span>Receivables</span>
                <span>{formatCurrencyDecimal(assets.currentAssets.receivables)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between font-bold text-lg mt-6 pt-3 border-t-2 border-text-primary">
            <span>TOTAL ASSETS</span>
            <span>{formatCurrencyDecimal(assets.totalAssets)}</span>
          </div>
        </div>

        {/* LIABILITIES & EQUITY */}
        <div>
          <h3 className="font-bold text-lg border-b-2 border-secondary pb-2 mb-4">LIABILITIES & EQUITY</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-medium">
                <span>Members' Fund</span>
                <span>{formatCurrencyDecimal(liabilitiesAndEquity.membersFund)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Retained Surplus/(Deficit)</span>
                <span>{formatCurrencyDecimal(liabilitiesAndEquity.retainedSurplus)}</span>
              </div>
              <div className="flex justify-between font-bold mt-1 border-t border-border pt-1">
                <span>Total Equity</span>
                <span>{formatCurrencyDecimal(liabilitiesAndEquity.totalEquity)}</span>
              </div>
            </div>

            <div>
              <span className="font-bold block mb-1">Current Liabilities</span>
              <div className="flex justify-between text-sm ml-4">
                <span>Payables</span>
                <span>{formatCurrencyDecimal(liabilitiesAndEquity.currentLiabilities.payables)}</span>
              </div>
              <div className="flex justify-between font-bold mt-1 border-t border-border pt-1">
                <span>Total Liabilities</span>
                <span>{formatCurrencyDecimal(liabilitiesAndEquity.totalLiabilities)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between font-bold text-lg mt-6 pt-3 border-t-2 border-text-primary">
            <span>TOTAL LIABILITIES & EQUITY</span>
            <span>{formatCurrencyDecimal(liabilitiesAndEquity.totalLiabilitiesAndEquity)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
