export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export function handleServiceError(err: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) {
  if (err instanceof ConflictError) {
    res.status(409).json({ message: err.message })
    return
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ message: err.message })
    return
  }
  if (err instanceof ForbiddenError) {
    res.status(403).json({ message: err.message })
    return
  }
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(500).json({ message })
}
