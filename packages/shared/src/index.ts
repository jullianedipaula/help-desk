export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  createdAt: Date
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'closed'
  authorId: string
  assigneeId?: string
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  name: string
  email: string
  createdAt: Date
}
