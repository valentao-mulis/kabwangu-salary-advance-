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

  // Define validation constants
  const MIN_LOAN_AMOUNT = 500;
  const MAX_LOAN_AMOUNT = 10000;

  const formatCurrency = (amount: number) => {
    if (!amount || amount <= 0) {
        return 'K0';
    }
    return 'K' + new Intl.NumberFormat('en-US').format(Math.round(amount));
  };

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
    const totalCost = totalRepayment > 0 ? totalRepayment - selectedAmount : 0;
    
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

  const allAmounts = React.useMemo(() => schedule.map(s => s.disbursedAmount), [schedule]);

  return (
    <div className="max-w-4xl mx-auto px-4">
        <section id="calculator" className="my-16 p-4 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="flex flex-row gap-6 items-stretch">
            {/* Loan Calculator Card */}
            <div className="flex-1 bg-green-50 p-4 md:p-6 rounded-xl border-l-4 border-green-500">
                <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-2">Loan Schedule</h2>
                <p className="text-gray-600 mb-6 text-sm md:text-base">Select your desired loan amount.</p>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="loanAmountSelect" className="block text-sm font-medium text-gray-700 mb-2">
                            Loan Amount (ZMW)
                        </label>
                        <select 
                            id="loanAmountSelect"
                            value={selectedAmount}
                            onChange={(e) => setSelectedAmount(Number(e.target.value))}
                            className="w-full p-3 border border-gray-300 rounded-lg text-lg font-semibold text-gray-800 bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            {allAmounts.map(amt => (
                                <option key={amt} value={amt}>{formatCurrency(amt)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Repayment Period (Months)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {repaymentPeriods.map(period => (
                            <button
                                key={period}
                                type="button"
                                onClick={() => setSelectedMonths(period)}
                                className={`p-3 rounded-lg font-semibold transition-colors duration-200 ${selectedMonths === period ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                {period}
                            </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Repayment Plan Card */}
            <div className="flex-1 bg-orange-50 p-4 md:p-6 rounded-xl border-l-4 border-orange-500">
                <h3 className="text-lg font-bold text-gray-700 mb-4">Your Repayment Plan</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <span className="text-gray-600 text-sm">Loan Amount:</span>
                        <span className="font-semibold text-lg text-gray-800">{formatCurrency(selectedAmount)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-gray-600 text-sm">Repayment Period:</span>
                        <span className="font-semibold text-lg text-gray-800">{selectedMonths} Month{selectedMonths > 1 ? 's' : ''}</span>
                    </div>
                    <hr className="my-2 border-orange-200"/>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-bold">Monthly Payment:</span>
                        <span className="font-bold text-2xl md:text-3xl text-orange-700">{formatCurrency(calculation.monthlyPayment)}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-10 text-center">
            <button 
                onClick={() => onNavigate('apply')}
                disabled={selectedAmount < MIN_LOAN_AMOUNT}
                className="bg-green-600 text-white font-bold py-4 px-12 rounded-full hover:bg-green-700 transition duration-300 text-lg shadow-md transform hover:scale-105 inline-flex items-center gap-2 animate-pulse-slow disabled:bg-gray-400 disabled:opacity-70 disabled:cursor-not-allowed disabled:animate-none"
            >
                Apply for {formatCurrency(selectedAmount)} <i className="fa-solid fa-arrow-right"></i>
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
    </div>
  );
};

export default SalaryCalculator;