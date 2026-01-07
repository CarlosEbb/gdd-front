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
  const sidebar = document.getElementById('menubar')
  const navbar = document.querySelector('nav.fixed')
  const mainContent = document.querySelector('main')?.parentElement
  const toolbarEditor = editorContainer?.previousElementSibling // La barra de herramientas del editor
  const toggleButton = document.getElementById('toggleFullscreenBtn')

  if (!editorContainer) {
    console.error('No se encontró el contenedor del editor')
    return
  }

  // Comprobar si ya está en modo pantalla completa
  const isFullscreen = document.body.classList.contains('editor-fullscreen')

  if (isFullscreen) {
    // Restaurar vista normal
    document.body.classList.remove('editor-fullscreen')

    // Mostrar sidebar y navbar
    sidebar?.classList.remove('hidden')
    navbar?.classList.remove('hidden')

    // Restaurar margen del contenedor principal
    mainContent?.classList.remove('!ml-0')

    // Restaurar posición de la barra de herramientas
    if (toolbarEditor) {
      toolbarEditor.classList.remove('!top-0', '!left-0', '!right-0', 'fixed', 'z-50')
      toolbarEditor.classList.add('absolute', 'top-14')
    }

    // Restaurar posición y tamaño del contenedor del editor
    editorContainer.classList.remove('!fixed', '!top-16', '!left-0', '!right-0', '!bottom-0', '!h-[calc(100vh-64px)]', 'z-50')
    editorContainer.classList.add('absolute', 'top-[120px]', 'h-[calc(100vh-120px)]')

    // Actualizar texto del botón
    if (toggleButton) {
      const spanText = toggleButton.querySelector('span')
      if (spanText) {
        spanText.innerHTML = spanText.innerHTML.replace('Salir de pantalla completa', 'Pantalla completa')
      }
    }
  } else {
    // Activar modo pantalla completa
    document.body.classList.add('editor-fullscreen')

    // Ocultar sidebar y navbar
    sidebar?.classList.add('hidden')
    navbar?.classList.add('hidden')

    // Quitar margen del contenedor principal
    mainContent?.classList.add('!ml-0')

    // Posicionar la barra de herramientas en la parte superior
    if (toolbarEditor) {
      toolbarEditor.classList.remove('absolute', 'top-14')
      toolbarEditor.classList.add('!top-0', '!left-0', '!right-0', 'fixed', 'z-50')
    }

    // Expandir el contenedor del editor a pantalla completa
    editorContainer.classList.remove('absolute', 'top-[120px]', 'h-[calc(100vh-120px)]')
    editorContainer.classList.add('!fixed', '!top-16', '!left-0', '!right-0', '!bottom-0', '!h-[calc(100vh-64px)]', 'z-50')

    // Actualizar texto del botón
    if (toggleButton) {
      const spanText = toggleButton.querySelector('span')
      if (spanText) {
        spanText.innerHTML = spanText.innerHTML.replace('Pantalla completa', 'Salir de pantalla completa')
      }
    }
  }
}

// Función para generar el PDF
export async function handleGeneratePdf(designer, jsonContent, plugins, fonts) {
  try {
    // Obtén el template actualizado desde el Designer
    const updatedTemplate = designer.getTemplate()

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

    pdfDoc.setTitle('Documento')
    pdfDoc.setAuthor('Wakal 4.0')
    pdfDoc.setSubject('Facturación digital')
    pdfDoc.setProducer('Mi Compañía')
    pdfDoc.setCreator('Wakal 4.0')
    pdfDoc.setKeywords(['PDF', 'Generación', 'Metadatos', 'Facturación', 'digital', 'wakal'])

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

  const focoRegular = await loadFont(`${basePath}/Foco/Foco_Trial_Rg.ttf`)
  const focoBold = await loadFont(`${basePath}/Foco/Foco_Trial_Bd.ttf`)
  const focoItalic = await loadFont(`${basePath}/Foco/Foco_Trial_It.ttf`)
  const focoBoldItalic = await loadFont(`${basePath}/Foco/Foco_Trial_BdIt.ttf`)
  const focoLight = await loadFont(`${basePath}/Foco/Foco_Trial_Lt.ttf`)
  const focoLightItalic = await loadFont(`${basePath}/Foco/Foco_Trial_LtIt.ttf`)
  const focoBlack = await loadFont(`${basePath}/Foco/Foco_Trial_Blk.ttf`)
  const focoBlackItalic = await loadFont(`${basePath}/Foco/Foco_Trial_BlkIt.ttf`)

  const robotoRegular = await loadFont(`${basePath}/Roboto/Roboto-Regular.ttf`)
  const robotoBold = await loadFont(`${basePath}/Roboto/Roboto-Bold.ttf`)
  const robotoItalic = await loadFont(`${basePath}/Roboto/Roboto-Italic.ttf`)

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
