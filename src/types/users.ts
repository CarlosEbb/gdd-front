export interface User {
  uuid: string
  name: string
  lastName: string
  email: string
  country: string
  zipCode: string
  status: string
  photo: null | string
  lastConnection: string | null
  createdAt: Date
  updatedAt: Date
}
