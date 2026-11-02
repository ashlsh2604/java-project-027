import React, { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { getPastDateStrings } from '../data/initialData';
import { HabitItem, LifeCategory } from '../types/plms';

interface HabitMatrixProps {
  habits: HabitItem[];
  onToggleHabitDate: (habitId: string, dateStr: string) => void;
  onAddHabit: (habit: HabitItem) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitMatrix: React.FC<HabitMatrixProps> = ({
  habits,
  onToggleHabitDate,
  onAddHabit,
  onDeleteHabit,
}) => {
  const past14Days = getPastDateStrings(14);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | LifeCategory>('ALL');
  const [isNewHabitOpen, setIsNewHabitOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<LifeCategory>(LifeCategory.HEALTH);
  const [newTargetDays, setNewTargetDays] = useState(6);
  const [newUnitLabel, setNewUnitLabel] = useState('Daily check-in');
  const [newNotes, setNewNotes] = useState('');

  const filteredHabits = habits.filter(
    (h) => categoryFilter === 'ALL' || h.category === categoryFilter
  );

  const computeCurrentStreak = (completedDates: string[]): number => {
    const set = new Set(completedDates);
    let streak = 0;
    for (let i = past14Days.length - 1; i >= 0; i--) {
      if (set.has(past14Days[i])) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const habit: HabitItem = {
      id: `HAB-0${habits.length + 1}-${Date.now().toString().slice(-3)}`,
      name: newName.trim(),
      category: newCategory,
      targetDaysPerWeek: Math.min(7, Math.max(1, Number(newTargetDays) || 5)),
      unitLabel: newUnitLabel.trim() || 'Daily target',
      completedDates: [past14Days[past14Days.length - 1]],
      notes: newNotes.trim() || 'Consistent daily execution.',
    };
    onAddHabit(habit);
    setNewName('');
    setNewNotes('');
    setIsNewHabitOpen(false);
  };

  // Compute aggregate 14-day statistics
  const totalPossibleChecks = Math.max(1, filteredHabits.length * 14);
  const totalActualChecks = filteredHabits.reduce((acc, h) => {
    const countInWindow = past14Days.filter((d) => h.completedDates.includes(d)).length;
    return acc + countInWindow;
  }, 0);
  const overallConsistencyRate = Math.round((totalActualChecks / totalPossibleChecks) * 100);

  return (
    <div className="space-y-6">
      {/* Top Controls & Aggregate Consistency Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
            14-Day Habit Normalization & Consistency Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any daily cell to toggle check-in status · Overall 14-Day Window Adherence:{' '}
            <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {overallConsistencyRate}% ({totalActualChecks}/{filteredHabits.length * 14} checks)
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter habits by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | LifeCategory)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Categories</option>
            {Object.values(LifeCategory).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsNewHabitOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Habit Protocol</span>
          </button>
        </div>
      </div>

      {/* High-Density 14-Day Spreadsheet Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 overflow-x-auto">
        {filteredHabits.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              No habit protocols in this category
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add a new habit protocol or switch back to All Categories.
            </p>
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg cursor-pointer"
            >
              Show All Habits
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[920px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 pr-4">Habit Protocol & Domain</th>
                <th className="py-3 px-2 text-right">Target</th>
                {past14Days.map((dateStr, idx) => {
                  const dayNum = dateStr.slice(8, 10);
                  const monthNum = dateStr.slice(5, 7);
                  const isToday = idx === past14Days.length - 1;
                  return (
                    <th
                      key={dateStr}
                      className={`py-2 px-1.5 text-center font-mono tabular-nums ${
                        isToday
                          ? 'text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] leading-none">{monthNum}/</div>
                      <div className="text-xs mt-0.5">{dayNum}</div>
                    </th>
                  );
                })}
                <th className="py-3 px-3 text-right">Streak</th>
                <th className="py-3 px-3 text-right">14d Rate</th>
                <th className="py-3 pl-2 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredHabits.map((habit) => {
                const count14 = past14Days.filter((d) =>
                  habit.completedDates.includes(d)
                ).length;
                const rate14 = Math.round((count14 / 14) * 100);
                const streak = computeCurrentStreak(habit.completedDates);

                return (
                  <tr
                    key={habit.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-2.5 pr-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {habit.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{habit.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{habit.unitLabel}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {habit.targetDaysPerWeek}d/wk
                    </td>
                    {past14Days.map((dateStr) => {
                      const isDone = habit.completedDates.includes(dateStr);
                      return (
                        <td key={dateStr} className="py-2 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => onToggleHabitDate(habit.id, dateStr)}
                            aria-label={`Toggle ${habit.name} on ${dateStr}`}
                            className={`w-6 h-6 mx-auto rounded flex items-center justify-center transition-colors cursor-pointer ${
                              isDone
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-transparent hover:border hover:border-slate-400'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {streak}d
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      <span
                        className={
                          rate14 >= 80
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : rate14 >= 60
                            ? 'text-amber-600 dark:text-amber-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400'
                        }
                      >
                        {rate14}%
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteHabit(habit.id)}
                        aria-label={`Delete habit ${habit.name}`}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Daily Completion Aggregate Footer Row */}
              <tr className="bg-slate-50/80 dark:bg-slate-950/50 font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                <td className="py-2.5 pr-4 font-sans font-semibold text-slate-700 dark:text-slate-300">
                  Daily Protocol Completion Count
                </td>
                <td className="py-2.5 px-2 text-right">All</td>
                {past14Days.map((dateStr) => {
                  const completedThatDay = filteredHabits.filter((h) =>
                    h.completedDates.includes(dateStr)
                  ).length;
                  return (
                    <td key={dateStr} className="py-2.5 px-1 text-center">
                      {completedThatDay}/{filteredHabits.length}
                    </td>
                  );
                })}
                <td colSpan={3} className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {overallConsistencyRate}% Window Avg
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Add New Habit Modal */}
      {isNewHabitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Add Habit Protocol
              </h3>
              <button
                type="button"
                onClick={() => setIsNewHabitOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Habit Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Evening Mobility & Thoracic Decompression"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as LifeCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {Object.values(LifeCategory).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Weekly Frequency (1-7)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={newTargetDays}
                    onChange={(e) => setNewTargetDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Daily Measurement Unit
                </label>
                <input
                  type="text"
                  value={newUnitLabel}
                  onChange={(e) => setNewUnitLabel(e.target.value)}
                  placeholder="e.g. 20 minutes"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Protocol Notes
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Execution trigger and standard..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewHabitOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Save Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
