import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export interface Env {
  TRELLO_API_KEY: string;
  TRELLO_TOKEN: string;
  SHARED_SECRET: string;
}

interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  url: string;
}

interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  idBoard: string;
  pos: number;
}

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  idBoard: string;
  closed: boolean;
  url: string;
  due?: string;
  labels?: TrelloLabel[];
}

interface TrelloLabel {
  id: string;
  idBoard: string;
  name: string;
  color: string;
}

interface TrelloMember {
  id: string;
  fullName: string;
  username: string;
}

interface TrelloComment {
  id: string;
  data: {
    text: string;
    card: {
      id: string;
      name: string;
    };
  };
  date: string;
  memberCreator: {
    fullName: string;
  };
}

interface TrelloChecklist {
  id: string;
  name: string;
  idCard: string;
  checkItems: TrelloCheckItem[];
}

interface TrelloCheckItem {
  id: string;
  name: string;
  state: 'complete' | 'incomplete';
  pos: number;
}

// Define our MCP agent with Trello tools
export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "Trello MCP",
    version: "1.0.0",
  });

  async init() {
    // Helper for Trello API calls
    const trelloFetch = async (endpoint: string, method: string = 'GET', body?: any) => {
      const url = `https://api.trello.com/1${endpoint}`;
      const urlWithAuth = `${url}${url.includes('?') ? '&' : '?'}key=${(this as any).env.TRELLO_API_KEY}&token=${(this as any).env.TRELLO_TOKEN}`;
      
      const options: RequestInit = { method };
      if (body) {
        options.body = JSON.stringify(body);
        options.headers = { 'Content-Type': 'application/json' };
      }
      
      const response = await fetch(urlWithAuth, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Trello API error (${response.status}): ${errorText}`);
      }
      return response.json();
    };

    // Trello tools
    this.server.tool("listBoards", {}, async () => {
      const boards = await trelloFetch('/members/me/boards') as TrelloBoard[];
      return { content: [{ type: "text", text: JSON.stringify(boards) }] };
    });

    this.server.tool("getBoard", { boardId: z.string() }, async ({ boardId }) => {
      const board = await trelloFetch(`/boards/${boardId}`) as TrelloBoard;
      return { content: [{ type: "text", text: JSON.stringify(board) }] };
    });

    this.server.tool("createBoard", { name: z.string(), desc: z.string().optional() }, async ({ name, desc }) => {
      const board = await trelloFetch('/boards', 'POST', { name, desc }) as TrelloBoard;
      return { content: [{ type: "text", text: JSON.stringify(board) }] };
    });

    this.server.tool("getLists", { boardId: z.string() }, async ({ boardId }) => {
      const lists = await trelloFetch(`/boards/${boardId}/lists`) as TrelloList[];
      return { content: [{ type: "text", text: JSON.stringify(lists) }] };
    });

    this.server.tool("createList", { boardId: z.string(), name: z.string(), pos: z.string().optional() }, async ({ boardId, name, pos }) => {
      const list = await trelloFetch(`/lists`, 'POST', { idBoard: boardId, name, pos }) as TrelloList;
      return { content: [{ type: "text", text: JSON.stringify(list) }] };
    });

    this.server.tool("getCards", { listId: z.string() }, async ({ listId }) => {
      const cards = await trelloFetch(`/lists/${listId}/cards`) as TrelloCard[];
      return { content: [{ type: "text", text: JSON.stringify(cards) }] };
    });

    this.server.tool("getBoardCards", { boardId: z.string() }, async ({ boardId }) => {
      const cards = await trelloFetch(`/boards/${boardId}/cards`) as TrelloCard[];
      return { content: [{ type: "text", text: JSON.stringify(cards) }] };
    });

    this.server.tool("getCard", { cardId: z.string() }, async ({ cardId }) => {
      const card = await trelloFetch(`/cards/${cardId}`) as TrelloCard;
      return { content: [{ type: "text", text: JSON.stringify(card) }] };
    });

    this.server.tool("createCard", { listId: z.string(), name: z.string(), desc: z.string().optional(), due: z.string().optional(), pos: z.string().optional() }, async ({ listId, name, desc, due, pos }) => {
      const card = await trelloFetch('/cards', 'POST', { idList: listId, name, desc, due, pos }) as TrelloCard;
      return { content: [{ type: "text", text: JSON.stringify(card) }] };
    });

    this.server.tool("updateCard", { cardId: z.string(), updates: z.object({}).passthrough() }, async ({ cardId, updates }) => {
      const card = await trelloFetch(`/cards/${cardId}`, 'PUT', updates) as TrelloCard;
      return { content: [{ type: "text", text: JSON.stringify(card) }] };
    });

    this.server.tool("moveCard", { cardId: z.string(), listId: z.string(), pos: z.string().optional() }, async ({ cardId, listId, pos }) => {
      const card = await trelloFetch(`/cards/${cardId}`, 'PUT', { idList: listId, pos }) as TrelloCard;
      return { content: [{ type: "text", text: JSON.stringify(card) }] };
    });

    this.server.tool("deleteCard", { cardId: z.string() }, async ({ cardId }) => {
      await trelloFetch(`/cards/${cardId}`, 'DELETE');
      return { content: [{ type: "text", text: "Card deleted successfully" }] };
    });

    this.server.tool("addComment", { cardId: z.string(), text: z.string() }, async ({ cardId, text }) => {
      const comment = await trelloFetch(`/cards/${cardId}/actions/comments`, 'POST', { text }) as TrelloComment;
      return { content: [{ type: "text", text: JSON.stringify(comment) }] };
    });

    this.server.tool("getComments", { cardId: z.string() }, async ({ cardId }) => {
      const comments = await trelloFetch(`/cards/${cardId}/actions?filter=commentCard`) as TrelloComment[];
      return { content: [{ type: "text", text: JSON.stringify(comments) }] };
    });

    this.server.tool("addLabel", { cardId: z.string(), labelId: z.string() }, async ({ cardId, labelId }) => {
      await trelloFetch(`/cards/${cardId}/idLabels`, 'POST', { value: labelId });
      return { content: [{ type: "text", text: "Label added successfully" }] };
    });

    this.server.tool("removeLabel", { cardId: z.string(), labelId: z.string() }, async ({ cardId, labelId }) => {
      await trelloFetch(`/cards/${cardId}/idLabels/${labelId}`, 'DELETE');
      return { content: [{ type: "text", text: "Label removed successfully" }] };
    });

    this.server.tool("getBoardLabels", { boardId: z.string() }, async ({ boardId }) => {
      const labels = await trelloFetch(`/boards/${boardId}/labels`) as TrelloLabel[];
      return { content: [{ type: "text", text: JSON.stringify(labels) }] };
    });

    this.server.tool("createLabel", { boardId: z.string(), name: z.string(), color: z.string() }, async ({ boardId, name, color }) => {
      const label = await trelloFetch(`/labels`, 'POST', { idBoard: boardId, name, color }) as TrelloLabel;
      return { content: [{ type: "text", text: JSON.stringify(label) }] };
    });

    this.server.tool("addMemberToCard", { cardId: z.string(), memberId: z.string() }, async ({ cardId, memberId }) => {
      await trelloFetch(`/cards/${cardId}/idMembers`, 'POST', { value: memberId });
      return { content: [{ type: "text", text: "Member added successfully" }] };
    });

    this.server.tool("removeMemberFromCard", { cardId: z.string(), memberId: z.string() }, async ({ cardId, memberId }) => {
      await trelloFetch(`/cards/${cardId}/idMembers/${memberId}`, 'DELETE');
      return { content: [{ type: "text", text: "Member removed successfully" }] };
    });

    this.server.tool("getBoardMembers", { boardId: z.string() }, async ({ boardId }) => {
      const members = await trelloFetch(`/boards/${boardId}/members`) as TrelloMember[];
      return { content: [{ type: "text", text: JSON.stringify(members) }] };
    });

    this.server.tool("createChecklist", { cardId: z.string(), name: z.string() }, async ({ cardId, name }) => {
      const checklist = await trelloFetch(`/checklists`, 'POST', { idCard: cardId, name }) as TrelloChecklist;
      return { content: [{ type: "text", text: JSON.stringify(checklist) }] };
    });

    this.server.tool("addChecklistItem", { checklistId: z.string(), name: z.string(), checked: z.boolean().optional() }, async ({ checklistId, name, checked }) => {
      const item = await trelloFetch(`/checklists/${checklistId}/checkItems`, 'POST', { name, checked: checked ? 'true' : 'false' }) as TrelloCheckItem;
      return { content: [{ type: "text", text: JSON.stringify(item) }] };
    });

    this.server.tool("getCardChecklists", { cardId: z.string() }, async ({ cardId }) => {
      const checklists = await trelloFetch(`/cards/${cardId}/checklists`) as TrelloChecklist[];
      return { content: [{ type: "text", text: JSON.stringify(checklists) }] };
    });

    this.server.tool("searchCards", { query: z.string(), limit: z.number().optional() }, async ({ query, limit }) => {
      const params = new URLSearchParams({ query, modelTypes: 'cards', partial: 'true' });
      if (limit) params.append('cards_limit', limit.toString());
      const result = await trelloFetch(`/search?${params.toString()}`) as { cards: TrelloCard[] };
      return { content: [{ type: "text", text: JSON.stringify(result.cards) }] };
    });

    this.server.tool("attachUrlToCard", { cardId: z.string(), url: z.string(), name: z.string().optional() }, async ({ cardId, url, name }) => {
      const attachment = await trelloFetch(`/cards/${cardId}/attachments`, 'POST', { url, name });
      return { content: [{ type: "text", text: JSON.stringify(attachment) }] };
    });

    this.server.tool("getCurrentUser", {}, async () => {
      const user = await trelloFetch('/members/me') as TrelloMember;
      return { content: [{ type: "text", text: JSON.stringify(user) }] };
    });

    this.server.tool("archiveListCards", { listId: z.string() }, async ({ listId }) => {
      await trelloFetch(`/lists/${listId}/archiveAllCards`, 'POST');
      return { content: [{ type: "text", text: "All cards archived successfully" }] };
    });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Authentication check
    const secretFromQuery = url.searchParams.get('secret');
    const secretFromHeader = request.headers.get('Authorization')?.replace('Bearer ', '');
    const providedSecret = secretFromQuery || secretFromHeader;
    if (!providedSecret || providedSecret !== env.SHARED_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'no-cache, no-transform',
        }
      });
    }

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      const response = await MyMCP.serve("/mcp").fetch(request, env, ctx);
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Cache-Control', 'no-cache, no-transform');
      return response;
    }

    // Handle Fusebase test-connection
    if (request.method === 'POST' && url.pathname.endsWith('/sse')) {
      return new Response(null, { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  },
};
