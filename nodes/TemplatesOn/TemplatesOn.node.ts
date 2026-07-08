import type {
	FieldType,
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	INodeListSearchResult,
	INodeProperties,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	ResourceMapperField,
	ResourceMapperFields,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';

import { generationProperties } from './descriptions/generation';
import { templateOperations, templateFields } from './descriptions/template';
import { carouselProperties, bulkProperties, videoProperties } from './descriptions/advanced';

const BASE_URL = 'https://templateson.com/api/v1';

/** resourceMapper value → a plain params object, dropping empty values. */
function mappedParams(mapped: { value?: Record<string, unknown> | null }): Record<string, unknown> {
	const params: Record<string, unknown> = {};
	for (const [name, value] of Object.entries(mapped.value ?? {})) {
		if (name && value !== '' && value !== null && value !== undefined) {
			params[name] = value;
		}
	}
	return params;
}

export class TemplatesOn implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Templates On',
		name: 'templatesOn',
		icon: { light: 'file:templateson.svg', dark: 'file:templateson.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Generate images, PDFs, carousels, bulk batches and videos from Templates On templates',
		defaults: { name: 'Templates On' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'templatesOnApi', required: true }],
		requestDefaults: {
			baseURL: BASE_URL,
			headers: { Accept: 'application/json' },
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Bulk', value: 'bulk' },
					{ name: 'Carousel', value: 'carousel' },
					{ name: 'Image', value: 'image' },
					{ name: 'PDF', value: 'pdf' },
					{ name: 'Template', value: 'template' },
					{ name: 'Video', value: 'video' },
				],
				default: 'image',
			},

			// Generation operation (single op per generation resource).
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['image', 'pdf'] } },
				options: [
					{
						name: 'Generate',
						value: 'generate',
						action: 'Generate a file',
						routing: {
							request: {
								method: 'POST',
								// /image or /pdf, chosen from the resource.
								url: '={{"/" + $parameter["resource"]}}',
							},
							send: { preSend: [presendGeneration] },
							output: { postReceive: [postreceiveGeneration] },
						},
					},
				],
				default: 'generate',
			},
			...generationProperties('image'),
			...generationProperties('pdf'),

			// Carousel / Bulk / Video resources. preSend + postReceive handlers are
			// attached below (attachRouting) so they can live next to the class.
			...attachRouting(carouselProperties, presendCarousel, postreceiveCarousel),
			...attachRouting(bulkProperties, presendBulk, postreceiveBulk),
			...attachRouting(videoProperties, presendVideo, postreceiveVideo),

			// Template resource.
			...templateOperations,
			...templateFields,
		],
	};

	methods = {
		listSearch: {
			async searchTemplates(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'templatesOnApi',
					{ method: 'GET', baseURL: BASE_URL, url: '/templates/list', json: true },
				)) as { templates?: Array<{ id: string; name: string; is_public?: boolean }> };

				const search = (filter ?? '').toLowerCase();
				const results = (response.templates ?? [])
					.filter((t) => !search || t.name.toLowerCase().includes(search))
					.map((t) => ({
						name: t.is_public ? `${t.name} (public)` : t.name,
						value: t.id,
						url: `https://templateson.com/app/templates/${t.id}`,
					}));

				return { results };
			},
		},

		resourceMapping: {
			// Load a template's fields and turn each into a mapper column.
			async getTemplateFields(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				const templateId = this.getNodeParameter('templateId', undefined, {
					extractValue: true,
				}) as string;

				if (!templateId) {
					return { fields: [] };
				}

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'templatesOnApi',
					{
						method: 'GET',
						baseURL: BASE_URL,
						url: `/templates/${templateId}/fields`,
						json: true,
					},
				)) as { fields?: Array<{ title: string; type: string }> };

				const fields: ResourceMapperField[] = (response.fields ?? []).map((field) => {
					// The API reports "text" or "image"; both map to string inputs
					// (image fields take a URL or data URI).
					const type: FieldType = 'string';
					return {
						id: field.title,
						displayName:
							field.type === 'image' ? `${field.title} (image URL)` : field.title,
						required: false,
						defaultMatch: false,
						display: true,
						type,
					};
				});

				return { fields };
			},
		},
	};
}

/**
 * Build the generation request body and configure the response shape
 * (binary arraybuffer vs base64 JSON) before the request is sent.
 */
