export interface Templates {
  categories: Category[]
}

export interface Category {
  id: number
  uuid: string
  title: null
  category: string
  path_thumbnails: string
  path_json: string
  status: string
  created_at: Date
  updated_at: Date
}
