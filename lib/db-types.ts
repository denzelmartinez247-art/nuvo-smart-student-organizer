// Auto-generated from your database schema — do not edit by hand.
// Regenerates automatically whenever a table is created or altered.

export type SubjectsRow = {
  id: string
  userId: string
  name: string
  color: string
  icon: string
  createdAt: string
}

export type TasksRow = {
  id: string
  userId: string
  title: string
  description: string
  subjectId: string | null
  dueDate: string | null
  dueTime: string | null
  priority: string
  status: string
  isStarred: boolean
  subtasks: string
  createdAt: string
  completedAt: string | null
}
