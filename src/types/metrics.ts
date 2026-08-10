export interface Metrics {
  total_clients: number
  total_workspaces: number
  total_documents: number
  clients: ClientMetrics[]
}

export interface ClientMetrics {
  uuid: string
  name: string
  rif: string
  workspaces_count: number
  documents_count: number
}

export interface MetricsByDocument {
  template: Template
  period: Period
  metrics: Metric[]
}

export interface Metric {
  date: Date
  count: number
}

export interface Period {
  from: Date
  to: Date
  days: number
}

export interface Template {
  uuid: string
  name: string
  title: string
}
