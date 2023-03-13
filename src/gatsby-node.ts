import fs from 'fs'
import path from 'path'
import satori from 'satori'
import sharp from 'sharp'
import typescript from 'typescript'
import { createFileNodeFromBuffer } from 'gatsby-source-filesystem'
import { Node, GatsbyNode } from 'gatsby'
import { fileURLToPath } from 'url'
import { NodeVM, VMScript } from 'vm2'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type Options = {
  path: string
  font: string
  width: number
  height: number
  graphemeImages: {[key: string]: string}
  target_nodes: string[]
}

const defaultOptions: Options = {
  path: ``,
  font: `${__dirname}/assets/NotoSansJP-Regular.otf`,
  width: 1200,
  height: 630,
  graphemeImages: {},
  target_nodes: ['Site', 'MarkdownRemark']
}

const generateOGPImage = async (node: Node, options: Options): Promise<Buffer> => {
  const font = fs.readFileSync(options.font)
  const jsxCode = fs.readFileSync(options.path, 'utf8')

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
  const ogImageElement = vm.run(jsCode).default(node)

  const svg = await satori(
    ogImageElement,
    {
      width: options.width,
      height: options.height,
      fonts: [
        {
          name: `OG image font`,
          data: font,
        },
      ],
      // TODO: If the original satori solves emoji problems, we will check the operation and possibly modify codes.
      graphemeImages: options.graphemeImages,
    }
  )
  return sharp(Buffer.from(svg)).png().toBuffer()
}

export const createSchemaCustomization = ({ actions }, userOptions) => {
  const options: Options = {
    ...defaultOptions,
    ...userOptions,
  }

  for (const targetNode of options.target_nodes) {
    actions.createTypes(`
      type ${targetNode}OgImage implements Node {
        attributes: File
      }
    `)
  }
}

export const onPostBootstrap: GatsbyNode['onPostBootstrap'] = async (
  { actions, cache, reporter, getNodesByType, createNodeId }, userOptions
) => {
  if (userOptions.path === undefined) reporter.panic(`[gatsby-plugin-satorare] \`path\` config is required.`)

  const options: Options = {
    ...defaultOptions,
    ...userOptions,
  }

  for (const targetNode of options.target_nodes) {
    const nodes = getNodesByType(targetNode)
    for (const node of nodes) {
      const png = await generateOGPImage(node, options)
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
