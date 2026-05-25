declare global {
  namespace Express {
    interface User {
      id: string
      email: string
      name: string
      avatar?: string | null
      authProvider?: string | null
    }
  }
}

export {}
