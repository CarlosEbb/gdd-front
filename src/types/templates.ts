export interface Templates {
  id: number
  uuid: string
  title: null
  category: string
  pathThumbnails: string
  pathJson: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface DeleteTemplate {
  success: boolean
  message: string
  redirect: string
}

export interface CreateTemplate {
  id: number
  uuid: string
  category: string
  pathThumbnails: null
  pathJson: string
  status: string
  title: string
  idUser: number
  createdAt: Date
  updatedAt: Date
}
