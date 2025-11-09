import React from 'react';
import { ScheduleEntry } from '../types';

interface SalaryCalculatorProps {
    schedule: ScheduleEntry[];
    isAdmin: boolean;
    onScheduleChange: (newSchedule: ScheduleEntry[]) => void;
    onLoanChange?: (details: { amount: number, months: number, monthlyPayment: number }) => void;
    onNavigate: (page: 'home' | 'apply' | 'contact') => void;
}

const SalaryCalculator = ({ schedule, isAdmin, onScheduleChange, onLoanChange, onNavigate }: SalaryCalculatorProps) => {
  const [selectedAmount, setSelectedAmount] = React.useState<number>(2500);
  const [selectedMonths, setSelectedMonths] = React.useState(3);
  const repaymentPeriods = [1, 2, 3, 4, 5, 6];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(amount);
  };

  // Helper to find min and max from schedule for UI constraints
  const minAmount = React.useMemo(() => Math.min(...schedule.map(s => s.disbursedAmount)), [schedule]);
  const maxAmount = React.useMemo(() => Math.max(...schedule.map(s => s.disbursedAmount)), [schedule]);

  const calculateDynamicInstallment = React.useCallback((amount: number, months: number): number => {
    if (amount <= 0) return 0;

    // 1. Exact match lookup
    const exactMatch = schedule.find(s => s.disbursedAmount === amount);
    if (exactMatch) {
        return exactMatch.installments[months];
    }

    // 2. Sort schedule to ensure correct interpolation
    const sortedSchedule = [...schedule].sort((a, b) => a.disbursedAmount - b.disbursedAmount);

    // 3. Handle extrapolation below minimum
    if (amount < sortedSchedule[0].disbursedAmount) {
        const base = sortedSchedule[0];
        const ratio = amount / base.disbursedAmount;
        return base.installments[months] * ratio;
    }

    // 4. Handle extrapolation above maximum
    if (amount > sortedSchedule[sortedSchedule.length - 1].disbursedAmount) {
        const base = sortedSchedule[sortedSchedule.length - 1];
        const ratio = amount / base.disbursedAmount;
        return base.installments[months] * ratio;
    }

    // 5. Linear interpolation between two points
    for (let i = 0; i < sortedSchedule.length - 1; i++) {
        const lower = sortedSchedule[i];
        const upper = sortedSchedule[i+1];
        if (amount > lower.disbursedAmount && amount < upper.disbursedAmount) {
            const ratio = (amount - lower.disbursedAmount) / (upper.disbursedAmount - lower.disbursedAmount);
            const lowerInstallment = lower.installments[months];
            const upperInstallment = upper.installments[months];
            return lowerInstallment + ratio * (upperInstallment - lowerInstallment);
        }
    }

    return 0;
  }, [schedule]);

  const calculation = React.useMemo(() => {
    const monthlyPayment = calculateDynamicInstallment(selectedAmount, selectedMonths);
    const totalRepayment = selectedMonths === 1 ? monthlyPayment : monthlyPayment * selectedMonths;
    const totalCost = totalRepayment - selectedAmount;
    
    return { monthlyPayment, totalRepayment, totalCost };
  }, [selectedAmount, selectedMonths, calculateDynamicInstallment]);

  // Notify parent of changes
  React.useEffect(() => {
      if (onLoanChange) {
          onLoanChange({
              amount: selectedAmount,
              months: selectedMonths,
              monthlyPayment: calculation.monthlyPayment
          });
      }
  }, [selectedAmount, selectedMonths, calculation.monthlyPayment, onLoanChange]);

  const handleScheduleEdit = (index: number, field: string, value: string) => {
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    const numValue = parseInt(value, 10);

    if (!isNaN(numValue)) {
      if (field.startsWith('installments.')) {
        const monthKey = Number(field.split('.')[1]);
        newSchedule[index].installments[monthKey] = numValue;
      } else if (field === 'disbursedAmount') {
        newSchedule[index].disbursedAmount = numValue;
      }
      onScheduleChange(newSchedule);
    }
  };

  const commonAmounts = [1000, 2500, 5000, 10000];

  return (
    <section id="calculator" className="my-16 p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Loan Repayment Calculator</h2>
          <p className="text-gray-600 mb-6">Enter your desired loan amount and select a repayment period.</p>
          <div className="space-y-6">
            <div>
              <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount (ZMW)
              </label>
              <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500 font-semibold">K</span>
                  <input
                    id="loanAmount"
                    type="number"
                    min={100}
                    max={50000}
                    step={50}
                    value={selectedAmount || ''}
                    onChange={(e) => setSelectedAmount(Number(e.target.value))}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-semibold text-gray-800"
                    placeholder="Enter amount..."
                  />
              </div>
              {/* Quick select pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                  {commonAmounts.map(amt => (
                      <button 
                        key={amt} 
                        type="button"
                        onClick={() => setSelectedAmount(amt)}
                        className={`text-xs px-3 py-1 rounded-full border transition ${selectedAmount === amt ? 'bg-orange-100 border-orange-500 text-orange-700 font-bold' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                      >
                          {formatCurrency(amt)}
                      </button>
                  ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repayment Period (Months)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {repaymentPeriods.map(period => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setSelectedMonths(period)}
                    className={`p-3 rounded-lg font-semibold transition-colors duration-200 ${selectedMonths === period ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-xl border-l-4 border-green-500">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Your Repayment Plan</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{selectedMonths === 1 ? 'Total Repayment:' : 'Monthly Payment:'}</span>
              <span className="font-bold text-2xl text-green-700">{formatCurrency(calculation.monthlyPayment)}</span>
            </div>
             <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Cost of Loan:</span>
              <span className="font-semibold text-gray-800">{formatCurrency(calculation.totalCost)}</span>
            </div>
            <hr className="my-2 border-green-200"/>
            <div className="flex justify-between items-center opacity-75">
              <span className="font-bold text-gray-600">Total Repayment:</span>
              <span className="font-bold text-xl text-gray-500">{formatCurrency(calculation.totalRepayment)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <button 
            onClick={() => onNavigate('apply')}
            className="bg-orange-500 text-white font-bold py-4 px-12 rounded-full hover:bg-orange-600 transition duration-300 text-lg shadow-md transform hover:scale-105 inline-flex items-center gap-2 animate-pulse-slow"
        >
            Start the process now <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
      
      {isAdmin && (
        <div className="mt-8 pt-6 border-t border-dashed">
          <h3 className="text-xl font-bold text-red-700 mb-4">Admin Panel: Edit Base Schedule</h3>
          <p className="text-sm text-gray-500 mb-4">Custom amounts are interpolated from these base values.</p>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200 relative">
              <thead className="bg-gray-50 sticky top-0 shadow-sm">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Disbursed</th>
                  {repaymentPeriods.map(p => <th key={p} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">{p} Mo</th>)}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedule.map((entry, index) => (
                  <tr key={index}>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <input type="number" value={entry.disbursedAmount} onChange={e => handleScheduleEdit(index, 'disbursedAmount', e.target.value)} className="w-24 p-1 border rounded font-bold" />
                    </td>
                    {repaymentPeriods.map(p => (
                      <td key={p} className="px-2 py-1 whitespace-nowrap">
                        <input type="number" value={entry.installments[p]} onChange={e => handleScheduleEdit(index, `installments.${p}`, e.target.value)} className="w-20 p-1 border rounded text-sm" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`
        @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.9; }
        }
        .animate-pulse-slow {
            animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </section>
  );
};

export default SalaryCalculator;
