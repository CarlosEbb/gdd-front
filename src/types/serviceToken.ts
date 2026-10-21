export interface ServiceTokenData {
  token: string | null
}

export interface ServiceTokenGenerateData {
  uuid: string
  name: string
  token: string
}

export interface ServiceTokenDeleteData {
  uuid: string
  name: string
}
