export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'technician' | 'client'
  mustChangePassword: boolean
  createdAt: Date
}

export interface Technician {
  id: string
  userId: string
  name: string
  email: string
  availabilitySlots: string[]
  createdAt: Date
}

export interface Client {
  id: string
  userId: string
  name: string
  email: string
  createdAt: Date
}

export interface Service {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'closed'
  serviceId: string
  clientId: string
  technicianId?: string
  createdAt: Date
  updatedAt: Date
}
