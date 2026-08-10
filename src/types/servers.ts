export interface createServer {
  id: number
  uuid: string
  ip: string
  puerto: number
  name: string
  username: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export interface DetailsServer extends createServer {
  databases: Database[]
}

export interface Database {
  id: number
  uuid: string
  nameBd: string
  username: string
  password: string
  idServer: number
  uuidServer: string
  idClient: null
  uuidClient: null
  createdAt: Date
  updatedAt: Date
}

export interface CheckServer {
  status: string
  response_time_ms: number
  server: Server
}

export interface Server {
  uuid: string
  name: string
  ip: string
  port: number
}