async function presendGeneration(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const mode = this.getNodeParameter('mode') as string;
	const output = this.getNodeParameter('output') as string;

	const body: Record<string, unknown> = {};

	if (mode === 'template') {
		const locator = this.getNodeParameter('templateId', undefined, {
			extractValue: true,
		}) as string;
		body.templateId = locator;

		// resourceMapper value: { mappingMode, value: { fieldName: value, ... } }
		const mapped = this.getNodeParameter('params', {}) as {
			value?: Record<string, unknown> | null;
		};
		const params: Record<string, unknown> = {};
		for (const [name, value] of Object.entries(mapped.value ?? {})) {
			if (name && value !== '' && value !== null && value !== undefined) {
				params[name] = value;
			}
		}
		body.params = params;
	} else {
		body.content = this.getNodeParameter('content', 'Hello World') as string;
		const style = this.getNodeParameter('styleOptions', {}) as Record<string, unknown>;
		Object.assign(body, style);
	}

	const resource = this.getNodeParameter('resource') as 'image' | 'pdf';

	// Note: requestDefaults sets `Accept: application/json`, and the API
	// returns base64 JSON whenever Accept is JSON (or format=json is set).
	// So we must override Accept per output mode, not just toggle `json`.
	requestOptions.headers = {
		...requestOptions.headers,
		'Content-Type': 'application/json',
	};

	if (output === 'base64') {
		body.format = 'json';
		requestOptions.json = true;
		requestOptions.headers.Accept = 'application/json';
	} else {
		// Ask for the raw bytes so we can wrap them as a binary item.
		requestOptions.encoding = 'arraybuffer';
		requestOptions.json = false;
		requestOptions.returnFullResponse = true;
		requestOptions.headers.Accept = resource === 'pdf' ? 'application/pdf' : 'image/png';
	}

	requestOptions.body = body;

	return requestOptions;
}

/**
 * Wrap the response: produce a binary item for binary mode, or pass the
 * base64 JSON straight through.
 */
async function postreceiveGeneration(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const output = this.getNodeParameter('output') as string;

	if (output !== 'binary') {
		// base64 JSON path — leave the parsed body as the item json.
		return items;
	}

	const resource = this.getNodeParameter('resource') as 'image' | 'pdf';
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 'data') as string;

	const status = response.statusCode ?? 200;
	if (status >= 400) {
		// The body is bytes; decode to surface the API's JSON error message.
		const text = Buffer.from(response.body as ArrayBuffer).toString('utf8');
		let message = text;
		try {
			message = (JSON.parse(text) as { message?: string }).message ?? text;
		} catch {
			// keep raw text
		}
		throw new NodeApiError(this.getNode(), { message } as never, {
			httpCode: String(status),
			message,
		});
	}

	const isPdf = resource === 'pdf';
	const buffer = Buffer.from(response.body as ArrayBuffer);
	const fileName = isPdf ? 'template.pdf' : 'image.png';
	const mimeType = isPdf ? 'application/pdf' : 'image/png';

	const binary = await this.helpers.prepareBinaryData(buffer, fileName, mimeType);

	return [
		{
			json: {
				success: true,
				format: isPdf ? 'pdf' : 'png',
				size: buffer.length,
				fileName,
				mimeType,
			},
			binary: { [binaryPropertyName]: binary },
		},
	];
}

// ===========================================================================
// Carousel / Bulk / Video wiring.
// ===========================================================================

type PreSend = (
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
) => Promise<IHttpRequestOptions>;
type PostReceive = (
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
) => Promise<INodeExecutionData[]>;

/**
 * Attach preSend/postReceive to every operation's routing in a property array.
 * Keeps the handlers next to the class while the field definitions live in
 * ./descriptions. Only the operation options (which carry `routing`) are
 * touched.
 */
function attachRouting(
	properties: INodeProperties[],
	preSend: PreSend,
	postReceive: PostReceive,
): INodeProperties[] {
	return properties.map((prop) => {
		if (prop.name !== 'operation' || !Array.isArray(prop.options)) return prop;
		return {
			...prop,
			options: prop.options.map((opt) => {
				const o = opt as INodePropertyOptions & { routing?: IDataObject };
				if (!o.routing) return opt;
				return {
					...o,
					routing: {
						...o.routing,
						send: { preSend: [preSend] },
						output: { postReceive: [postReceive] },
					},
				};
			}),
		};
	});
}

/** Read a resourceLocator template id + a resourceMapper params object. */
function templateAndParams(ctx: IExecuteSingleFunctions): {
	templateId: string;
	params: Record<string, unknown>;
} {
	const templateId = ctx.getNodeParameter('templateId', undefined, {
		extractValue: true,
	}) as string;
	const mapped = ctx.getNodeParameter('params', {}) as { value?: Record<string, unknown> | null };
	return { templateId, params: mappedParams(mapped) };
}

function asJsonPost(requestOptions: IHttpRequestOptions, body: IDataObject): IHttpRequestOptions {
	requestOptions.headers = {
		...requestOptions.headers,
		'Content-Type': 'application/json',
		Accept: 'application/json',
	};
	requestOptions.json = true;
	requestOptions.body = body;
	return requestOptions;
}

