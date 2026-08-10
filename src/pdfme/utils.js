import { generate } from '@pdfme/generator'
import { PDFDocument } from 'pdf-lib'

// Función para descargar el archivo JSON
export function downloadJsonFile(json, title) {
  const blob = new Blob([JSON.stringify(json, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${title}.json`
  link.click()
  URL.revokeObjectURL(url)
}

// Función para leer el archivo JSON cargado
export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result)
        resolve(json)
      } catch (err) {
        reject('El archivo no es un JSON válido.')
      }
    }
    reader.onerror = () => reject('Error al leer el archivo.')
    reader.readAsText(file)
  })
}

// Función para manejar la maximización/minimización
export const toggleFullscreen = () => {
  const editorContainer = document.getElementById('container')
  const editorNav = document.getElementById('editor-nav')
  const sidebar = document.getElementById('menubar')
  const appNavbar = document.querySelector('nav.fixed')
  const mainContent = document.querySelector('main')?.parentElement

  if (!editorContainer || !editorNav) {
    console.error('No se encontró el contenedor del editor o la barra de navegación')
    return
  }

  const isFullscreen = document.body.classList.contains('editor-fullscreen')

  if (isFullscreen) {
    // Restaurar vista normal
    document.body.classList.remove('editor-fullscreen')
    sidebar?.classList.remove('hidden')
    appNavbar?.classList.remove('hidden')
    mainContent?.classList.remove('!ml-0')

    // Restaurar nav del editor
    editorNav.style.removeProperty('position')
    editorNav.style.removeProperty('top')
    editorNav.style.removeProperty('left')
    editorNav.style.removeProperty('right')
    editorNav.style.removeProperty('z-index')

    // Restaurar contenedor — limpiar inline styles y las clases originales vuelven a aplicar
    editorContainer.style.removeProperty('position')
    editorContainer.style.removeProperty('top')
    editorContainer.style.removeProperty('left')
    editorContainer.style.removeProperty('right')
    editorContainer.style.removeProperty('bottom')
    editorContainer.style.removeProperty('height')
    editorContainer.style.removeProperty('z-index')
    editorContainer.style.removeProperty('width')
  } else {
    // Activar modo pantalla completa
    document.body.classList.add('editor-fullscreen')
    sidebar?.classList.add('hidden')
    appNavbar?.classList.add('hidden')
    mainContent?.classList.add('!ml-0')

    // Fijar nav del editor en la parte superior
    editorNav.style.position = 'fixed'
    editorNav.style.top = '0'
    editorNav.style.left = '0'
    editorNav.style.right = '0'
    editorNav.style.zIndex = '50'

    // Expandir contenedor a pantalla completa debajo del nav
    const navHeight = editorNav.offsetHeight
    editorContainer.style.position = 'fixed'
    editorContainer.style.top = `${navHeight}px`
    editorContainer.style.left = '0'
    editorContainer.style.right = '0'
    editorContainer.style.bottom = '0'
    editorContainer.style.height = `calc(100vh - ${navHeight}px)`
    editorContainer.style.width = '100%'
    editorContainer.style.zIndex = '40'
  }
}

/**
 * Inyecta una marca de agua "TEST DOCUMENT" en cada página del template.
 * Se usa únicamente en sandbox. El schema inyectado es de tipo
 * multiVariableText con posición y estilos fijos (solicitado por el usuario).
 *
 * @param {object} templateJson - template pdfme ({ basePdf, schemas })
 * @param {object} [opts]
 * @param {any}    [opts.jsonContent] - aceptado por compatibilidad; no se usa.
 * @returns {object} template con la marca de agua agregada (copia profunda)
 */
export function agregarImageSandbox(templateJson, { jsonContent = null } = {}) {
  if (!templateJson?.schemas || !Array.isArray(templateJson.schemas)) {
    throw new Error('El template debe tener un array schemas')
  }

  const nuevoTemplate = JSON.parse(JSON.stringify(templateJson))

  // Calcular ancho útil del documento: ancho de página menos márgenes izq/der.
  // Se consulta el basePdf aquí para que la marca de agua respete la
  // configuración de margen actual y no dispare la validación de "fuera de margen".
  const basePdf = nuevoTemplate.basePdf
  const pageWidth = typeof basePdf?.width === 'number' ? basePdf.width : 210
  const padding = Array.isArray(basePdf?.padding) && basePdf.padding.length === 4 ? basePdf.padding : [0, 0, 0, 0]
  const [, paddingRight, , paddingLeft] = padding
  const watermarkX = paddingLeft
  const watermarkWidth = Math.max(0, pageWidth - paddingLeft - paddingRight)

  nuevoTemplate.schemas = nuevoTemplate.schemas.map((schemaArray, index) => {
    const nuevoSchemaArray = Array.isArray(schemaArray) ? [...schemaArray] : []

    // Evitar duplicar la marca de agua si ya existe en esta página
    const yaExisteSandbox = nuevoSchemaArray.some((field) => field?.name && field.name.startsWith('TestTestLock'))
    if (yaExisteSandbox) return nuevoSchemaArray

    nuevoSchemaArray.push({
      name: `TestTestLock${index + 1}`,
      type: 'multiVariableText',
      content: '{}',
      position: {
        x: watermarkX,
        y: 133.22,
      },
      width: watermarkWidth,
      height: 12.96,
      rotate: 0,
      alignment: 'center',
      verticalAlignment: 'top',
      fontSize: 20,
      lineHeight: 1,
      characterSpacing: 0,
      dynamicFontSize: {
        min: 4,
        max: 72,
        fit: 'vertical',
      },
      fontColor: '#c9c9c9',
      fontName: 'Roboto-Bold',
      backgroundColor: '',
      opacity: 1,
      strikethrough: false,
      underline: false,
      readOnly: false,
      text: 'TEST DOCUMENT',
      variables: [],
      required: false,
    })

    return nuevoSchemaArray
  })

  // 'jsonContent' se acepta por compatibilidad; la marca de agua es texto estático.
  void jsonContent

  return nuevoTemplate
}

// Función para generar el PDF
export async function handleGeneratePdf(designer, jsonContent, plugins, fonts) {
  try {
    // Obtén el template actualizado desde el Designer
    let updatedTemplate = designer.getTemplate()

    // Extraer width y height de basePdf si existen
    let width, height
    if (updatedTemplate.basePdf && typeof updatedTemplate.basePdf === 'object') {
      width = updatedTemplate.basePdf.width
      height = updatedTemplate.basePdf.height
    }

    // En entorno sandbox: agrega la marca de agua al template e inyecta el
    // valor correspondiente en los inputs (todo centralizado en agregarImageSandbox).
    if (import.meta.env.PUBLIC_IS_SANDBOX === 'true') {
      updatedTemplate = agregarImageSandbox(updatedTemplate, { jsonContent, width, height })
    }

    const inputs = jsonContent

    // Genera el PDF
    const pdf = await generate({
      template: updatedTemplate,
      plugins,
      inputs,
      options: {
        lang: 'es',
        font: fonts,
      },
    })

    // Modificar los metadatos del PDF
    const pdfDoc = await PDFDocument.load(pdf.buffer)

    // pdfDoc.setTitle('Documento')
    pdfDoc.setAuthor('-')
    // pdfDoc.setSubject('Facturación digital')
    // pdfDoc.setProducer('Mi Compañía')
    pdfDoc.setCreator('-')
    //pdfDoc.setKeywords(['PDF', 'Generación', 'Metadatos', 'Facturación', 'digital', 'wakal'])

    const pdfBytes = await pdfDoc.save()

    // Crear y abrir el PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch (error) {
    console.error('Error al generar el PDF:', error)
  }
}

// Función para manejar el cambio de base PDF
export function handleBasePdfChange(e, designer) {
  const file = e.target.files[0] // Obtener el primer archivo seleccionado

  if (file && file.type === 'application/pdf') {
    // Leer el archivo como base64
    const reader = new FileReader()

    reader.onload = function (event) {
      const basePdf = event.target.result // Obtener el base64 del archivo

      if (designer) {
        // Obtener el template actual y actualizar el basePdf
        const updatedTemplate = {
          ...designer.getTemplate(), // Obtener el template actual
          basePdf, // Asignar el nuevo basePdf
        }

        // Actualizar el template en el diseñador
        designer.updateTemplate(updatedTemplate)
      } else {
        alert('No se encontró el diseñador.')
      }
    }

    // Leer el archivo como base64
    reader.readAsDataURL(file)
  } else {
    alert('Por favor, seleccione un archivo PDF.')
  }
}

// Función para generar PDF usando el servicio API
export async function GeneratePdf(designer, uuid_template, build_number, jsonContent) {
  try {
    // Obtén el template actualizado desde el Designer
    const updatedTemplate = designer.getTemplate()

    // Actualiza los schemas con el JSON en los campos "multiVariableText"
    updatedTemplate.schemas = updatedTemplate.schemas.map((schema) =>
      schema.map((field) => {
        if (field.type === 'multiVariableText' && Object.keys(jsonContent).length > 0) {
          return {
            ...field,
            content: JSON.stringify(jsonContent),
          }
        }
        return field
      })
    )

    // Obtener el token
    const token = localStorage.getItem('token')

    // Llamar al endpoint para generar el PDF
    const response = await fetch(`${import.meta.env.API_URL}/template/generatePDF/${uuid_template}/${build_number}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      // Obtener el PDF como blob
      const blob = await response.blob()

      // Crear URL y abrir en nueva pestaña
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } else {
      const errorData = await response.json()
      console.error('Error del servidor:', errorData)
      alert('Error al generar el PDF: ' + errorData.message)
    }
  } catch (error) {
    console.error('Error al generar el PDF:', error)
    alert('Error al generar el PDF. Ver consola para más detalles.')
    throw error
  }
}

const loadFont = async (url) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Error al cargar la fuente desde ${url}`)
  }
  return response.arrayBuffer()
}

export const initializeFonts = async () => {
  const basePath = '/fonts'

  const [focoRegular, focoBold, focoItalic, focoBoldItalic, focoLight, focoLightItalic, focoBlack, focoBlackItalic, robotoRegular, robotoBold, robotoItalic] = await Promise.all([
    loadFont(`${basePath}/Foco/Foco_Trial_Rg.ttf`),
    loadFont(`${basePath}/Foco/Foco_Trial_Bd.ttf`),
    loadFont(`${basePath}/Foco/Foco_Trial_It.ttf`),
    loadFont(`${basePath}/Foco/Foco_Trial_BdIt.ttf`),
    loadFont(`${basePath}/Foco/Foco_Trial_Lt.ttf`),
    loadFont(`${basePath}/Foco/Foco_Trial_LtIt.ttf`),
    loadFont(`${basePath}/Foco/Foco_Trial_Blk.ttf`),
    loadFont(`${basePath}/Foco/Foco_Trial_BlkIt.ttf`),
    loadFont(`${basePath}/Roboto/Roboto-Regular.ttf`),
    loadFont(`${basePath}/Roboto/Roboto-Bold.ttf`),
    loadFont(`${basePath}/Roboto/Roboto-Italic.ttf`),
  ])

  return {
    Roboto: {
      data: robotoRegular,
      fallback: true,
    },
    'Roboto-Bold': {
      data: robotoBold,
      fallback: false,
    },
    'Roboto-Italic': {
      data: robotoItalic,
      fallback: false,
    },
    'Foco-Regular': {
      data: focoRegular,
      fallback: false,
    },
    'Foco-Bold': {
      data: focoBold,
      fallback: false,
    },
    'Foco-Italic': {
      data: focoItalic,
      fallback: false,
    },
    'Foco-BoldItalic': {
      data: focoBoldItalic,
      fallback: false,
    },
    'Foco-Light': {
      data: focoLight,
      fallback: false,
    },
    'Foco-LightItalic': {
      data: focoLightItalic,
      fallback: false,
    },
    'Foco-Black': {
      data: focoBlack,
      fallback: false,
    },
    'Foco-BlackItalic': {
      data: focoBlackItalic,
      fallback: false,
    },
  }
}
