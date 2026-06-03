import { formatCurrencyDecimal } from '../../../utils/formatCurrency';

export default function IncomeExpenditure({ data }) {
  if (!data) return null;

  const { income, expenditure, netSurplusDeficit, period } = data;

  return (
    <div className="bg-white p-8 border border-border shadow-sm print-friendly" id="income-expenditure">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-bangla-display">Statement of Income and Expenditure</h2>
        <p className="text-text-secondary font-bangla mt-1">
          For the {period.type === 'yearly' ? `Year Ended December 31, ${period.year}` : `Month of ${period.month}, ${period.year}`}
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-primary">
              <th className="py-2 font-bold text-lg uppercase">INCOME</th>
              <th className="py-2 font-bold text-lg text-right w-48">Amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 pl-4 border-b border-border/50">Investment Returns</td>
              <td className="py-2 text-right border-b border-border/50">{formatCurrencyDecimal(income.investmentReturns)}</td>
            </tr>
            <tr>
              <td className="py-2 pl-4 border-b border-border/50">Profit from Business/Ventures</td>
              <td className="py-2 text-right border-b border-border/50">{formatCurrencyDecimal(income.profitFromVentures)}</td>
            </tr>
            <tr>
              <td className="py-2 pl-4 border-b border-border/50">Interest Income</td>
              <td className="py-2 text-right border-b border-border/50">{formatCurrencyDecimal(income.interestIncome)}</td>
            </tr>
            <tr>
              <td className="py-2 pl-4 border-b border-border/50">Other Income</td>
              <td className="py-2 text-right border-b border-border/50">{formatCurrencyDecimal(income.otherIncome)}</td>
            </tr>
            <tr className="bg-surface-alt/50 font-bold">
              <td className="py-3 pl-2 border-b-2 border-text-primary">TOTAL INCOME (A)</td>
              <td className="py-3 text-right border-b-2 border-text-primary">{formatCurrencyDecimal(income.totalIncome)}</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full text-left border-collapse mt-8">
          <thead>
            <tr className="border-b-2 border-danger">
              <th className="py-2 font-bold text-lg uppercase">EXPENDITURE</th>
              <th className="py-2 font-bold text-lg text-right w-48">Amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(expenditure.categories).map(([category, amount]) => (
              <tr key={category}>
                <td className="py-2 pl-4 border-b border-border/50">{category}</td>
                <td className="py-2 text-right border-b border-border/50">{formatCurrencyDecimal(amount)}</td>
              </tr>
            ))}
            {Object.keys(expenditure.categories).length === 0 && (
              <tr>
                <td className="py-2 pl-4 border-b border-border/50">Operating & Administrative Expenses</td>
                <td className="py-2 text-right border-b border-border/50">৳ 0.00</td>
              </tr>
            )}
            <tr>
              <td className="py-2 pl-4 border-b border-border/50">Depreciation on Fixed Assets</td>
              <td className="py-2 text-right border-b border-border/50">{formatCurrencyDecimal(expenditure.depreciationOnAssets)}</td>
            </tr>
            <tr className="bg-surface-alt/50 font-bold">
              <td className="py-3 pl-2 border-b-2 border-text-primary">TOTAL EXPENDITURE (B)</td>
              <td className="py-3 text-right border-b-2 border-text-primary">{formatCurrencyDecimal(expenditure.totalExpenditure)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-8 pt-4 border-t-4 border-double border-text-primary flex justify-between items-center bg-secondary/5 px-4 py-3 rounded-lg">
          <span className="font-bold text-xl uppercase text-text-primary">NET SURPLUS / (DEFICIT) (A - B)</span>
          <span className={`font-bold text-xl ${netSurplusDeficit >= 0 ? 'text-secondary' : 'text-danger'}`}>
            {formatCurrencyDecimal(netSurplusDeficit)}
          </span>
        </div>
      </div>
    </div>
  );
}
