import type { INodeProperties } from 'n8n-workflow';

/**
 * A resourceLocator for picking a template three ways:
 *  - "From list": dropdown populated from /templates/list
 *  - "By Name": search the list by template name
 *  - "By ID": paste a UUID or use an expression (for dynamic / automated flows)
 *
 * The selected template UUID is sent into the request body as `templateId`
 * by the generation operations.
 */
export const templateLocator: INodeProperties = {
	displayName: 'Template',
	name: 'templateId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'The template to render. Templates are created in the Templates On dashboard.',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			typeOptions: {
				searchListMethod: 'searchTemplates',
				searchable: true,
			},
		},
		{
			displayName: 'By Name',
			name: 'name',
			type: 'list',
			typeOptions: {
				searchListMethod: 'searchTemplates',
				searchable: true,
				searchFilterRequired: false,
			},
			hint: 'Start typing to filter templates by name',
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 3f9a1c2e-1234-4abc-9def-0123456789ab',
			validation: [
				{
					type: 'regex',
					properties: {
						regex:
							'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
						errorMessage: 'Not a valid template ID (expected a UUID)',
					},
				},
			],
		},
	],
};
