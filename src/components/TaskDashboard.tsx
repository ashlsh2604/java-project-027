import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { getOffsetDateString } from '../data/initialData';
import {
  LifeCategory,
  TaskItem,
  TaskPriority,
  TaskStatus,
} from '../types/plms';

interface TaskDashboardProps {
  tasks: TaskItem[];
  onAddTask: (task: TaskItem) => void;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  externalNewTaskTrigger?: number;
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  externalNewTaskTrigger = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TaskPriority>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | LifeCategory>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(tasks[0]?.id || null);

  // New Task Form Modal State
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<LifeCategory>(LifeCategory.WORK);
  const [newPriority, setNewPriority] = useState<TaskPriority>(TaskPriority.HIGH);
  const [newDueDate, setNewDueDate] = useState(getOffsetDateString(1));
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(45);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  // Focus Timer State
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string>(tasks[0]?.id || '');
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(25 * 60);
  const [timerPresetMinutes, setTimerPresetMinutes] = useState<number>(25);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [newSubtaskDraftByTask, setNewSubtaskDraftByTask] = useState<Record<string, string>>({});

  useEffect(() => {
    if (externalNewTaskTrigger > 0) {
      setIsNewTaskModalOpen(true);
    }
  }, [externalNewTaskTrigger]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          // Automatically credit focus minutes to the selected task
          const target = tasks.find((t) => t.id === activeTimerTaskId);
          if (target) {
            onUpdateTask({
              ...target,
              loggedMinutes: target.loggedMinutes + timerPresetMinutes,
            });
          }
          return timerPresetMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, activeTimerTaskId, timerPresetMinutes, tasks, onUpdateTask]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleLogFocusBlockNow = (minutesToCredit: number) => {
    const target = tasks.find((t) => t.id === activeTimerTaskId);
    if (!target) return;
    onUpdateTask({
      ...target,
      loggedMinutes: target.loggedMinutes + minutesToCredit,
      status: target.status === TaskStatus.TODO ? TaskStatus.IN_PROGRESS : target.status,
    });
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || task.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const handleToggleTaskComplete = (task: TaskItem) => {
    const nextStatus =
      task.status === TaskStatus.COMPLETED ? TaskStatus.IN_PROGRESS : TaskStatus.COMPLETED;
    onUpdateTask({
      ...task,
      status: nextStatus,
    });
  };

  const handleCycleStatus = (task: TaskItem, nextStatus: TaskStatus) => {
    onUpdateTask({
      ...task,
      status: nextStatus,
    });
  };

  const handleToggleSubtask = (task: TaskItem, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks,
    });
  };

  const handleAddSubtaskToTask = (task: TaskItem) => {
    const draft = (newSubtaskDraftByTask[task.id] || '').trim();
    if (!draft) return;
    onUpdateTask({
      ...task,
      subtasks: [
        ...task.subtasks,
        { id: `sub-${Date.now()}`, title: draft, completed: false },
      ],
    });
    setNewSubtaskDraftByTask((prev) => ({ ...prev, [task.id]: '' }));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const parsedSubtasks = newSubtaskInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        title: line,
        completed: false,
      }));

    const created: TaskItem = {
      id: `TSK-${Math.floor(1050 + Math.random() * 8900)}`,
      title: newTitle.trim(),
      description: newDescription.trim() || 'Scheduled execution item.',
      category: newCategory,
      priority: newPriority,
      status: TaskStatus.TODO,
      dueDate: newDueDate,
      estimatedMinutes: Math.max(5, Number(newEstimatedMinutes) || 30),
      loggedMinutes: 0,
      createdAt: getOffsetDateString(0),
      subtasks: parsedSubtasks,
    };

    onAddTask(created);
    setNewTitle('');
    setNewDescription('');
    setNewSubtaskInput('');
    setIsNewTaskModalOpen(false);
    setExpandedTaskId(created.id);
  };

  const getPriorityTextStyle = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'text-red-600 dark:text-red-400 font-semibold';
      case TaskPriority.MEDIUM:
        return 'text-amber-600 dark:text-amber-400 font-medium';
      case TaskPriority.LOW:
        return 'text-slate-500 dark:text-slate-400';
    }
  };

  const getStatusTextStyle = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'text-emerald-600 dark:text-emerald-400 font-medium';
      case TaskStatus.IN_PROGRESS:
        return 'text-blue-600 dark:text-blue-400 font-medium';
      case TaskStatus.TODO:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Deep Work Focus Timer Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Active Task Focus Session</span>
            <span aria-hidden="true">·</span>
            <span>Logs directly to selected task telemetry</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Select task for focus timer"
              value={activeTimerTaskId}
              onChange={(e) => setActiveTimerTaskId(e.target.value)}
              className="text-sm font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-md truncate"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} · {t.title} ({t.loggedMinutes}/{t.estimatedMinutes}m)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Preset selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {[15, 25, 50].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerPresetMinutes(mins);
                  setTimerSecondsLeft(mins * 60);
                }}
                className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  timerPresetMinutes === mins
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Digital Countdown Display */}
          <div className="font-mono text-2xl font-bold tabular-nums px-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white">
            {formatTimer(timerSecondsLeft)}
          </div>

          <button
            type="button"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isTimerRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsTimerRunning(false);
              setTimerSecondsLeft(timerPresetMinutes * 60);
            }}
            aria-label="Reset focus timer"
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleLogFocusBlockNow(15)}
            className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer font-mono tabular-nums"
          >
            +15m Log
          </button>
        </div>
      </div>

      {/* Filter & Search Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by ID, title, or engineering scope..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Segmented Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(['ALL', TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      statusFilter === st
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st === 'ALL' ? 'All Statuses' : st}
                  </button>
                )
              )}
            </div>

            {/* Priority Selector */}
            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | TaskPriority)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Priorities</option>
              <option value={TaskPriority.HIGH}>High Priority</option>
              <option value={TaskPriority.MEDIUM}>Medium Priority</option>
              <option value={TaskPriority.LOW}>Low Priority</option>
            </select>

            {/* Category Selector */}
            <select
              aria-label="Filter by domain category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | LifeCategory)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Categories</option>
              {Object.values(LifeCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* View Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Table Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Stage Board
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsNewTaskModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* High-Density Task Data View */}
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              No tasks match your active filter criteria
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Reset your search filters or log a new priority task to populate the execution table.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setCategoryFilter('ALL');
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-800 pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-3 w-10">Done</th>
                  <th className="py-3 px-3">Task ID & Title</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Subtasks</th>
                  <th className="py-3 px-3 text-right">Focus Time</th>
                  <th className="py-3 px-3 text-right">Due Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredTasks.map((task) => {
                  const completedSubs = task.subtasks.filter((s) => s.completed).length;
                  const isExpanded = expandedTaskId === task.id;
                  return (
                    <React.Fragment key={task.id}>
                      <tr
                        onClick={() =>
                          setExpandedTaskId(isExpanded ? null : task.id)
                        }
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td
                          className="py-3 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTaskComplete(task);
                          }}
                        >
                          <button
                            type="button"
                            aria-label={`Mark ${task.title} complete`}
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                              task.status === TaskStatus.COMPLETED
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 hover:border-blue-600'
                            }`}
                          >
                            {task.status === TaskStatus.COMPLETED && (
                              <Check className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                              {task.id}
                            </span>
                            <span
                              className={`font-medium ${
                                task.status === TaskStatus.COMPLETED
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {task.category}
                        </td>
                        <td className={`py-3 px-3 whitespace-nowrap ${getPriorityTextStyle(task.priority)}`}>
                          {task.priority}
                        </td>
                        <td
                          className="py-3 px-3 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            aria-label={`Status for ${task.title}`}
                            value={task.status}
                            onChange={(e) =>
                              handleCycleStatus(task, e.target.value as TaskStatus)
                            }
                            className={`bg-transparent font-medium focus:outline-none cursor-pointer ${getStatusTextStyle(
                              task.status
                            )}`}
                          >
                            <option value={TaskStatus.TODO}>Todo</option>
                            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                            <option value={TaskStatus.COMPLETED}>Completed</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {completedSubs}/{task.subtasks.length}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {task.loggedMinutes}/{task.estimatedMinutes}m
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {task.dueDate}
                        </td>
                        <td
                          className="py-3 px-3 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id)}
                            aria-label={`Delete task ${task.id}`}
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-slate-950/60">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                              <div className="lg:col-span-6 space-y-2">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  Execution Scope & Notes
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {task.description}
                                </p>
                                <div className="pt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                                  <span>Created: {task.createdAt}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>
                                    Time Utilization:{' '}
                                    {Math.round(
                                      (task.loggedMinutes / Math.max(1, task.estimatedMinutes)) *
                                        100
                                    )}
                                    %
                                  </span>
                                </div>
                              </div>

                              <div className="lg:col-span-6 space-y-2.5">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  Subtask Verification Checklist ({completedSubs}/{task.subtasks.length})
                                </p>
                                <div className="space-y-1.5">
                                  {task.subtasks.map((st) => (
                                    <label
                                      key={st.id}
                                      className="flex items-center gap-2.5 text-xs cursor-pointer text-slate-700 dark:text-slate-300"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={st.completed}
                                        onChange={() => handleToggleSubtask(task, st.id)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                      />
                                      <span
                                        className={
                                          st.completed
                                            ? 'line-through text-slate-400 dark:text-slate-500'
                                            : ''
                                        }
                                      >
                                        {st.title}
                                      </span>
                                    </label>
                                  ))}
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={newSubtaskDraftByTask[task.id] || ''}
                                    onChange={(e) =>
                                      setNewSubtaskDraftByTask((prev) => ({
                                        ...prev,
                                        [task.id]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSubtaskToTask(task);
                                      }
                                    }}
                                    placeholder="Add verification step..."
                                    className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddSubtaskToTask(task)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                                  >
                                    Add Step
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Stage Board View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 border-t border-slate-200 dark:border-slate-800">
            {[TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED].map((stage) => {
              const stageTasks = filteredTasks.filter((t) => t.status === stage);
              return (
                <div
                  key={stage}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {stage}
                    </h3>
                    <span className="font-mono text-xs tabular-nums text-slate-500">
                      {stageTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {stageTasks.map((task) => (
                      <div
                        key={task.id}
                        className="py-3 border-b border-slate-200/80 dark:border-slate-800/80 last:border-none space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                          <span>{task.id}</span>
                          <span className={getPriorityTextStyle(task.priority)}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                          {task.title}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{task.category}</span>
                          <span className="font-mono tabular-nums">Due {task.dueDate}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono text-xs tabular-nums text-slate-500">
                            {task.loggedMinutes}/{task.estimatedMinutes}m
                          </span>
                          <div className="flex items-center gap-2">
                            {stage !== TaskStatus.COMPLETED && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCycleStatus(
                                    task,
                                    stage === TaskStatus.TODO
                                      ? TaskStatus.IN_PROGRESS
                                      : TaskStatus.COMPLETED
                                  )
                                }
                                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                Advance Stage →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Create New Execution Task
              </h3>
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Benchmark PostgreSQL Read Replica Failover"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Domain Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as LifeCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {Object.values(LifeCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value={TaskPriority.HIGH}>High</option>
                    <option value={TaskPriority.MEDIUM}>Medium</option>
                    <option value={TaskPriority.LOW}>Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Focus (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={newEstimatedMinutes}
                    onChange={(e) => setNewEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description & Context
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Specify deliverable criteria..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subtasks (One per line)
                </label>
                <textarea
                  rows={3}
                  value={newSubtaskInput}
                  onChange={(e) => setNewSubtaskInput(e.target.value)}
                  placeholder={'Draft specification\nRun unit test suite'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
