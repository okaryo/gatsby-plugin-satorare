import fs from 'fs'
import path from 'path'
import satori from 'satori'
import sharp from 'sharp'
import typescript from 'typescript'
import { createFileNodeFromBuffer } from 'gatsby-source-filesystem'
import { GatsbyNode, PluginOptions } from 'gatsby'
import { fileURLToPath } from 'url'
import { NodeVM, VMScript } from 'vm2'

interface Options extends PluginOptions {
  source: string
  frontmatter: {
    [key: string]: unknown
  }
}

const generateOGPImage = async (options: Options, frontmatter: {[key: string]: unknown}): Promise<Buffer> => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const font = fs.readFileSync(`${__dirname}/assets/NotoSansJP-Regular.otf`)
  const jsxCode = fs.readFileSync(options.source, 'utf8')

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
  const ogImage = vm.run(jsCode).default(frontmatter)

  const svg = await satori(
    ogImage.image,
    {
      ...ogImage.options,
      fonts: [
        {
          name: 'NotoSansJP-Regular',
          data: font,
        },
      ],
    }
  )
  return sharp(Buffer.from(svg)).png().toBuffer()
}

export const createSchemaCustomization = ({ actions }) => {
  actions.createTypes(`
    type MarkdownRemark implements Node {
      ogImage: File @link(from: "fields.ogImage")
    }
  `)
}

export const onPostBootstrap: GatsbyNode['onPostBootstrap'] = async (
  { actions, cache, getNodesByType, createNodeId }, options: Options
) => {
  const nodes = getNodesByType('MarkdownRemark')
  for (const node of nodes) {
    const frontmatter = node.frontmatter as {[key: string]: unknown}
    const png = await generateOGPImage(options, frontmatter)
    const fileNode = await createFileNodeFromBuffer({
      buffer: png,
      cache,
      createNodeId,
      ...actions,
      ext: '.png',
      parentNodeId: node.id,
    })
    actions.createNodeField({
      name: 'ogImage',
      node,
      value: fileNode.id,
    })
  }
}
