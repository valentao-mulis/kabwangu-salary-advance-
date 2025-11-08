import React from 'react';
import { ScheduleEntry } from '../types';

interface SalaryCalculatorProps {
    schedule: ScheduleEntry[];
    isAdmin: boolean;
    onScheduleChange: (newSchedule: ScheduleEntry[]) => void;
}

const SalaryCalculator = ({ schedule, isAdmin, onScheduleChange }: SalaryCalculatorProps) => {
  const [selectedAmount, setSelectedAmount] = React.useState(2500);
  const [selectedMonths, setSelectedMonths] = React.useState(3);
  const repaymentPeriods = [1, 2, 3, 4, 5, 6];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(amount);
  };

  const calculation = React.useMemo(() => {
    const entry = schedule.find(s => s.disbursedAmount === selectedAmount);
    if (!entry) {
      return { monthlyPayment: 0, totalRepayment: 0, totalCost: 0 };
    }
    
    const monthlyPayment = entry.installments[selectedMonths];
    const totalRepayment = selectedMonths === 1 ? monthlyPayment : monthlyPayment * selectedMonths;
    const totalCost = totalRepayment - selectedAmount;
    
    return { monthlyPayment, totalRepayment, totalCost };
  }, [selectedAmount, selectedMonths, schedule]);

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


  return (
    <section id="calculator" className="my-16 p-6 md:p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Loan Repayment Calculator</h2>
          <p className="text-gray-600 mb-6">Select your desired loan amount and repayment period to see the details.</p>
          <div className="space-y-6">
            <div>
              <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Loan Amount
              </label>
              <select
                id="loanAmount"
                value={selectedAmount}
                onChange={(e) => setSelectedAmount(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {schedule.map(item => (
                  <option key={item.disbursedAmount} value={item.disbursedAmount}>{formatCurrency(item.disbursedAmount)}</option>
                ))}
              </select>
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
              <span className="font-bold text-xl text-green-700">{formatCurrency(calculation.monthlyPayment)}</span>
            </div>
             <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Cost of Loan:</span>
              <span className="font-semibold text-gray-800">{formatCurrency(calculation.totalCost)}</span>
            </div>
            <hr className="my-2"/>
            <div className="flex justify-between items-center opacity-75">
              <span className="font-bold text-gray-600">Total Repayment:</span>
              <span className="font-bold text-xl text-gray-500">{formatCurrency(calculation.totalRepayment)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {isAdmin && (
        <div className="mt-8 pt-6 border-t border-dashed">
          <h3 className="text-xl font-bold text-red-700 mb-4">Admin Panel: Edit Loan Schedule</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disbursed</th>
                  {repaymentPeriods.map(p => <th key={p} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{p} Month{p > 1 ? 's' : ''}</th>)}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedule.map((entry, index) => (
                  <tr key={index}>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <input type="number" value={entry.disbursedAmount} onChange={e => handleScheduleEdit(index, 'disbursedAmount', e.target.value)} className="w-24 p-1 border rounded" />
                    </td>
                    {repaymentPeriods.map(p => (
                      <td key={p} className="px-2 py-1 whitespace-nowrap">
                        <input type="number" value={entry.installments[p]} onChange={e => handleScheduleEdit(index, `installments.${p}`, e.target.value)} className="w-24 p-1 border rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default SalaryCalculator;
