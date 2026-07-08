# Templates On — Integration Guide

> Build integrations with the Templates On API at [templateson.com](https://templateson.com)

## What is Templates On?

Templates On is an image, PDF, carousel, and video generation API. You design a template once (using the AI designer or the drag-and-drop visual editor), then call the API with your dynamic data to generate a PNG image, a PDF document, a multi-slide carousel, an MP4 video, or a bulk batch of any of these on the fly.

**Common use cases:**
- Social media posts, banners, thumbnails, and multi-slide carousels
- Certificates and badges
- Invoices, receipts, and reports
- Personalized marketing materials at scale (bulk)
- Short marketing / product videos (slideshow or motion)
- Automated document workflows (Zapier, Make, n8n)

**What you can generate:**

| Output | Endpoint | Meter |
|---|---|---|
| PNG image | `/image` | API request |
| PDF document | `/pdf` | API request |
| Carousel (N slides from a multi-page template) | `/carousel` | Bulk job |
| Bulk images (N records → N PNGs) | `/bulk-image` | Bulk job |
| Bulk PDFs (N records → N PDFs) | `/bulk-pdf` | Bulk job |
| MP4 video (slideshow or motion) | `/video` | Video job |

> `image`/`pdf` draw from your monthly **API request** allowance. `carousel`/`bulk-*` each count as **one bulk job** regardless of how many outputs they produce. `video` draws from a separate **video job** allowance. See [Rate Limits & Metering](#rate-limits--metering).

**Base URL:** `https://templateson.com/api/v1`

---

## Authentication

Every API request must include your API key. There are two supported header formats:

**Option 1 — X-API-Key header (recommended):**
```
X-API-Key: son_key_your_key_here
```

**Option 2 — Authorization Bearer:**
```
Authorization: Bearer son_key_your_key_here
```

### Getting an API Key

1. Sign up at [templateson.com](https://templateson.com)
2. Go to [templateson.com/app/keys](https://templateson.com/app/keys)
3. Click **Create New API Key**, give it a label
4. Copy the key — it starts with `son_key_` followed by a 64-character hex string

Keys can be revoked and recreated at any time from the dashboard.

---

## Endpoints

### 1. Generate Image (PNG)

```
GET  https://templateson.com/api/v1/image
POST https://templateson.com/api/v1/image
```

Generates a PNG image. Use `GET` for simple requests with query parameters; use `POST` with a JSON body when passing large base64 image values as template parameters.

#### Mode A — Template mode (recommended)

Use a template you created in the dashboard. The template defines the layout, fonts, and dimensions. You supply the dynamic values.

**GET (query parameters):**
```bash
curl "https://templateson.com/api/v1/image?templateId=YOUR_TEMPLATE_ID&title=Hello%20World&subtitle=Dynamic%20content" \
  -H "X-API-Key: son_key_your_key_here" \
  --output image.png
```

**POST (JSON body):**
```bash
curl -X POST https://templateson.com/api/v1/image \
  -H "X-API-Key: son_key_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "YOUR_TEMPLATE_ID",
    "params": {
      "title": "Hello World",
      "subtitle": "Dynamic content",
      "date": "2024-01-15"
    }
  }' \
  --output image.png
```

**Template parameters:**

Parameters match the names you set in the template editor ("Parameter Name" field on each object):

| Parameter type | How to pass |
|---|---|
| Text field | Plain string: `"title": "Hello World"` |
| Image field | URL: `"logo": "https://example.com/logo.png"` or base64 data URI |

Two styles of passing params are supported (both work, `params` object takes precedence):
- **Flat** (GET-friendly): `?templateId=xxx&title=Hello&logo=https://...`
- **Nested object** (POST body, preferred for integrations): `{ "templateId": "xxx", "params": { "title": "Hello" } }`

**Template access rules:**
- Public templates: accessible by any valid API key
- Private templates: only accessible by the API key that belongs to the template owner

#### Mode B — Query parameter mode (no template needed)

Generate a simple image from scratch with text and styling. No template required.

```bash
curl "https://templateson.com/api/v1/image?content=Hello%20World&width=1200&height=630&backgroundColor=%233B82F6&color=%23ffffff&fontSize=48" \
  -H "X-API-Key: son_key_your_key_here" \
  --output image.png
```

**Parameters:**

| Parameter | Type | Default | Constraints | Description |
|---|---|---|---|---|
| `content` | string | `"Hello World"` | max 10,000 chars | Text to display |
| `width` | integer | `800` | 10–10,000 px | Image width |
| `height` | integer | `600` | 10–10,000 px | Image height |
| `fontSize` | integer | `32` | 1–500 | Font size in px |
| `fontWeight` | integer | `400` | 100,200,...,900 | Font weight |
| `color` | string | `"#000000"` | Hex color | Text color |
| `backgroundColor` | string | `"#ffffff"` | Hex color | Background color |
| `padding` | integer | `40` | 0–500 | Padding in px |
| `textAlign` | string | `"center"` | left, center, right | Text alignment |

> Total pixels (width × height) cannot exceed 25,000,000.

#### Response

By default returns a binary PNG (`Content-Type: image/png`).

To get a JSON response with base64-encoded data (useful for Zapier/Make), add `format=json` or set `Accept: application/json`:

```json
{
  "success": true,
  "format": "png",
  "size": 45678,
  "data": "iVBORw0KGgoAAAANSUhEUgAA...",
  "width": 1200,
  "height": 630
}
```

---

### 2. Generate PDF

```
GET  https://templateson.com/api/v1/pdf
POST https://templateson.com/api/v1/pdf
```

Same interface as the image endpoint — supports both template mode and query parameter mode.

**Template mode (POST):**
```bash
curl -X POST https://templateson.com/api/v1/pdf \
  -H "X-API-Key: son_key_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "YOUR_TEMPLATE_ID",
    "params": {
      "recipient_name": "Jane Smith",
      "course_name": "Advanced Web Development",
      "completion_date": "March 15, 2024",
      "certificate_id": "CERT-2024-12345"
    }
  }' \
  --output certificate.pdf
```

**Query parameter mode (GET):**
```bash
curl "https://templateson.com/api/v1/pdf?content=Invoice%20%231234&width=800&height=1100" \
  -H "X-API-Key: son_key_your_key_here" \
  --output invoice.pdf
```

All parameters are identical to the image endpoint. See the table above.

**Response:** Binary PDF (`Content-Type: application/pdf`, `Content-Disposition: inline; filename="template.pdf"`).

JSON response also supported via `format=json` or `Accept: application/json`:

```json
{
  "success": true,
  "format": "pdf",
  "size": 123456,
  "data": "JVBERi0xLjcKCjEgMC...",
  "width": 800,
  "height": 1100
}
```

---

### 3. Generate Carousel (multi-slide)

```
POST https://templateson.com/api/v1/carousel
```

Renders a **multi-page template** into an ordered set of slide images (e.g. an Instagram/LinkedIn carousel). The template must have more than one page — add pages in the editor first. Counts as **one bulk job**.

```bash
curl -X POST https://templateson.com/api/v1/carousel \
  -H "X-API-Key: son_key_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "YOUR_MULTIPAGE_TEMPLATE_ID",
    "params": { "title": "5 Tips", "author": "Jane" }
  }'
```

**Body:**

| Field | Type | Description |
|---|---|---|
| `templateId` | string | A multi-page template ID (required) |
| `params` | object | Dynamic values applied to every slide |
| `format` | string | `image` (default) → JSON with base64 slides, or `zip` → a `carousel.zip` download |

**Response (`format: image`, default):**
```json
{
  "success": true,
  "format": "image",
  "count": 5,
  "slides": ["iVBORw0KGgo...", "iVBORw0KGgo...", "..."]
}
```

Each entry in `slides` is a base64-encoded PNG, in page order. With `format=zip` the response is a binary ZIP (`slide-1.png`, `slide-2.png`, …).

> `400 Not A Carousel Template` if the template has only one page.

---

### 4. Bulk Generate (images or PDFs)

```
POST https://templateson.com/api/v1/bulk-image
POST https://templateson.com/api/v1/bulk-pdf
```

Render **one template against N records** in a single call — N PNGs (`bulk-image`) or N PDFs (`bulk-pdf`). Ideal for personalized certificates, badges, or marketing assets at scale. The whole call counts as **one bulk job**, no matter how many records.

```bash
curl -X POST https://templateson.com/api/v1/bulk-image \
  -H "X-API-Key: son_key_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "YOUR_TEMPLATE_ID",
    "records": [
      { "name": "Alice", "score": "98" },
      { "name": "Bob",   "score": "91" },
      { "name": "Carol", "score": "87" }
    ]
  }'
```

**Body:**

| Field | Type | Description |
|---|---|---|
| `templateId` | string | Template ID (required; `template_id` also accepted) |
| `records` | array | One object of params per output. Max **1000** records per request. |
| `destination` | object | Optional — deliver outputs to Drive / email / webhook / storage instead of returning them (requires the destinations feature) |

**Response:**
```json
{
  "success": true,
  "format": "png",
  "count": 3,
  "slices": ["iVBORw0KGgo...", "iVBORw0KGgo...", "iVBORw0KGgo..."]
}
```

`slices` holds one base64 output per input record, in order (`png` for `bulk-image`, `pdf` for `bulk-pdf`). When a `destination` is supplied the outputs are delivered there instead and the response returns `urls` (plus `jobs_used` / `jobs_remaining`) rather than `slices`.

> For jobs larger than 1000 records, split into multiple calls.

---

### 5. Generate Video (MP4)

```
POST https://templateson.com/api/v1/video
```

Renders an MP4 from a template. Counts as **one video job** (separate allowance from API requests and bulk jobs). Two modes:

**Slideshow** (default) — each slide is one frame shown for `duration` seconds:
```bash
curl -X POST https://templateson.com/api/v1/video \
  -H "X-API-Key: son_key_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "YOUR_TEMPLATE_ID",
    "mode": "slideshow",
    "fps": 30,
    "slides": [
      { "params": { "title": "Slide 1" }, "duration": 3 },
      { "params": { "title": "Slide 2" }, "duration": 2 }
    ]
  }' \
  --output video.mp4
```

**Motion** — samples the template `fps × duration` times; each frame receives motion params (`__frame`, `__frames`, `__t`, `__progress`) the template animates off:
```bash
curl -X POST https://templateson.com/api/v1/video \
  -H "X-API-Key: son_key_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "YOUR_TEMPLATE_ID",
    "mode": "motion",
    "fps": 30,
    "duration": 5,
    "params": { "title": "Animated" }
  }' \
  --output video.mp4
```

**Body:**

| Field | Type | Description |
|---|---|---|
| `templateId` | string | Template ID (required) |
| `mode` | string | `slideshow` (default) or `motion` |
| `fps` | integer | Frames per second (default 30; within the API's min/max) |
| `slides` | array | Slideshow mode: `[{ params?, duration? }]` (duration defaults to 3s) |
| `duration` | number | Motion mode: total length in seconds (required, > 0) |
| `params` | object | Motion mode: values applied to every frame |

**Response:** binary MP4 (`Content-Type: video/mp4`).

---

### 6. List Accessible Templates

```
GET https://templateson.com/api/v1/templates/list
```

Returns all templates accessible to your API key — your own templates (public and private) plus any templates marked public by other users.

```bash
curl "https://templateson.com/api/v1/templates/list" \
  -H "X-API-Key: son_key_your_key_here"
```

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Blog Header",
      "is_public": false
    },
    {
      "id": "uuid",
      "name": "Certificate Template",
      "is_public": true
    }
  ]
}
```

Use this to find template IDs to pass to the image/PDF generation endpoints.

---

### 7. Get Template Fields

```
GET https://templateson.com/api/v1/templates/:id/fields
```

Returns the list of dynamic parameters defined in a template. Use this to discover what parameters a template accepts before calling the generation endpoints.

```bash
curl "https://templateson.com/api/v1/templates/YOUR_TEMPLATE_ID/fields" \
  -H "X-API-Key: son_key_your_key_here"
```

**Response:**
```json
{
  "template_id": "uuid",
  "template_name": "Blog Header",
  "fields": [
    { "title": "title", "type": "text" },
    { "title": "author", "type": "text" },
    { "title": "profile_image", "type": "image" }
  ]
}
```

`type` is either `"text"` or `"image"`. Access rules are the same as the generation endpoints (public or owned template).

---

### 8. Validate API Key

```
POST https://templateson.com/api/v1/keys/validate
```

Validates an API key and returns its label and owner information. Useful for verifying a key is active before making generation requests, or for displaying key details in your integration.

```bash
curl -X POST https://templateson.com/api/v1/keys/validate \
  -H "X-API-Key: son_key_your_key_here"
```

The key can be passed via header or request body:

```bash
curl -X POST https://templateson.com/api/v1/keys/validate \
  -H "Content-Type: application/json" \
  -d '{ "key": "son_key_your_key_here" }'
```

**Response (valid key):**
```json
{
  "valid": true,
  "message": "API key is valid",
  "key_info": {
    "id": "uuid",
    "prefix": "son_key",
    "label": "My Integration Key",
    "created_at": "2024-01-15T10:00:00Z",
    "last_used_at": "2024-03-20T14:30:00Z",
    "owner": {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  }
}
```

**Response (invalid or revoked key):**
```json
{
  "valid": false,
  "message": "Invalid or revoked API key"
}
```

This endpoint does **not** consume API request quota.

---

## Templates (dashboard context)

Templates are created and managed via the dashboard at [templateson.com/app/templates](https://templateson.com/app/templates). The API key endpoints are for generation only — template CRUD is done through the dashboard UI.

**To get a template ID:**
1. Open the template in the editor
2. Copy the UUID from the URL: `templateson.com/app/templates/YOUR_TEMPLATE_ID`

**Variable syntax in templates:** Use `{{variable_name}}` in text objects in the editor, then set a "Parameter Name" to expose it to the API.

---

## Error Handling

All errors return JSON:

```json
{
  "statusCode": 400,
  "statusMessage": "Bad Request",
  "message": "Validation failed: width must be between 10 and 10000 pixels"
}
```

| Status | Meaning |
|---|---|
| `400` | Invalid parameters or malformed request |
| `401` | Missing or invalid API key |
| `403` | Template is private and not owned by your key |
| `404` | Template not found |
| `413` | Generated file exceeds 10 MB limit |
| `429` | Usage limit reached (API request, bulk, or video allowance) |
| `500` | Server-side rendering error |
| `503` | Rendering service temporarily unavailable |
| `504` | Request timed out (30s limit — reduce complexity) |

**401 example:**
```json
{
  "statusCode": 401,
  "statusMessage": "Authentication Failed",
  "message": "Invalid or missing API key. Please provide a valid API key via X-API-Key header or Authorization: Bearer <key>"
}
```

---

## Rate Limits & Metering

Limits are determined by your subscription plan. There are **three independent allowances**, each with its own counter — exhausting one does not affect the others. When any is exceeded, the relevant endpoint returns a `429`.

| Meter | Endpoints it covers | Counts as |
|---|---|---|
| **API requests** | `/image`, `/pdf` | 1 per call |
| **Bulk jobs** | `/carousel`, `/bulk-image`, `/bulk-pdf` | 1 per call (any N outputs) |
| **Video jobs** | `/video` | 1 per call (any frame count) |

Each meter has a **monthly** cap and may also have a **daily** cap, both set per plan (and adjustable per account by the Templates On team). For the exact numbers on your plan, don't hardcode them — read them live:

```bash
curl "https://templateson.com/api/v1/subscription/usage" \
  -H "X-API-Key: son_key_your_key_here"
```

This returns your current usage and remaining allowance for each meter (`monthly_remaining`, `daily_limit`, `monthly_bulk_remaining`, `monthly_video_remaining`, …). Published plan tiers are on the [pricing page](https://templateson.com/pricing).

Response headers on generation calls also indicate your status:
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9500
X-RateLimit-Reset: 1640995200
```

---

## Code Examples

### Node.js / TypeScript — Generate image and save to file

```typescript
const apiKey = 'son_key_your_key_here';

const response = await fetch('https://templateson.com/api/v1/image', {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    templateId: 'your-template-id',
    params: {
      title: 'Hello World',
      subtitle: 'Generated with Node.js',
    },
  }),
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(`API error ${response.status}: ${error.message}`);
}

const buffer = Buffer.from(await response.arrayBuffer());
fs.writeFileSync('output.png', buffer);
```

### Node.js — Get base64 response (for embedding or passing to another service)

```typescript
const response = await fetch('https://templateson.com/api/v1/image', {
  method: 'POST',
  headers: {
    'X-API-Key': 'son_key_your_key_here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    templateId: 'your-template-id',
    format: 'json',
    params: { title: 'Hello' },
  }),
});

const { data, width, height } = await response.json();
// data is a base64-encoded PNG string
```

### Python — Generate PDF

```python
import requests

response = requests.post(
    'https://templateson.com/api/v1/pdf',
    headers={
        'X-API-Key': 'son_key_your_key_here',
        'Content-Type': 'application/json',
    },
    json={
        'templateId': 'your-template-id',
        'params': {
            'recipient_name': 'Jane Smith',
            'course_name': 'Advanced Web Development',
            'completion_date': 'March 15, 2024',
        },
    },
)

response.raise_for_status()

with open('certificate.pdf', 'wb') as f:
    f.write(response.content)
```

### Python — Discover template fields first, then generate

```python
import requests

api_key = 'son_key_your_key_here'
template_id = 'your-template-id'
headers = {'X-API-Key': api_key}

# 1. Find out what params the template needs
fields_response = requests.get(
    f'https://templateson.com/api/v1/templates/{template_id}/fields',
    headers=headers,
)
fields = fields_response.json()['fields']
print(fields)  # [{"title": "name", "type": "text"}, ...]

# 2. Generate the image
image_response = requests.post(
    'https://templateson.com/api/v1/image',
    headers={**headers, 'Content-Type': 'application/json'},
    json={
        'templateId': template_id,
        'params': {'name': 'John Doe'},
    },
)
image_response.raise_for_status()

with open('output.png', 'wb') as f:
    f.write(image_response.content)
```

---

## Links

- Dashboard: [templateson.com/app](https://templateson.com/app)
- API Keys: [templateson.com/app/keys](https://templateson.com/app/keys)
- Templates: [templateson.com/app/templates](https://templateson.com/app/templates)
- Pricing: [templateson.com/pricing](https://templateson.com/pricing)
- Support: [support@templateson.com](mailto:support@templateson.com)
