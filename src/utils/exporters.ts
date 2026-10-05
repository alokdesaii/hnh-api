import { API_ENDPOINTS } from '../data/apiSpec';

export function generatePostmanCollection(baseUrl: string = 'https://api.harbourandhills.com', onlyId?: string) {
  const collection = {
    info: {
      _postman_id: 'hnh-payments-api-v233',
      name: 'Harbour & Hills Payments API V2.3.3',
      description: 'Official Postman Collection for Harbour & Hills International Payments API V2.3.3 specification.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{bearerToken}}',
          type: 'string'
        }
      ]
    },
    variable: [
      {
        key: 'baseUrl',
        value: baseUrl,
        type: 'string'
      },
      {
        key: 'bearerToken',
        value: 'YOUR_JWT_TOKEN',
        type: 'string'
      },
      {
        key: 'clientAccountNumber',
        value: '102-344-001-01-00-0001-00000',
        type: 'string'
      }
    ],
    item: API_ENDPOINTS.filter((e) => e.id !== 'webhook-response' && (!onlyId || e.id === onlyId)).map((endpoint) => {
      const isAuth = endpoint.id === 'auth';
      const cleanPath = endpoint.path.replace(/{([^}]+)}/g, ':$1');
      const urlSegments = cleanPath.split('/').filter(Boolean);

      const postmanHeaders = endpoint.headers.map((h) => ({
        key: h.key,
        value: h.value,
        type: 'text'
      }));

      let bodyData: any = undefined;
      if (endpoint.method === 'POST') {
        const bodyContent = endpoint.sampleRequest || (endpoint.requestSubtypes ? endpoint.requestSubtypes[0].sampleRequest : {});
        bodyData = {
          mode: 'raw',
          raw: JSON.stringify(bodyContent, null, 2),
          options: {
            raw: {
              language: 'json'
            }
          }
        };
      }

      return {
        name: `${endpoint.sectionNumber} ${endpoint.title}`,
        request: {
          auth: isAuth ? { type: 'noauth' } : undefined,
          method: endpoint.method,
          header: postmanHeaders,
          body: bodyData,
          url: {
            raw: `{{baseUrl}}${cleanPath}`,
            host: ['{{baseUrl}}'],
            path: urlSegments
          },
          description: endpoint.description
        }
      };
    })
  };

  return JSON.stringify(collection, null, 2);
}

export function generateOpenAPISpec(baseUrl: string = 'https://api.harbourandhills.com') {
  const openapi: any = {
    openapi: '3.1.0',
    info: {
      title: 'Harbour & Hills Payments API',
      version: '2.3.3',
      description: 'Harbour & Hills International Payments API Specification V2.3.3'
    },
    servers: [
      {
        url: baseUrl,
        description: 'Selected Environment API Gateway'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    paths: {}
  };

  API_ENDPOINTS.forEach((endpoint) => {
    if (endpoint.id === 'webhook-response') return;

    const openApiPath = endpoint.path.replace(/{([^}]+)}/g, '{$1}');
    if (!openapi.paths[openApiPath]) {
      openapi.paths[openApiPath] = {};
    }

    const method = endpoint.method.toLowerCase();
    openapi.paths[openApiPath][method] = {
      summary: `${endpoint.sectionNumber} ${endpoint.title}`,
      description: endpoint.description,
      tags: [endpoint.category.toUpperCase()],
      security: endpoint.id === 'auth' ? [] : [{ bearerAuth: [] }],
      parameters: [
        ...[...endpoint.path.matchAll(/{([^}]+)}/g)].map((m) => ({ name: m[1], in: 'path', required: true, schema: { type: 'string' } })),
        ...(endpoint.id === 'auth'
          ? ['Username', 'Password'].map((name) => ({ name, in: 'header', required: true, schema: { type: 'string' } }))
          : []),
      ],
      ...(endpoint.method === 'POST' && endpoint.id !== 'auth'
        ? {
            requestBody: {
              required: true,
              content: { 'application/json': { example: endpoint.sampleRequest ?? endpoint.requestSubtypes?.[0].sampleRequest } },
            },
          }
        : {}),
      responses: {
        '200': {
          description: 'Successful Response (HH5000 or status details)',
          content: {
            'application/json': {
              example: endpoint.sampleResponse
            }
          }
        }
      }
    };
  });

  return JSON.stringify(openapi, null, 2);
}

export function downloadJsonFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
