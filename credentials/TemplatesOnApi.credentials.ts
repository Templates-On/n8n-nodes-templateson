import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TemplatesOnApi implements ICredentialType {
	name = 'templatesOnApi';

	displayName = 'Templates On API';

	documentationUrl = 'https://templateson.com';

	icon = { light: 'file:templateson.svg', dark: 'file:templateson.dark.svg' } as const;

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your Templates On API key. Create one at templateson.com/app/keys. It starts with "son_key_".',
			placeholder: 'son_key_xxxxxxxx...',
		},
	];

	// Inject the key into every request as the recommended X-API-Key header.
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	// Validate the key without consuming API quota (the validate endpoint is free).
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://templateson.com/api/v1',
			url: '/keys/validate',
			method: 'POST',
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'valid',
					value: false,
					message: 'Invalid or revoked API key',
				},
			},
		],
	};
}
