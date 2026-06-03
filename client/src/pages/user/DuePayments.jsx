import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateShort, getMonthName } from '../../utils/dateHelpers';
import { Card, CardBody } from '../../components/ui/Card';
import { Loader2, AlertCircle } from 'lucide-react';

export default function DuePayments() {
  const [dues, setDues] = useState([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDues = async () => {
      try {
        const res = await api.get('/payments/my/dues');
        setDues(res.data.dues);
        setTotalDue(res.data.totalDue);
      } catch (error) {
        console.error('Error fetching dues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDues();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-bangla-display">বকেয়া পেমেন্ট</h1>
        <p className="text-sm text-text-secondary font-bangla mt-1">আপনার সকল বকেয়া মাসের তালিকা</p>
      </div>

      {dues.length > 0 ? (
        <>
          <Card className="bg-danger/10 border-danger/20 shadow-none">
            <CardBody className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-danger shadow-sm">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-danger font-bangla">মোট বকেয়া</h3>
                  <p className="text-text-secondary text-sm font-bangla">{dues.length} মাসের পেমেন্ট বাকি আছে</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-danger">{formatCurrency(totalDue)}</h2>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dues.map((due, idx) => {
              const currentDate = new Date();
              const isOverdue = currentDate > new Date(due.dueDate);

              return (
                <Card key={idx} className="border-l-4 border-l-danger">
                  <CardBody className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg font-bangla">{getMonthName(due.month)} {due.year}</h3>
                        <p className="text-xs text-text-secondary mt-1">
                          ডিউ ডেট: {formatDateShort(due.dueDate)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${isOverdue ? 'bg-danger text-white' : 'bg-warning/20 text-warning'}`}>
                        {isOverdue ? 'OVERDUE' : 'PENDING'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-end pt-4 border-t border-border">
                      <p className="text-sm font-medium text-text-muted font-bangla">পরিমাণ</p>
                      <p className="text-xl font-bold text-danger">{formatCurrency(due.amount)}</p>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <Card className="border-dashed border-2 border-border bg-surface-alt">
          <CardBody className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary font-bangla mb-2">কোনো বকেয়া নেই!</h2>
            <p className="text-text-secondary font-bangla max-w-md">
              অভিনন্দন! আপনার কোনো পেমেন্ট বকেয়া নেই। আপনি একদম আপ-টু-ডেট আছেন।
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
