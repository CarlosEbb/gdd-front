export interface Publication {
  uuid_publication: string
  uuid_template: string
  uuid_version: string
  published_date: Date
  version: PublicationVersion
}

export interface PublicationVersion {
  uuid: string
  build_number: string
  name_version: string
}
