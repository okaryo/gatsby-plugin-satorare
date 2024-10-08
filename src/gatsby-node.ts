import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { GatsbyCache, GatsbyNode, Node } from "gatsby";
import { createFileNodeFromBuffer } from "gatsby-source-filesystem";
import satori, { type Font } from "satori";
import sharp from "sharp";
import typescript from "typescript";

type Option = {
	path: string;
	width: number;
	height: number;
	fonts: FontOption[];
	graphemeImages: { [key: string]: string };
	target_nodes: string[];
};
type FontOption = {
	name: string;
	path: string;
	weight?: FontWeight;
	style?: FontStyle;
	lang?: string;
};
type FontStyle = "normal" | "italic";
type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultOption: Option = {
	path: "",
	fonts: [
		{
			name: "NotoSansJP",
			path: `${__dirname}/assets/NotoSansJP-Regular.otf`,
			weight: 400,
			style: "normal",
		},
	],
	width: 1200,
	height: 630,
	graphemeImages: {},
	target_nodes: ["Site", "MarkdownRemark"],
};

const ogImageCacheKey = (node: Node) =>
	`gatsby-plugin-satorare-ogimage-${node.internal.type}-${node.internal.contentDigest}`;

const generateOGImage = async (
	node: Node,
	fonts: Font[],
	option: Option,
): Promise<Buffer> => {
	const ogImageReactElement = await createOgImageReactElement(
		node,
		option.path,
	);

	const svg = await satori(ogImageReactElement, {
		width: option.width,
		height: option.height,
		fonts: fonts,
		graphemeImages: option.graphemeImages,
	});
	return sharp(Buffer.from(svg)).png().toBuffer();
};

const createOgImageReactElement = async (
	node: Node,
	filepath: string,
): Promise<React.ReactNode> => {
	const jsxCode = fs.readFileSync(filepath, "utf8");
	const transpiled = typescript.transpileModule(jsxCode, {
		compilerOptions: {
			jsx: typescript.JsxEmit.React,
			module: typescript.ModuleKind.NodeNext,
		},
	}).outputText;
	const tmpFilename = path.join(
		os.tmpdir(),
		`tmp-gatsby-plugin-satorare-${node.id}.js`,
	);
	fs.writeFileSync(tmpFilename, transpiled);

	const module = await import(tmpFilename);
	global.React = await import("react");

	return module.default.default(node);
};

const getOgImage = async (
	node: Node,
	fonts: Font[],
	option: Option,
	cache: GatsbyCache,
): Promise<Buffer> => {
	const imageCache = await cache.get(ogImageCacheKey(node));
	if (imageCache) {
		return Buffer.from(imageCache.data);
	}

	const image = await generateOGImage(node, fonts, option);
	await cache.set(ogImageCacheKey(node), image);

	return image;
};

export const createSchemaCustomization = ({ actions }, userOption) => {
	const option: Option = {
		...defaultOption,
		...userOption,
	};

	for (const targetNode of option.target_nodes) {
		actions.createTypes(`
      type ${targetNode}OgImage implements Node {
        attributes: File
      }
    `);
	}
};

export const onPostBootstrap: GatsbyNode["onPostBootstrap"] = async (
	{ actions, cache, reporter, parentSpan, getNodesByType, createNodeId },
	userOption,
) => {
	if (userOption.path === undefined)
		reporter.panic("[gatsby-plugin-satorare] `path` config is required.");

	const activity = reporter.activityTimer("generate og images", { parentSpan });
	activity.start();

	const option: Option = {
		...defaultOption,
		...userOption,
	};
	const fonts: Font[] = option.fonts.map((font) => {
		return {
			name: font.name,
			data: fs.readFileSync(font.path),
			weight: font.weight,
			style: font.style,
			lang: font.lang,
		};
	});

	const tasks = [];
	for (const targetNode of option.target_nodes) {
		const nodes = getNodesByType(targetNode);
		for (const node of nodes) {
			tasks.push(async () => {
				const image = await getOgImage(node, fonts, option, cache);
				const fileNode = await createFileNodeFromBuffer({
					buffer: image,
					cache,
					createNodeId,
					...actions,
					ext: ".png",
					parentNodeId: node.id,
				});

				const digest = `${node.id} >>> ${targetNode}OgImage`;
				await actions.createNode({
					id: createNodeId(digest),
					parent: node.id,
					internal: {
						type: `${targetNode}OgImage`,
						contentDigest: digest,
					},
					attributes: fileNode,
				});
			});
		}
	}

	await Promise.all(tasks.map((task) => task()));
	activity.end();
};
