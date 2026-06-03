import { formatCurrencyDecimal } from '../../../utils/formatCurrency';

export default function FixedAssetsSchedule({ data }) {
  if (!data) return null;

  const { schedule, totals, period } = data;

  return (
    <div className="bg-white p-8 border border-border shadow-sm print-friendly" id="fixed-assets">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-bangla-display">Schedule of Fixed Assets</h2>
        <p className="text-text-secondary font-bangla mt-1">
          For the {period.type === 'yearly' ? `Year Ended December 31, ${period.year}` : `Month of ${period.month}, ${period.year}`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-alt/50 border-y-2 border-primary">
              <th className="py-3 px-4 font-bold text-sm">Asset Name</th>
              <th className="py-3 px-4 font-bold text-sm text-right">Opening Value (৳)</th>
              <th className="py-3 px-4 font-bold text-sm text-right">Additions During Period (৳)</th>
              <th className="py-3 px-4 font-bold text-sm text-right">Disposals (৳)</th>
              <th className="py-3 px-4 font-bold text-sm text-right">Depreciation for Period (৳)</th>
              <th className="py-3 px-4 font-bold text-sm text-right">Closing Value (৳)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {schedule && schedule.length > 0 ? (
              schedule.map((asset) => (
                <tr key={asset.id} className="hover:bg-surface-hover transition-colors">
                  <td className="py-3 px-4 font-medium font-bangla">{asset.name}</td>
                  <td className="py-3 px-4 text-right">{formatCurrencyDecimal(asset.openingValue)}</td>
                  <td className="py-3 px-4 text-right">{formatCurrencyDecimal(asset.additions)}</td>
                  <td className="py-3 px-4 text-right text-danger">({formatCurrencyDecimal(asset.disposals)})</td>
                  <td className="py-3 px-4 text-right text-danger">({formatCurrencyDecimal(asset.depreciation)})</td>
                  <td className="py-3 px-4 text-right font-bold">{formatCurrencyDecimal(asset.closingValue)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-8 text-center text-text-muted font-bangla">
                  কোনো ফিক্সড অ্যাসেট নেই।
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-surface-alt font-bold border-y-2 border-text-primary">
              <td className="py-3 px-4">TOTAL</td>
              <td className="py-3 px-4 text-right">{formatCurrencyDecimal(totals?.openingValue || 0)}</td>
              <td className="py-3 px-4 text-right">{formatCurrencyDecimal(totals?.additions || 0)}</td>
              <td className="py-3 px-4 text-right text-danger">({formatCurrencyDecimal(totals?.disposals || 0)})</td>
              <td className="py-3 px-4 text-right text-danger">({formatCurrencyDecimal(totals?.depreciation || 0)})</td>
              <td className="py-3 px-4 text-right">{formatCurrencyDecimal(totals?.closingValue || 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
