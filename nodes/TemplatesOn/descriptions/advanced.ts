import type { INodeProperties } from 'n8n-workflow';
import { templateLocator } from './common';

/**
 * Properties for the carousel, bulk and video resources.
 *
 * These all POST JSON and share the template picker + resourceMapper params
 * pattern from the image/PDF generation resource. The request bodies and
 * response shapes differ enough that each resource has one operation with its
 * own routing (see TemplatesOn.node.ts preSend/postReceive handlers).
 */

// ---------------------------------------------------------------------------
// Carousel — one multi-page template → N slide images.
// ---------------------------------------------------------------------------
export const carouselProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['carousel'] } },
		options: [
			{
				name: 'Generate',
				value: 'generate',
				action: 'Generate a carousel',
				description: 'Render a multi-page template into an ordered set of slide images',
				routing: { request: { method: 'POST', url: '/carousel' } },
			},
		],
		default: 'generate',
	},
	{
		...templateLocator,
		displayName: 'Template (Multi-Page)',
		description:
			'A multi-page template. Each page becomes one carousel slide. Add pages in the editor first.',
		displayOptions: { show: { resource: ['carousel'] } },
	},
	{
		displayName: 'Parameters',
		name: 'params',
		type: 'resourceMapper',
		default: { mappingMode: 'defineBelow', value: null },
		required: true,
		noDataExpression: true,
		description: 'Values applied to every slide. Loaded from the selected template.',
		displayOptions: {
			show: { resource: ['carousel'] },
			hide: { templateId: [''] },
		},
		typeOptions: {
			loadOptionsDependsOn: ['templateId.value'],
			resourceMapper: {
				resourceMapperMethod: 'getTemplateFields',
				mode: 'add',
				fieldWords: { singular: 'parameter', plural: 'parameters' },
				addAllFields: true,
				multiKeyMatch: false,
				supportAutoMap: false,
			},
		},
	},
	{
		displayName: 'Output As',
		name: 'output',
		type: 'options',
		displayOptions: { show: { resource: ['carousel'] } },
		options: [
			{
				name: 'Binary Files',
				value: 'binary',
				description: 'Output one binary item per slide (slide-1.png, slide-2.png, …)',
			},
			{
				name: 'Base64 (JSON)',
				value: 'base64',
				description: 'Output a single JSON object with a base64 slides array',
			},
		],
		default: 'binary',
	},
	{
		displayName: 'Put Slides In Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Base name of the binary properties (data0, data1, … one per slide)',
		displayOptions: { show: { resource: ['carousel'], output: ['binary'] } },
	},
];

// ---------------------------------------------------------------------------
// Bulk — one template × N records → N images or PDFs.
// ---------------------------------------------------------------------------
export const bulkProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bulk'] } },
		options: [
			{
				name: 'Generate Images',
				value: 'image',
				action: 'Bulk generate images',
				description: 'Render one template against many records → many PNGs',
				routing: { request: { method: 'POST', url: '/bulk-image' } },
			},
			{
				name: 'Generate PDFs',
				value: 'pdf',
				action: 'Bulk generate PDF files',
				description: 'Render one template against many records → many PDFs',
				routing: { request: { method: 'POST', url: '/bulk-pdf' } },
			},
		],
		default: 'image',
	},
	{
		...templateLocator,
		description: 'The template rendered once per record.',
		displayOptions: { show: { resource: ['bulk'] } },
	},
	{
		displayName: 'Records',
		name: 'records',
		type: 'json',
		default: '=[\n  {}\n]',
		required: true,
		description:
			'Array of record objects, one per output. Each object holds this template’s parameter values, e.g. [{"name":"Alice"},{"name":"Bob"}]. Max 1000 records per call. Counts as one bulk job.',
		displayOptions: { show: { resource: ['bulk'] } },
	},
	{
		displayName: 'Put Files In Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Base name of the binary properties (data0, data1, … one per record)',
		displayOptions: { show: { resource: ['bulk'] } },
	},
];

// ---------------------------------------------------------------------------
// Video — template → MP4 (slideshow or motion).
// ---------------------------------------------------------------------------
export const videoProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['video'] } },
		options: [
			{
				name: 'Generate',
				value: 'generate',
				action: 'Generate a video',
				description: 'Render an MP4 from a template',
				routing: { request: { method: 'POST', url: '/video' } },
			},
		],
		default: 'generate',
	},
	{
		...templateLocator,
		displayOptions: { show: { resource: ['video'] } },
	},
	{
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['video'] } },
		options: [
			{
				name: 'Slideshow',
				value: 'slideshow',
				description: 'Each slide is one frame shown for a number of seconds',
			},
			{
				name: 'Motion',
				value: 'motion',
				description:
					'Animate the template over a duration; the API injects __frame/__frames/__t/__progress params',
			},
		],
		default: 'slideshow',
	},
	{
		displayName: 'FPS',
		name: 'fps',
		type: 'number',
		default: 30,
		typeOptions: { minValue: 1 },
		description: 'Frames per second',
		displayOptions: { show: { resource: ['video'] } },
	},
	// Slideshow: list of slides, each with its own params + duration.
	{
		displayName: 'Slides',
		name: 'slides',
		type: 'json',
		default: '=[\n  { "params": {}, "duration": 3 }\n]',
		required: true,
		description:
			'Array of slides. Each: { "params": { … }, "duration": seconds }. Duration defaults to 3s.',
		displayOptions: { show: { resource: ['video'], mode: ['slideshow'] } },
	},
	// Motion: single duration + shared params.
	{
		displayName: 'Duration (Seconds)',
		name: 'duration',
		type: 'number',
		default: 5,
		required: true,
		typeOptions: { minValue: 0.1 },
		description: 'Total video length. The template is sampled fps × duration times.',
		displayOptions: { show: { resource: ['video'], mode: ['motion'] } },
	},
	{
		displayName: 'Parameters',
		name: 'params',
		type: 'resourceMapper',
		default: { mappingMode: 'defineBelow', value: null },
		noDataExpression: true,
		description: 'Values applied to every frame. Loaded from the selected template.',
		displayOptions: {
			show: { resource: ['video'], mode: ['motion'] },
			hide: { templateId: [''] },
		},
		typeOptions: {
			loadOptionsDependsOn: ['templateId.value'],
			resourceMapper: {
				resourceMapperMethod: 'getTemplateFields',
				mode: 'add',
				fieldWords: { singular: 'parameter', plural: 'parameters' },
				addAllFields: true,
				multiKeyMatch: false,
				supportAutoMap: false,
			},
		},
	},
	{
		displayName: 'Put Video In Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the binary property to write the MP4 to',
		displayOptions: { show: { resource: ['video'] } },
	},
];
