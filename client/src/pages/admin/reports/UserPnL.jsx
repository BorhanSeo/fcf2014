import { formatCurrencyDecimal } from '../../../utils/formatCurrency';

export default function UserPnL({ data }) {
  if (!data || !Array.isArray(data)) return null;

  return (
    <div className="bg-white p-8 border border-border shadow-sm print-friendly" id="user-pnl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-bangla-display">Per User Profit & Loss Share</h2>
        <p className="text-text-secondary font-bangla mt-1">Based on proportional contribution basis</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-primary/5 border-y-2 border-primary">
              <th className="py-3 px-4 font-bold text-sm">Member Name</th>
              <th className="py-3 px-4 font-bold text-sm text-right">Total Contribution</th>
              <th className="py-3 px-4 font-bold text-sm text-right">Share (%)</th>
              <th className="py-3 px-4 font-bold text-sm text-right">Net P&L Allocation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((user, idx) => (
              <tr key={idx} className="hover:bg-surface-hover transition-colors">
                <td className="py-3 px-4 font-medium font-bangla">{user.userName}</td>
                <td className="py-3 px-4 text-right">{formatCurrencyDecimal(user.userContribution)}</td>
                <td className="py-3 px-4 text-right">{(user.sharePercentage || 0).toFixed(2)}%</td>
                <td className={`py-3 px-4 text-right font-bold ${user.userProfitLoss >= 0 ? 'text-secondary' : 'text-danger'}`}>
                  {user.userProfitLoss >= 0 ? '+' : ''}{formatCurrencyDecimal(user.userProfitLoss)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-surface-alt font-bold border-y-2 border-text-primary">
              <td className="py-3 px-4">TOTAL</td>
              <td className="py-3 px-4 text-right">
                {formatCurrencyDecimal(data.reduce((sum, u) => sum + u.userContribution, 0))}
              </td>
              <td className="py-3 px-4 text-right">100.00%</td>
              <td className="py-3 px-4 text-right">
                {formatCurrencyDecimal(data.reduce((sum, u) => sum + u.userProfitLoss, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
