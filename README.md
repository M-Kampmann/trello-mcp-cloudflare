# Trello MCP Server on Cloudflare Workers

A Model Context Protocol (MCP) server that provides comprehensive Trello integration, deployed on Cloudflare Workers with secure authentication.

## 🚀 Live Deployment

**Server URL**: `https://trello-mcp-cloudflare-v2.matthias-51d.workers.dev`

**Endpoints**:
- **SSE Transport**: `/sse` (Server-Sent Events for persistent connections)
- **HTTP Transport**: `/mcp` (JSON-RPC over HTTP for simple requests)

## 🔧 Features

### Trello Operations Supported:
- **Boards**: List, get, create boards
- **Lists**: Get lists, create lists
- **Cards**: Get, create, update, move, delete cards
- **Comments**: Add and retrieve card comments
- **Labels**: Manage board labels and card labels
- **Members**: Manage board members and card assignments
- **Checklists**: Create checklists and manage checklist items
- **Search**: Search cards across your Trello workspace
- **Attachments**: Attach URLs to cards

## 🔐 Authentication

The server uses secure authentication with environment variables:

### Required Environment Variables:
- `TRELLO_API_KEY`: Your Trello API key ([Get it here](https://trello.com/app-key))
- `TRELLO_TOKEN`: Your Trello token ([Generate here](https://trello.com/app-key))
- `SHARED_SECRET`: Shared secret for MCP authentication

### Authentication Methods:
1. **URL Parameter**: `?secret=your_shared_secret`
2. **Authorization Header**: `Authorization: Bearer your_shared_secret`

## 📦 Setup & Deployment

### Prerequisites:
- Node.js 18+
- Cloudflare account
- Trello API credentials

### Local Development:
```bash
# Clone the repository
git clone https://github.com/M-Kampmann/trello-mcp-cloudflare.git
cd trello-mcp-cloudflare

# Install dependencies
npm install

# Copy environment variables template
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your actual credentials
# TRELLO_API_KEY=your_api_key
# TRELLO_TOKEN=your_token
# SHARED_SECRET=your_secret

# Start local development server
npm run dev
```

### Deploy to Cloudflare:
```bash
# Set production secrets
wrangler secret put TRELLO_API_KEY
wrangler secret put TRELLO_TOKEN
wrangler secret put SHARED_SECRET

# Deploy to Cloudflare Workers
npm run deploy
```

## 🔌 Usage Examples

### Test Authentication:
```bash
# Test with correct secret (should work)
curl "https://trello-mcp-cloudflare-v2.matthias-51d.workers.dev/sse?secret=your_secret"

# Test with wrong secret (should return 401)
curl "https://trello-mcp-cloudflare-v2.matthias-51d.workers.dev/sse?secret=wrong_secret"
```

### MCP Client Integration:
```bash
# Using mcp-remote proxy
npx mcp-remote https://trello-mcp-cloudflare-v2.matthias-51d.workers.dev/sse?secret=your_secret
```

## 🖥️ Claude Desktop Integration

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "trello": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://trello-mcp-cloudflare-v2.matthias-51d.workers.dev/sse?secret=your_shared_secret"
      ]
    }
  }
}
```

## 🛠️ Development

### Project Structure:
```
├── src/
│   └── index.ts          # Main MCP server implementation
├── wrangler.toml         # Cloudflare Workers configuration
├── package.json          # Dependencies and scripts
├── .dev.vars.example     # Environment variables template
└── README.md            # This file
```

### Available Tools:
- `listBoards` - Get all accessible boards
- `getBoard` - Get specific board details
- `createBoard` - Create a new board
- `getLists` - Get lists from a board
- `createList` - Create a new list
- `getCards` - Get cards from a list
- `getBoardCards` - Get all cards from a board
- `getCard` - Get specific card details
- `createCard` - Create a new card
- `updateCard` - Update card properties
- `moveCard` - Move card between lists
- `deleteCard` - Delete a card
- `addComment` - Add comment to card
- `getComments` - Get card comments
- `addLabel` - Add label to card
- `removeLabel` - Remove label from card
- `getBoardLabels` - Get board labels
- `createLabel` - Create new label
- `addMemberToCard` - Assign member to card
- `removeMemberFromCard` - Remove member from card
- `getBoardMembers` - Get board members
- `createChecklist` - Create checklist on card
- `addChecklistItem` - Add item to checklist
- `getCardChecklists` - Get card checklists
- `searchCards` - Search cards by query
- `attachUrlToCard` - Attach URL to card
- `getCurrentUser` - Get current user info
- `archiveListCards` - Archive all cards in list

## 🔒 Security

- All API credentials are stored as Cloudflare Workers secrets
- Authentication required for all endpoints
- CORS properly configured for web clients
- No sensitive data exposed in logs

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🐛 Troubleshooting

### Common Issues:

**Authentication Errors**:
- Verify your `SHARED_SECRET` is set correctly
- Check that Trello API credentials are valid
- Ensure you're using the correct URL parameter format

**Connection Issues**:
- Verify the server URL is accessible
- Check that CORS headers are properly set
- Test with curl first before using MCP clients

**Deployment Issues**:
- Ensure all secrets are set in Cloudflare Workers
- Check wrangler.toml configuration
- Verify Node.js compatibility settings

For more help, check the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/) or [MCP specification](https://modelcontextprotocol.io/).
