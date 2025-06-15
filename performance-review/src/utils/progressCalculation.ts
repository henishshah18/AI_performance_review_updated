// Progress Data Types
export interface ProgressData {
  current: number;
  total: number;
  percentage: number;
}

export interface TaskItem {
  id: number;
  status: string;
  weight?: number;
}

export interface GoalItem {
  id: number;
  status: string;
  tasks?: TaskItem[];
  weight?: number;
}

export interface ObjectiveItem {
  id: number;
  status: string;
  goals?: GoalItem[];
  weight?: number;
}

// Progress Calculation Functions
export function calculateTaskProgress(tasks: TaskItem[]): ProgressData {
  if (!tasks || tasks.length === 0) {
    return { current: 0, total: 0, percentage: 0 };
  }
  
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const totalTasks = tasks.length;
  const percentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  return {
    current: completedTasks.length,
    total: totalTasks,
    percentage
  };
}

export function calculateWeightedTaskProgress(tasks: TaskItem[]): ProgressData {
  if (!tasks || tasks.length === 0) {
    return { current: 0, total: 0, percentage: 0 };
  }
  
  const totalWeight = tasks.reduce((sum, task) => sum + (task.weight || 1), 0);
  const completedWeight = tasks
    .filter(task => task.status === 'completed')
    .reduce((sum, task) => sum + (task.weight || 1), 0);
  
  const percentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  
  return {
    current: completedWeight,
    total: totalWeight,
    percentage
  };
}

export function calculateGoalProgress(goals: GoalItem[]): ProgressData {
  if (!goals || goals.length === 0) {
    return { current: 0, total: 0, percentage: 0 };
  }
  
  let totalProgress = 0;
  let goalCount = 0;
  
  goals.forEach(goal => {
    if (goal.tasks && goal.tasks.length > 0) {
      const taskProgress = calculateTaskProgress(goal.tasks);
      totalProgress += taskProgress.percentage;
    } else {
      // If no tasks, use goal status
      totalProgress += goal.status === 'completed' ? 100 : 0;
    }
    goalCount++;
  });
  
  const averagePercentage = goalCount > 0 ? Math.round(totalProgress / goalCount) : 0;
  const completedGoals = goals.filter(goal => {
    if (goal.tasks && goal.tasks.length > 0) {
      const taskProgress = calculateTaskProgress(goal.tasks);
      return taskProgress.percentage === 100;
    }
    return goal.status === 'completed';
  }).length;
  
  return {
    current: completedGoals,
    total: goals.length,
    percentage: averagePercentage
  };
}

export function calculateWeightedGoalProgress(goals: GoalItem[]): ProgressData {
  if (!goals || goals.length === 0) {
    return { current: 0, total: 0, percentage: 0 };
  }
  
  const totalWeight = goals.reduce((sum, goal) => sum + (goal.weight || 1), 0);
  let weightedProgress = 0;
  
  goals.forEach(goal => {
    const weight = goal.weight || 1;
    let goalProgress = 0;
    
    if (goal.tasks && goal.tasks.length > 0) {
      const taskProgress = calculateTaskProgress(goal.tasks);
      goalProgress = taskProgress.percentage;
    } else {
      goalProgress = goal.status === 'completed' ? 100 : 0;
    }
    
    weightedProgress += (goalProgress * weight) / 100;
  });
  
  const percentage = totalWeight > 0 ? Math.round((weightedProgress / totalWeight) * 100) : 0;
  
  return {
    current: weightedProgress,
    total: totalWeight,
    percentage
  };
}

export function calculateObjectiveProgress(objectives: ObjectiveItem[]): ProgressData {
  if (!objectives || objectives.length === 0) {
    return { current: 0, total: 0, percentage: 0 };
  }
  
  let totalProgress = 0;
  let objectiveCount = 0;
  
  objectives.forEach(objective => {
    if (objective.goals && objective.goals.length > 0) {
      const goalProgress = calculateGoalProgress(objective.goals);
      totalProgress += goalProgress.percentage;
    } else {
      // If no goals, use objective status
      totalProgress += objective.status === 'completed' ? 100 : 0;
    }
    objectiveCount++;
  });
  
  const averagePercentage = objectiveCount > 0 ? Math.round(totalProgress / objectiveCount) : 0;
  const completedObjectives = objectives.filter(objective => {
    if (objective.goals && objective.goals.length > 0) {
      const goalProgress = calculateGoalProgress(objective.goals);
      return goalProgress.percentage === 100;
    }
    return objective.status === 'completed';
  }).length;
  
  return {
    current: completedObjectives,
    total: objectives.length,
    percentage: averagePercentage
  };
}

