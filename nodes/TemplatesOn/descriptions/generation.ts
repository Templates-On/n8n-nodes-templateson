import type { INodeProperties } from 'n8n-workflow';
import { templateLocator } from './common';

/**
 * Builds the property set for a generation resource ('image' or 'pdf').
 * Both endpoints share an identical interface (template mode + query-param
 * mode), so we generate the fields from one definition.
 */
export function generationProperties(resource: 'image' | 'pdf'): INodeProperties[] {
	const show = { resource: [resource], operation: ['generate'] };
	const label = resource === 'image' ? 'image' : 'PDF';

	return [
		// --- Generation mode -------------------------------------------------
		{
			displayName: 'Mode',
			name: 'mode',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show },
			options: [
				{
					name: 'From Template',
					value: 'template',
					description: 'Render a template you created in the dashboard with your dynamic values',
				},
				{
					name: 'From Text (No Template)',
					value: 'query',
					description: `Generate a simple ${label} from text and basic styling, no template needed`,
				},
			],
			default: 'template',
		},

		// --- Template mode ---------------------------------------------------
		{
			...templateLocator,
			displayOptions: { show: { ...show, mode: ['template'] } },
		},
		{
			displayName: 'Parameters',
			name: 'params',
			type: 'resourceMapper',
			default: { mappingMode: 'defineBelow', value: null },
			required: true,
			noDataExpression: true,
			description:
				'Values for the template’s dynamic fields. The fields are loaded automatically from the selected template.',
			displayOptions: {
				show: { ...show, mode: ['template'] },
				// Only show the mapper once a template has been chosen.
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

		// --- Query-param mode ------------------------------------------------
		{
			displayName: 'Content',
			name: 'content',
			type: 'string',
			typeOptions: { rows: 3 },
			default: 'Hello World',
			description: 'Text to display (max 10,000 characters)',
			displayOptions: { show: { ...show, mode: ['query'] } },
		},
		{
			displayName: 'Options',
			name: 'styleOptions',
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			displayOptions: { show: { ...show, mode: ['query'] } },
			options: [
				{
					displayName: 'Background Color',
					name: 'backgroundColor',
					type: 'color',
					default: '#ffffff',
				},
				{
					displayName: 'Font Size',
					name: 'fontSize',
					type: 'number',
					typeOptions: { minValue: 1, maxValue: 500 },
					default: 32,
					description: 'Font size in pixels',
				},
				{
					displayName: 'Font Weight',
					name: 'fontWeight',
					type: 'options',
					default: 400,
					options: [100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => ({
						name: String(w),
						value: w,
					})),
				},
				{
					displayName: 'Height',
					name: 'height',
					type: 'number',
					typeOptions: { minValue: 10, maxValue: 10000 },
					default: 600,
					description: 'Image height in pixels (10–10,000)',
				},
				{
					displayName: 'Padding',
					name: 'padding',
					type: 'number',
					typeOptions: { minValue: 0, maxValue: 500 },
					default: 40,
					description: 'Padding in pixels',
				},
				{
					displayName: 'Text Align',
					name: 'textAlign',
					type: 'options',
					default: 'center',
					options: [
						{ name: 'Left', value: 'left' },
						{ name: 'Center', value: 'center' },
						{ name: 'Right', value: 'right' },
					],
				},
				{
					displayName: 'Text Color',
					name: 'color',
					type: 'color',
					default: '#000000',
				},
				{
					displayName: 'Width',
					name: 'width',
					type: 'number',
					typeOptions: { minValue: 10, maxValue: 10000 },
					default: 800,
					description: 'Image width in pixels (10–10,000)',
				},
			],
		},

		// --- Output ----------------------------------------------------------
		{
			displayName: 'Output As',
			name: 'output',
			type: 'options',
			displayOptions: { show },
			options: [
				{
					name: 'Binary File',
					value: 'binary',
					description: `Output the raw ${label} as a binary file (for Drive, email, write-to-disk, etc.)`,
				},
				{
					name: 'Base64 (JSON)',
					value: 'base64',
					description: 'Output a JSON object with the base64-encoded data string',
				},
			],
			default: 'binary',
		},
		{
			displayName: 'Put Output In Field',
			name: 'binaryPropertyName',
			type: 'string',
			default: 'data',
			required: true,
			description: 'Name of the binary property to write the generated file to',
			displayOptions: { show: { ...show, output: ['binary'] } },
		},
	];
}
