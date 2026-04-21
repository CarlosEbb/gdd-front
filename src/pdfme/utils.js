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

const basetestvertical =
  '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'

export function agregarImageSandbox(templateJson, width = null, height = null, base64Image = basetestvertical) {
  // Verificar que el template tenga la estructura esperada
  if (!templateJson.schemas || !Array.isArray(templateJson.schemas)) {
    throw new Error('El template debe tener un array schemas')
  }

  // Crear una copia profunda del objeto para no modificar el original
  const nuevoTemplate = JSON.parse(JSON.stringify(templateJson))

  // Obtener configuración de página
  let marginLeft = 0,
    marginTop = 0,
    marginRight = 0,
    marginBottom = 0
  let paperWidth = width
  let paperHeight = height

  if (nuevoTemplate.basePdf) {
    // Obtener dimensiones del papel
    if (!paperWidth && nuevoTemplate.basePdf.width) paperWidth = nuevoTemplate.basePdf.width
    if (!paperHeight && nuevoTemplate.basePdf.height) paperHeight = nuevoTemplate.basePdf.height

    // Obtener márgenes
    if (nuevoTemplate.basePdf.padding && Array.isArray(nuevoTemplate.basePdf.padding)) {
      marginLeft = nuevoTemplate.basePdf.padding[0] || 0
      marginTop = nuevoTemplate.basePdf.padding[1] || 0
      marginRight = nuevoTemplate.basePdf.padding[2] || 0
      marginBottom = nuevoTemplate.basePdf.padding[3] || 0
    }
  }

  // Valores por defecto (tamaño CARTA)
  if (!paperWidth) paperWidth = 215.9
  if (!paperHeight) paperHeight = 279.4

  // Calcular área disponible dentro de los márgenes
  const availableWidth = paperWidth - marginLeft - marginRight
  const availableHeight = paperHeight - marginTop - marginBottom

  // Verificar que haya espacio disponible
  if (availableWidth <= 0 || availableHeight <= 0) {
    console.warn('⚠️ No hay espacio disponible dentro de los márgenes para la imagen sandbox')
    return nuevoTemplate
  }

  // Definir tamaño de la imagen (60% del espacio disponible)
  const imageWidthPercent = 0.6
  const imageHeightPercent = 0.6

  // Redondear a 2 decimales para evitar problemas
  const imageWidth = Math.round(availableWidth * imageWidthPercent * 100) / 100
  const imageHeight = Math.round(availableHeight * imageHeightPercent * 100) / 100

  // Calcular posición centrada dentro del área de márgenes
  const centerX = marginLeft + availableWidth / 2
  const centerY = marginTop + availableHeight / 2

  // Posicionar la imagen centrada y redondear a 2 decimales
  const imageX = Math.round((centerX - imageWidth / 2) * 100) / 100
  const imageY = Math.round((centerY - imageHeight / 2) * 100) / 100

  // Formatear la imagen correctamente para pdfme
  // Asegurarse de que el base64 tenga el formato correcto
  let formattedImage = base64Image
  // Si el base64 no tiene el prefijo, agregarlo
  if (!base64Image.startsWith('data:image')) {
    formattedImage = `data:image/png;base64,${base64Image}`
  }

  // Iterar sobre cada página (schema)
  nuevoTemplate.schemas = nuevoTemplate.schemas.map((schemaArray, index) => {
    const nuevoSchemaArray = [...schemaArray]

    // Verificar si ya existe una imagen sandbox para no duplicar
    const yaExisteSandbox = nuevoSchemaArray.some((field) => field.name && field.name.startsWith('TestTestLock'))

    if (!yaExisteSandbox) {
      const nuevoElemento = {
        name: `TestTestLock${index + 1}`,
        type: 'image',
        content: formattedImage, // Ahora con el formato correcto
        position: { x: imageX, y: imageY },
        width: imageWidth,
        height: imageHeight,
        rotate: 0,
        opacity: 0.1,
        required: false,
      }

      nuevoSchemaArray.push(nuevoElemento)
    }

    return nuevoSchemaArray
  })
  console.log(nuevoTemplate)
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

    // Llamar a la función solo si existen width y height, de lo contrario usar valores por defecto
    console.log(import.meta.env.PUBLIC_IS_SANDBOX)
    if (import.meta.env.PUBLIC_IS_SANDBOX === 'true') {
      if (width !== undefined && height !== undefined) {
        updatedTemplate = await agregarImageSandbox(updatedTemplate, width, height)
      } else {
        updatedTemplate = await agregarImageSandbox(updatedTemplate)
      }
    }

    //agregar input de imagen sandbox
    const cantidadPaginas = updatedTemplate.schemas.length

    if (jsonContent && jsonContent.length > 0) {
      const primerObjeto = jsonContent[0]

      // Crear las propiedades basado en la cantidad de páginas
      for (let i = 0; i < cantidadPaginas; i++) {
        primerObjeto[`TestTestLock${i + 1}`] = basetestvertical
      }
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

        console.log('Base PDF actualizado correctamente.')
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

      console.log('PDF generado exitosamente')
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
