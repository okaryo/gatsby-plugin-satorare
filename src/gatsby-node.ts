import fs from 'fs'
import path from 'path'
import satori, { Font } from 'satori'
import sharp from 'sharp'
import typescript from 'typescript'
import { createFileNodeFromBuffer } from 'gatsby-source-filesystem'
import { Node, GatsbyNode } from 'gatsby'
import { fileURLToPath } from 'url'
import { NodeVM, VMScript } from 'vm2'

type Option = {
  path: string
  width: number
  height: number
  fonts: FontOption[]
  graphemeImages: {[key: string]: string}
  target_nodes: string[]
}
type FontOption = {
  name: string
  path: string
  weight?: FontWeight
  style?: FontStyle
  lang?: string
}
type FontStyle = 'normal' | 'italic'
type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
type CreateOGImageByNode = (node: Node) => React.ReactElement

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const defaultOption: Option = {
  path: '',
  fonts: [
    {
      name: 'NotoSansJP',
      path: `${__dirname}/assets/NotoSansJP-Regular.otf`,
      weight: 400,
      style: 'normal',
    }
  ],
  width: 1200,
  height: 630,
  graphemeImages: {},
  target_nodes: ['Site', 'MarkdownRemark']
}

const generateOGImage = async (
  node: Node, fonts: Font[], createOGImagebyNode: CreateOGImageByNode, option: Option
): Promise<Buffer> => {
  const ogImageElement = createOGImagebyNode(node)

  const svg = await satori(
    ogImageElement,
    {
      width: option.width,
      height: option.height,
      fonts: fonts,
      // TODO: If the original satori solves emoji problems, we will check the operation and possibly modify codes.
      graphemeImages: option.graphemeImages,
    }
  )
  return sharp(Buffer.from(svg)).png().toBuffer()
}

const createOGImageElement = (path: string) => {
  const jsxCode = fs.readFileSync(path, 'utf8')
  const transpileModule = typescript.transpileModule(jsxCode, {
    compilerOptions: {
      jsx: typescript.JsxEmit.ReactJSX,
    }
  })
  const vm = new NodeVM({
    require: {
      external: true
    }
  })
  const jsCode = new VMScript(transpileModule.outputText)

  return vm.run(jsCode).default
}

export const createSchemaCustomization = ({ actions }, userOption) => {
  const option: Option = {
    ...defaultOption,
    ...userOption,
  }

  for (const targetNode of option.target_nodes) {
    actions.createTypes(`
      type ${targetNode}OgImage implements Node {
        attributes: File
      }
    `)
  }
}

export const onPostBootstrap: GatsbyNode['onPostBootstrap'] = async (
  { actions, cache, reporter, getNodesByType, createNodeId }, userOption
) => {
  if (userOption.path === undefined) reporter.panic('[gatsby-plugin-satorare] `path` config is required.')

  const option: Option = {
    ...defaultOption,
    ...userOption,
  }
  const fonts: Font[] = option.fonts.map((font) => {
    return {
      name: font.name,
      data: fs.readFileSync(font.path),
      weight: font.weight,
      style: font.style,
      lang: font.lang,
    }
  })
  const ogImageElementFunc = createOGImageElement(option.path)

  for (const targetNode of option.target_nodes) {
    const nodes = getNodesByType(targetNode)
    for (const node of nodes) {
      const png = await generateOGImage(node, fonts, ogImageElementFunc, option)
      const fileNode = await createFileNodeFromBuffer({
        buffer: png,
        cache,
        createNodeId,
        ...actions,
        ext: '.png',
        parentNodeId: node.id,
      })

      const digest = `${node.id} >>> ${targetNode}OgImage`
      await actions.createNode({
        id: createNodeId(digest),
        parent: node.id,
        internal: {
          type: `${targetNode}OgImage`,
          contentDigest: digest,
        },
        attributes: fileNode,
      })
    }
  }
}