export function calculateWeightedObjectiveProgress(objectives: ObjectiveItem[]): ProgressData {
  if (!objectives || objectives.length === 0) {
    return { current: 0, total: 0, percentage: 0 };
  }
  
  const totalWeight = objectives.reduce((sum, obj) => sum + (obj.weight || 1), 0);
  let weightedProgress = 0;
  
  objectives.forEach(objective => {
    const weight = objective.weight || 1;
    let objectiveProgress = 0;
    
    if (objective.goals && objective.goals.length > 0) {
      const goalProgress = calculateGoalProgress(objective.goals);
      objectiveProgress = goalProgress.percentage;
    } else {
      objectiveProgress = objective.status === 'completed' ? 100 : 0;
    }
    
    weightedProgress += (objectiveProgress * weight) / 100;
  });
  
  const percentage = totalWeight > 0 ? Math.round((weightedProgress / totalWeight) * 100) : 0;
  
  return {
    current: weightedProgress,
    total: totalWeight,
    percentage
  };
}

// Validation Functions
export function validateProgress(progress: ProgressData): ProgressData {
  return {
    current: Math.max(0, progress.current),
    total: Math.max(0, progress.total),
    percentage: Math.min(100, Math.max(0, progress.percentage))
  };
}

export function isProgressComplete(progress: ProgressData): boolean {
  return progress.percentage >= 100;
}

export function getProgressStatus(percentage: number): 'not-started' | 'in-progress' | 'completed' {
  if (percentage === 0) return 'not-started';
  if (percentage >= 100) return 'completed';
  return 'in-progress';
}

// Progress Formatting
export function formatProgressDisplay(progress: ProgressData): string {
  return `${progress.current}/${progress.total} (${progress.percentage}%)`;
}

export function formatProgressPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

// Progress Color Helpers
export function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'success';
  if (percentage >= 75) return 'primary';
  if (percentage >= 50) return 'warning';
  if (percentage >= 25) return 'warning';
  return 'error';
}

export function getProgressColorClass(percentage: number): string {
  const color = getProgressColor(percentage);
  const colorMap = {
    success: 'bg-success-500',
    primary: 'bg-primary-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500'
  };
  return colorMap[color as keyof typeof colorMap] || 'bg-gray-500';
}

// Progress Analytics
export interface ProgressAnalytics {
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
  blockedItems: number;
  overallProgress: ProgressData;
  averageProgress: number;
  completionRate: number;
}

export function analyzeProgress<T extends { status: string }>(items: T[]): ProgressAnalytics {
  const totalItems = items.length;
  const completedItems = items.filter(item => item.status === 'completed').length;
  const inProgressItems = items.filter(item => 
    ['in_progress', 'active'].includes(item.status)
  ).length;
  const notStartedItems = items.filter(item => 
    ['not_started', 'draft'].includes(item.status)
  ).length;
  const blockedItems = items.filter(item => 
    ['blocked', 'overdue'].includes(item.status)
  ).length;
  
  const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const averageProgress = completionRate;
  
  const overallProgress: ProgressData = {
    current: completedItems,
    total: totalItems,
    percentage: Math.round(completionRate)
  };
  
  return {
    totalItems,
    completedItems,
    inProgressItems,
    notStartedItems,
    blockedItems,
    overallProgress,
    averageProgress: Math.round(averageProgress),
    completionRate: Math.round(completionRate)
  };
}

// Progress Trends
export interface ProgressTrend {
  date: string;
  percentage: number;
  completed: number;
  total: number;
}

export function calculateProgressTrend(
  progressHistory: ProgressTrend[]
): { trend: 'up' | 'down' | 'stable'; change: number } {
  if (progressHistory.length < 2) {
    return { trend: 'stable', change: 0 };
  }
  
  const latest = progressHistory[progressHistory.length - 1];
  const previous = progressHistory[progressHistory.length - 2];
  
  const change = latest.percentage - previous.percentage;
  
  if (change > 0) return { trend: 'up', change };
  if (change < 0) return { trend: 'down', change: Math.abs(change) };
  return { trend: 'stable', change: 0 };
}

// Division by Zero Protection
export function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function safePercentage(current: number, total: number): number {
  return Math.round(safeDivide(current, total) * 100);
} 