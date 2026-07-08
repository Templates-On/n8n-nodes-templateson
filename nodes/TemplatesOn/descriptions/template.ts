import type { INodeProperties } from 'n8n-workflow';
import { templateLocator } from './common';

export const templateOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['template'] } },
		options: [
			{
				name: 'List',
				value: 'list',
				action: 'List accessible templates',
				description: 'Return all templates accessible to your API key',
				routing: {
					request: { method: 'GET', url: '/templates/list' },
					output: {
						// Unwrap the { templates: [...] } envelope into one item per template.
						postReceive: [
							{
								type: 'rootProperty',
								properties: { property: 'templates' },
							},
						],
					},
				},
			},
			{
				name: 'Get Fields',
				value: 'getFields',
				action: 'Get the fields of a template',
				description: 'Return the dynamic parameters a template accepts',
				routing: {
					request: {
						method: 'GET',
						url: '={{"/templates/" + $parameter["templateId"] + "/fields"}}',
					},
				},
			},
		],
		default: 'list',
	},
];

export const templateFields: INodeProperties[] = [
	{
		...templateLocator,
		displayOptions: { show: { resource: ['template'], operation: ['getFields'] } },
	},
];
