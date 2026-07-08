# n8n-nodes-templateson

This is an n8n community node. It lets you use [Templates On](https://templateson.com) in your n8n workflows.

Templates On is an image, PDF, carousel and video generation API. You design a template once (with the AI designer or the drag-and-drop editor), then call the API with dynamic data to generate a PNG image, a PDF document, a multi-slide carousel, a bulk batch, or an MP4 video on the fly.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Usage](#usage)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In a self-hosted n8n: **Settings → Community Nodes → Install**, then enter `n8n-nodes-templateson`.

## Operations

### Image
- **Generate** — render a PNG.
  - *From Template*: pick a template (by list, name, or ID) and supply its parameters.
  - *From Text*: generate a simple image from text + styling, no template needed.

### PDF
- **Generate** — same as Image, but returns a PDF.

### Carousel
- **Generate** — render a **multi-page** template into an ordered set of slide images (one per page). Output as separate binary items (`data0`, `data1`, …) or a base64 slides array. Counts as one bulk job.

### Bulk
- **Generate Images / Generate PDFs** — render one template against a **Records** array (one JSON object per output, max 1000). Returns one binary item per record. Counts as one bulk job regardless of record count.

### Video
- **Generate** — render an MP4. *Slideshow* mode shows each slide for N seconds; *Motion* mode animates the template over a duration (the API injects `__frame`/`__frames`/`__t`/`__progress` params). Counts as one video job.

### Template
- **List** — list all templates accessible to your API key.
- **Get Fields** — discover the dynamic parameters a template accepts.

By default, generation outputs a **binary file** (ready for Google Drive, email attachments, Write Binary File, etc.). Switch **Output As** to *Base64 (JSON)* if you want the encoded string instead.

## Credentials

You need a Templates On API key.

1. Sign up at [templateson.com](https://templateson.com).
2. Go to [templateson.com/app/keys](https://templateson.com/app/keys) and click **Create New API Key**.
3. Copy the key (it starts with `son_key_`) and paste it into the **Templates On API** credential in n8n.

The credential is validated against the `/keys/validate` endpoint, which does **not** consume your API quota.

## Usage

**Generate a certificate PDF from a template:**

1. Add the **Templates On** node, set Resource = *PDF*, Operation = *Generate*, Mode = *From Template*.
2. Choose your template from the list.
3. Add parameters (e.g. `recipient_name`, `course_name`) — names must match the "Parameter Name" fields in the template editor.
4. Connect the binary output to **Google Drive** or **Send Email** (attachment).

Tip: use the **Template → Get Fields** operation first to discover exactly which parameters a template expects.

The node is also usable as an **AI Agent tool** (`usableAsTool`), so an agent can generate images/PDFs on demand.

## Resources

- [Templates On API docs](https://templateson.com)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## Development

```bash
npm install
npm run dev      # run n8n with this node hot-reloaded
npm run build    # compile to dist/
npm run lint     # lint
```

Requires Node.js v22+.

## License

[MIT](LICENSE.md)