// --- Carousel --------------------------------------------------------------
async function presendCarousel(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const { templateId, params } = templateAndParams(this);
	return asJsonPost(requestOptions, { templateId, format: 'image', params });
}

async function postreceiveCarousel(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const output = this.getNodeParameter('output') as string;
	const body = response.body as { slides?: string[]; count?: number };

	if (output !== 'binary') return items;

	const base = this.getNodeParameter('binaryPropertyName', 'data') as string;
	const slides = body.slides ?? [];
	const binary: INodeExecutionData['binary'] = {};
	for (let i = 0; i < slides.length; i++) {
		const buf = Buffer.from(slides[i], 'base64');
		binary[`${base}${i}`] = await this.helpers.prepareBinaryData(
			buf,
			`slide-${i + 1}.png`,
			'image/png',
		);
	}

	return [{ json: { success: true, count: slides.length }, binary }];
}

// --- Bulk ------------------------------------------------------------------
async function presendBulk(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const templateId = this.getNodeParameter('templateId', undefined, {
		extractValue: true,
	}) as string;

	const raw = this.getNodeParameter('records') as unknown;
	let records: unknown;
	try {
		records = typeof raw === 'string' ? JSON.parse(raw) : raw;
	} catch {
		throw new NodeApiError(this.getNode(), { message: 'Records must be valid JSON' } as never);
	}
	if (!Array.isArray(records)) {
		throw new NodeApiError(this.getNode(), {
			message: 'Records must be a JSON array of objects',
		} as never);
	}

	return asJsonPost(requestOptions, { templateId, records: records as IDataObject[] });
}

async function postreceiveBulk(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation') as 'image' | 'pdf';
	const body = response.body as { slices?: string[]; urls?: string[]; count?: number };

	// Destination delivery path — no base64 to unpack, just pass the JSON through.
	if (body.urls) return items;

	const base = this.getNodeParameter('binaryPropertyName', 'data') as string;
	const isPdf = operation === 'pdf';
	const slices = body.slices ?? [];
	const binary: INodeExecutionData['binary'] = {};
	for (let i = 0; i < slices.length; i++) {
		const buf = Buffer.from(slices[i], 'base64');
		binary[`${base}${i}`] = await this.helpers.prepareBinaryData(
			buf,
			isPdf ? `record-${i + 1}.pdf` : `record-${i + 1}.png`,
			isPdf ? 'application/pdf' : 'image/png',
		);
	}

	return [{ json: { success: true, count: slices.length }, binary }];
}

// --- Video -----------------------------------------------------------------
async function presendVideo(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const templateId = this.getNodeParameter('templateId', undefined, {
		extractValue: true,
	}) as string;
	const mode = this.getNodeParameter('mode') as 'slideshow' | 'motion';
	const fps = this.getNodeParameter('fps', 30) as number;

	const body: IDataObject = { templateId, mode, fps };

	if (mode === 'motion') {
		body.duration = this.getNodeParameter('duration') as number;
		const mapped = this.getNodeParameter('params', {}) as {
			value?: Record<string, unknown> | null;
		};
		body.params = mappedParams(mapped);
	} else {
		const raw = this.getNodeParameter('slides') as unknown;
		let slides: unknown;
		try {
			slides = typeof raw === 'string' ? JSON.parse(raw) : raw;
		} catch {
			throw new NodeApiError(this.getNode(), { message: 'Slides must be valid JSON' } as never);
		}
		if (!Array.isArray(slides)) {
			throw new NodeApiError(this.getNode(), {
				message: 'Slides must be a JSON array',
			} as never);
		}
		body.slides = slides as IDataObject[];
	}

	requestOptions.headers = {
		...requestOptions.headers,
		'Content-Type': 'application/json',
		Accept: 'video/mp4',
	};
	requestOptions.encoding = 'arraybuffer';
	requestOptions.json = false;
	requestOptions.returnFullResponse = true;
	requestOptions.body = body;
	return requestOptions;
}

async function postreceiveVideo(
	this: IExecuteSingleFunctions,
	_items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const status = response.statusCode ?? 200;
	if (status >= 400) {
		const text = Buffer.from(response.body as ArrayBuffer).toString('utf8');
		let message = text;
		try {
			message = (JSON.parse(text) as { message?: string }).message ?? text;
		} catch {
			// keep raw text
		}
		throw new NodeApiError(this.getNode(), { message } as never, {
			httpCode: String(status),
			message,
		});
	}

	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 'data') as string;
	const buffer = Buffer.from(response.body as ArrayBuffer);
	const binary = await this.helpers.prepareBinaryData(buffer, 'video.mp4', 'video/mp4');

	return [
		{
			json: { success: true, format: 'mp4', size: buffer.length, fileName: 'video.mp4' },
			binary: { [binaryPropertyName]: binary },
		},
	];
}
