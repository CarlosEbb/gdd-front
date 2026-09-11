export type BodyData = Record<string, unknown>

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function parseXmlScalar(text: string): unknown {
  const value = text.trim()
  if (value === '' || value === 'null') return null
  if (value === 'true') return true
  if (value === 'false') return false
  return text
}

function groupedChildren(element: Element): BodyData {
  const grouped = new Map<string, unknown[]>()

  Array.from(element.children).forEach((child) => {
    const values = grouped.get(child.tagName) ?? []
    values.push(xmlElementToValue(child))
    grouped.set(child.tagName, values)
  })

  const data: BodyData = {}
  grouped.forEach((values, key) => {
    data[key] = values.length === 1 ? values[0] : values
  })
  return data
}

function xmlElementToValue(element: Element): unknown {
  if (element.children.length > 0) return groupedChildren(element)
  return parseXmlScalar(element.textContent || '')
}

export function parseXmlBody(raw: string): BodyData | null {
  const document = new DOMParser().parseFromString(raw, 'application/xml')
  if (document.querySelector('parsererror')) return null

  const root = document.documentElement
  if (!root) return null

  return groupedChildren(root)
}

function serializeXmlValue(key: string, value: unknown, indent: string): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return `${indent}<${key}></${key}>\n`
    return value.map((item) => serializeXmlValue(key, item, indent)).join('')
  }

  if (value !== null && typeof value === 'object') {
    const children = Object.entries(value as BodyData)
      .map(([childKey, childValue]) => serializeXmlValue(childKey, childValue, `${indent}  `))
      .join('')
    return `${indent}<${key}>\n${children}${indent}</${key}>\n`
  }

  if (value == null) return `${indent}<${key}></${key}>\n`
  return `${indent}<${key}>${escapeXml(String(value))}</${key}>\n`
}

export function serializeXmlBody(data: BodyData): string {
  const body = Object.entries(data)
    .map(([key, value]) => serializeXmlValue(key, value, '  '))
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<document>\n${body}</document>`
}
