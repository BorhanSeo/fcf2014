import { formatCurrencyDecimal } from '../../../utils/formatCurrency';

export default function ReceiptPayment({ data }) {
  if (!data) return null;

  const { receipts, payments, period } = data;

  return (
    <div className="bg-white p-8 border border-border shadow-sm print-friendly" id="receipt-payment">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-bangla-display">Receipt & Payment Statement</h2>
        <p className="text-text-secondary font-bangla mt-1">
          For the {period.type === 'yearly' ? `Year Ended December 31, ${period.year}` : `Month of ${period.month}, ${period.year}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t-2 border-b-2 border-text-primary">
        {/* RECEIPTS */}
        <div className="border-r border-border md:pr-4 py-4">
          <div className="flex justify-between font-bold border-b border-border pb-2 mb-3">
            <span className="uppercase tracking-wider">RECEIPTS</span>
            <span>Amount</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Opening Cash Balance</span>
              <span>{formatCurrencyDecimal(receipts.openingCashBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly Contributions</span>
              <span>{formatCurrencyDecimal(receipts.monthlyContributions)}</span>
            </div>
            <div className="flex justify-between">
              <span>Investment Returns</span>
              <span>{formatCurrencyDecimal(receipts.investmentReturns)}</span>
            </div>
            <div className="flex justify-between">
              <span>Other Receipts</span>
              <span>{formatCurrencyDecimal(receipts.otherReceipts)}</span>
            </div>
          </div>
        </div>

        {/* PAYMENTS */}
        <div className="md:pl-4 py-4">
          <div className="flex justify-between font-bold border-b border-border pb-2 mb-3">
            <span className="uppercase tracking-wider">PAYMENTS</span>
            <span>Amount</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Investments Made</span>
              <span>{formatCurrencyDecimal(payments.investmentsMade)}</span>
            </div>
            <div className="flex justify-between">
              <span>Expenses Paid</span>
              <span>{formatCurrencyDecimal(payments.expensesPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span>Fixed Asset Purchases</span>
              <span>{formatCurrencyDecimal(payments.fixedAssetPurchases)}</span>
            </div>
            <div className="flex justify-between">
              <span>Other Payments</span>
              <span>{formatCurrencyDecimal(payments.otherPayments)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-dashed border-border mt-2">
              <span>Closing Cash Balance</span>
              <span>{formatCurrencyDecimal(payments.closingCashBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOTALS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-surface-alt/50 border-b-2 border-text-primary">
        <div className="border-r border-border md:pr-4 py-3 flex justify-between font-bold text-lg">
          <span>TOTAL RECEIPTS</span>
          <span>{formatCurrencyDecimal(receipts.totalReceipts)}</span>
        </div>
        <div className="md:pl-4 py-3 flex justify-between font-bold text-lg">
          <span>TOTAL PAYMENTS</span>
          <span>{formatCurrencyDecimal(payments.totalPayments)}</span>
        </div>
      </div>
    </div>
  );
}
