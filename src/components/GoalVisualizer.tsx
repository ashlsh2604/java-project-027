import React, { useState } from 'react';
import { Check, Plus, Trash2, TrendingUp } from 'lucide-react';
import { GoalItem, LifeCategory } from '../types/plms';

interface GoalVisualizerProps {
  goals: GoalItem[];
  onUpdateGoal: (goal: GoalItem) => void;
  onAddGoal: (goal: GoalItem) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalVisualizer: React.FC<GoalVisualizerProps> = ({
  goals,
  onUpdateGoal,
  onAddGoal,
  onDeleteGoal,
}) => {
  const [horizonFilter, setHorizonFilter] = useState<
    'ALL' | 'Q4 2026' | 'Annual 2026' | 'Long-Term'
  >('ALL');
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const [incrementInputs, setIncrementInputs] = useState<Record<string, string>>({});

  // New Goal Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<LifeCategory>(LifeCategory.FINANCE);
  const [newHorizon, setNewHorizon] = useState<'Q4 2026' | 'Annual 2026' | 'Long-Term'>('Annual 2026');
  const [newCurrentValue, setNewCurrentValue] = useState(0);
  const [newTargetValue, setNewTargetValue] = useState(100);
  const [newUnit, setNewUnit] = useState('Units');
  const [newDeadline, setNewDeadline] = useState('2026-12-31');
  const [newNotes, setNewNotes] = useState('');
  const [newMilestonesText, setNewMilestonesText] = useState('');

  const filteredGoals = goals.filter(
    (g) => horizonFilter === 'ALL' || g.horizon === horizonFilter
  );

  const handleToggleMilestone = (goal: GoalItem, milestoneId: string) => {
    const updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    onUpdateGoal({
      ...goal,
      milestones: updatedMilestones,
    });
  };

  const handleApplyProgressDelta = (goal: GoalItem) => {
    const raw = incrementInputs[goal.id];
    const parsed = Number(raw);
    if (isNaN(parsed) || parsed === 0) return;
    const nextValue = Math.max(0, Math.min(goal.targetValue * 1.5, goal.currentValue + parsed));
    onUpdateGoal({
      ...goal,
      currentValue: nextValue,
    });
    setIncrementInputs((prev) => ({ ...prev, [goal.id]: '' }));
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const milestones = newMilestonesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line, idx) => ({
        id: `ms-${Date.now()}-${idx}`,
        title: line,
        targetDate: newDeadline,
        completed: false,
      }));

    const created: GoalItem = {
      id: `GOL-${Math.floor(210 + Math.random() * 780)}`,
      title: newTitle.trim(),
      category: newCategory,
      horizon: newHorizon,
      currentValue: Number(newCurrentValue) || 0,
      targetValue: Math.max(1, Number(newTargetValue) || 100),
      unit: newUnit.trim() || 'Units',
      deadline: newDeadline,
      notes: newNotes.trim() || 'Quantitative target roadmap.',
      milestones,
    };

    onAddGoal(created);
    setNewTitle('');
    setNewNotes('');
    setNewMilestonesText('');
    setIsNewGoalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Horizon Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
            Quantitative Goal Visualization & Milestone Roadmaps
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track cumulative progress against target metrics and verify milestone completion checkpoints
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(['ALL', 'Q4 2026', 'Annual 2026', 'Long-Term'] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizonFilter(h)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  horizonFilter === h
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {h === 'ALL' ? 'All Horizons' : h}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsNewGoalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal Roadmap</span>
          </button>
        </div>
      </div>

      {/* Goal Roadmaps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGoals.map((goal) => {
          const pct = Math.min(
            100,
            Math.round((goal.currentValue / Math.max(1, goal.targetValue)) * 1000) / 10
          );
          const radius = 34;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (pct / 100) * circumference;
          const completedMilestones = goal.milestones.filter((m) => m.completed).length;

          return (
            <div
              key={goal.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6"
            >
              <div>
                {/* Top Metadata Line (Zero-Pill Unboxed Text) */}
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono tabular-nums">{goal.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>{goal.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{goal.horizon}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteGoal(goal.id)}
                    aria-label={`Delete goal ${goal.title}`}
                    className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Title + Radial SVG Progress Ring */}
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display leading-snug">
                      {goal.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {goal.notes}
                    </p>
                    <div className="pt-1 flex items-center gap-3 text-xs font-mono tabular-nums">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}{' '}
                        {goal.unit}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Target Date: {goal.deadline}
                      </span>
                    </div>
                  </div>

                  {/* Radial Gauge */}
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-slate-100 dark:text-slate-800"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className={
                          pct >= 85
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }
                      />
                    </svg>
                    <span className="absolute font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Milestone Checkpoints */}
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Milestone Checkpoints
                    </span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {completedMilestones}/{goal.milestones.length} Verified
                    </span>
                  </div>

                  <div className="space-y-2">
                    {goal.milestones.map((ms) => (
                      <div
                        key={ms.id}
                        onClick={() => handleToggleMilestone(goal, ms.id)}
                        className="flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 text-xs">
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              ms.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {ms.completed && <Check className="w-3 h-3" />}
                          </span>
                          <span
                            className={
                              ms.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-200 font-medium'
                            }
                          >
                            {ms.title}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] tabular-nums text-slate-400 shrink-0">
                          {ms.targetDate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Quantitative Update Bar */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Log Incremental Progress ({goal.unit})</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={incrementInputs[goal.id] || ''}
                    onChange={(e) =>
                      setIncrementInputs((prev) => ({
                        ...prev,
                        [goal.id]: e.target.value,
                      }))
                    }
                    placeholder="+ Amount"
                    className="w-28 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyProgressDelta(goal)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Update Metric
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create New Goal Modal */}
      {isNewGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Create Quantitative Goal Roadmap
              </h3>
              <button
                type="button"
                onClick={() => setIsNewGoalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Open-Source Java Telemetry Library Stars"
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
                    Planning Horizon
                  </label>
                  <select
                    value={newHorizon}
                    onChange={(e) =>
                      setNewHorizon(
                        e.target.value as 'Q4 2026' | 'Annual 2026' | 'Long-Term'
                      )
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Q4 2026">Q4 2026</option>
                    <option value="Annual 2026">Annual 2026</option>
                    <option value="Long-Term">Long-Term</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Current Value
                  </label>
                  <input
                    type="number"
                    value={newCurrentValue}
                    onChange={(e) => setNewCurrentValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    required
                    value={newTargetValue}
                    onChange={(e) => setNewTargetValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Unit (USD, km, etc.)
                  </label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Strategy Notes
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Key execution constraint..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Milestones (One per line)
                </label>
                <textarea
                  rows={3}
                  value={newMilestonesText}
                  onChange={(e) => setNewMilestonesText(e.target.value)}
                  placeholder={'Complete Phase 1 architecture\nVerify benchmark targets'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewGoalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Create Roadmap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
