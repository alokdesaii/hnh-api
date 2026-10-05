import type { EndpointSpec } from '../data/apiSpec';

export function generateCurlSnippet(endpoint: EndpointSpec, baseUrl: string, token: string, customBody?: any): string {
  const url = `${baseUrl}${endpoint.path}`;
  const isAuth = endpoint.id === 'auth';
  let snippet = `curl --request ${endpoint.method} \\\n  --url '${url}' \\\n  --header 'Content-Type: application/json'`;

  if (!isAuth) {
    snippet += ` \\\n  --header 'Authorization: Bearer ${token || 'YOUR_BEARER_TOKEN'}'`;
  } else {
    snippet += ` \\\n  --header 'Username: 0000aa-730c-0000' \\\n  --header 'Password: YOUR_PASSWORD'`;
  }

  const bodyData = customBody !== undefined ? customBody : (endpoint.sampleRequest || (endpoint.requestSubtypes ? endpoint.requestSubtypes[0].sampleRequest : undefined));

  if (endpoint.method === 'POST' && bodyData) {
    snippet += ` \\\n  --data '${JSON.stringify(bodyData, null, 2)}'`;
  }

  return snippet;
}

export function generateJavaScriptSnippet(endpoint: EndpointSpec, baseUrl: string, token: string, customBody?: any): string {
  const isAuth = endpoint.id === 'auth';
  const bodyData = customBody !== undefined ? customBody : (endpoint.sampleRequest || (endpoint.requestSubtypes ? endpoint.requestSubtypes[0].sampleRequest : undefined));

  return `const url = '${baseUrl}${endpoint.path}';
const options = {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json',${!isAuth ? `\n    'Authorization': 'Bearer ${token || 'YOUR_BEARER_TOKEN'}'` : `\n    'Username': '0000aa-730c-0000',\n    'Password': 'YOUR_PASSWORD'`}
  }${endpoint.method === 'POST' && bodyData ? `,\n  body: JSON.stringify(${JSON.stringify(bodyData, null, 4)})` : ''}
};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log('Response Status:', data.StatusCode);
  console.log(data);
} catch (error) {
  console.error('API Error:', error);
}`;
}

export function generatePythonSnippet(endpoint: EndpointSpec, baseUrl: string, token: string, customBody?: any): string {
  const isAuth = endpoint.id === 'auth';
  const bodyData = customBody !== undefined ? customBody : (endpoint.sampleRequest || (endpoint.requestSubtypes ? endpoint.requestSubtypes[0].sampleRequest : undefined));

  return `import requests
import json

url = "${baseUrl}${endpoint.path}"

headers = {
    "Content-Type": "application/json",${!isAuth ? `\n    "Authorization": "Bearer ${token || 'YOUR_BEARER_TOKEN'}"` : `\n    "Username": "0000aa-730c-0000",\n    "Password": "YOUR_PASSWORD"`}
}
${endpoint.method === 'POST' && bodyData ? `\npayload = ${JSON.stringify(bodyData, null, 4)}

response = requests.post(url, headers=headers, json=payload)` : `\nresponse = requests.get(url, headers=headers)`}

print("Status Code:", response.status_code)
print(response.json())`;
}

export function generateGoSnippet(endpoint: EndpointSpec, baseUrl: string, token: string, customBody?: any): string {
  const isAuth = endpoint.id === 'auth';
  const bodyData = customBody !== undefined ? customBody : (endpoint.sampleRequest || (endpoint.requestSubtypes ? endpoint.requestSubtypes[0].sampleRequest : undefined));

  return `package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    url := "${baseUrl}${endpoint.path}"
    ${endpoint.method === 'POST' && bodyData ? `var payload = []byte(\`${JSON.stringify(bodyData, null, 2)}\`)
    req, err := http.NewRequest("${endpoint.method}", url, bytes.NewBuffer(payload))` : `req, err := http.NewRequest("${endpoint.method}", url, nil)`}
    if err != nil {
        panic(err)
    }

    req.Header.Set("Content-Type", "application/json")
    ${!isAuth ? `req.Header.Set("Authorization", "Bearer ${token || 'YOUR_BEARER_TOKEN'}")` : `req.Header.Set("Username", "0000aa-730c-0000")\n    req.Header.Set("Password", "YOUR_PASSWORD")`}

    client := &http.Client{}
    res, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer res.Body.Close()

    body, _ := io.ReadAll(res.Body)
    fmt.Println(string(body))
}`;
}

export function generatePhpSnippet(endpoint: EndpointSpec, baseUrl: string, token: string, customBody?: any): string {
  const isAuth = endpoint.id === 'auth';
  const bodyData = customBody !== undefined ? customBody : (endpoint.sampleRequest || (endpoint.requestSubtypes ? endpoint.requestSubtypes[0].sampleRequest : undefined));

  return `<?php

$curl = curl_init();

$headers = [
    'Content-Type: application/json',${!isAuth ? `\n    'Authorization: Bearer ${token || 'YOUR_BEARER_TOKEN'}'` : `\n    'Username: 0000aa-730c-0000',\n    'Password: YOUR_PASSWORD'`}
];

curl_setopt_array($curl, [
    CURLOPT_URL => "${baseUrl}${endpoint.path}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => "${endpoint.method}",
    CURLOPT_HTTPHEADER => $headers,${endpoint.method === 'POST' && bodyData ? `\n    CURLOPT_POSTFIELDS => '${JSON.stringify(bodyData)}',` : ''}
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    echo "cURL Error #:" . $err;
} else {
    echo $response;
}`;
}
