/**
 * Static registry of public MCP servers.
 *
 * Package names and tool lists reflect real, published Model Context Protocol
 * servers. Star counts are indicative popularity figures for layout purposes —
 * swap this module for a live registry fetch when one is available.
 */

export type McpCategory =
  | 'filesystem'
  | 'database'
  | 'api'
  | 'devtools'
  | 'productivity'
  | 'ai';

export type McpStatus = 'stable' | 'beta';

export interface McpServer {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: McpCategory;
  tools: string[];
  transport: 'stdio' | 'sse' | 'http';
  install: string;
  stars: number;
  verified: boolean;
  status: McpStatus;
  config: {
    json: string;
    yaml: string;
  };
}

export const CATEGORY_LABELS: Record<McpCategory | 'all', string> = {
  all: 'All',
  filesystem: 'Filesystem',
  database: 'Database',
  api: 'API',
  devtools: 'Dev Tools',
  productivity: 'Productivity',
  ai: 'AI / ML',
};

export const MCP_SERVERS: McpServer[] = [
  {
    id: 1,
    name: 'filesystem',
    displayName: 'Filesystem',
    description:
      'Read, write, search, and manage files and directories on your local machine with granular path controls.',
    category: 'filesystem',
    tools: ['read_file', 'write_file', 'list_dir', 'search_files', 'move_file', 'get_info'],
    transport: 'stdio',
    install: 'npx -y @modelcontextprotocol/server-filesystem /path/to/dir',
    stars: 2840,
    verified: true,
    status: 'stable',
    config: {
      json: `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/you/projects"
      ]
    }
  }
}`,
      yaml: `mcpServers:
  filesystem:
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-filesystem"
      - "/Users/you/projects"`,
    },
  },
  {
    id: 2,
    name: 'postgres',
    displayName: 'PostgreSQL',
    description:
      'Query, inspect, and manage PostgreSQL databases. Read-only by default with optional write access.',
    category: 'database',
    tools: ['query', 'list_tables', 'describe_table', 'list_schemas'],
    transport: 'stdio',
    install: 'npx -y @modelcontextprotocol/server-postgres',
    stars: 1920,
    verified: true,
    status: 'stable',
    config: {
      json: `{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:pass@localhost:5432/mydb"
      ]
    }
  }
}`,
      yaml: `mcpServers:
  postgres:
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-postgres"
      - "postgresql://user:pass@localhost:5432/mydb"`,
    },
  },
  {
    id: 3,
    name: 'github',
    displayName: 'GitHub',
    description:
      'Interact with repos, issues, PRs, and workflows. Full GitHub API coverage with fine-grained token scoping.',
    category: 'devtools',
    tools: [
      'create_issue',
      'list_repos',
      'get_pr',
      'merge_pr',
      'search_code',
      'create_pr',
      'list_issues',
      'add_comment',
    ],
    transport: 'stdio',
    install: 'npx -y @modelcontextprotocol/server-github',
    stars: 3150,
    verified: true,
    status: 'stable',
    config: {
      json: `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
      }
    }
  }
}`,
      yaml: `mcpServers:
  github:
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-github"
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."`,
    },
  },
  {
    id: 4,
    name: 'brave-search',
    displayName: 'Brave Search',
    description:
      "Web and local search powered by Brave's independent index. Privacy-first search results for your agent.",
    category: 'api',
    tools: ['web_search', 'local_search'],
    transport: 'stdio',
    install: 'npx -y @modelcontextprotocol/server-brave-search',
    stars: 1540,
    verified: true,
    status: 'stable',
    config: {
      json: `{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your-api-key"
      }
    }
  }
}`,
      yaml: `mcpServers:
  brave-search:
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-brave-search"
    env:
      BRAVE_API_KEY: "your-api-key"`,
    },
  },
  {
    id: 5,
    name: 'notion',
    displayName: 'Notion',
    description:
      'Read, search, and manage your Notion workspace. Access pages, databases, and blocks programmatically.',
    category: 'productivity',
    tools: ['search', 'get_page', 'create_page', 'update_page', 'query_database', 'get_block_children'],
    transport: 'stdio',
    install: 'npx -y @notionhq/notion-mcp-server',
    stars: 980,
    verified: false,
    status: 'beta',
    config: {
      json: `{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "OPENAPI_MCP_TOKEN": "ntn_..."
      }
    }
  }
}`,
      yaml: `mcpServers:
  notion:
    command: npx
    args:
      - "-y"
      - "@notionhq/notion-mcp-server"
    env:
      OPENAPI_MCP_TOKEN: "ntn_..."`,
    },
  },
  {
    id: 6,
    name: 'huggingface',
    displayName: 'Hugging Face',
    description:
      'Run inference, search models, and interact with the Hub. Access 500k+ models directly from your agent.',
    category: 'ai',
    tools: [
      'text_generation',
      'image_classification',
      'search_models',
      'download_model',
      'feature_extraction',
    ],
    transport: 'stdio',
    install: 'npx -y @huggingface/mcp-server',
    stars: 720,
    verified: false,
    status: 'beta',
    config: {
      json: `{
  "mcpServers": {
    "huggingface": {
      "command": "npx",
      "args": ["-y", "@huggingface/mcp-server"],
      "env": {
        "HF_TOKEN": "hf_..."
      }
    }
  }
}`,
      yaml: `mcpServers:
  huggingface:
    command: npx
    args:
      - "-y"
      - "@huggingface/mcp-server"
    env:
      HF_TOKEN: "hf_..."`,
    },
  },
  {
    id: 7,
    name: 'puppeteer',
    displayName: 'Puppeteer',
    description:
      "Browser automation for navigation, screenshots, clicking, and form filling. Headless Chrome at your agent's fingertips.",
    category: 'devtools',
    tools: ['navigate', 'screenshot', 'click', 'fill', 'evaluate', 'get_console_logs'],
    transport: 'stdio',
    install: 'npx -y @modelcontextprotocol/server-puppeteer',
    stars: 2100,
    verified: true,
    status: 'stable',
    config: {
      json: `{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ]
    }
  }
}`,
      yaml: `mcpServers:
  puppeteer:
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-puppeteer"`,
    },
  },
  {
    id: 8,
    name: 'redis',
    displayName: 'Redis',
    description:
      'Get, set, and manage keys in Redis. Supports strings, hashes, lists, sets, and sorted sets out of the box.',
    category: 'database',
    tools: ['get', 'set', 'del', 'keys', 'hgetall', 'lrange', 'smembers'],
    transport: 'stdio',
    install: 'npx -y @modelcontextprotocol/server-redis',
    stars: 640,
    verified: false,
    status: 'stable',
    config: {
      json: `{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-redis",
        "redis://localhost:6379"
      ]
    }
  }
}`,
      yaml: `mcpServers:
  redis:
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-redis"
      - "redis://localhost:6379"`,
    },
  },
  {
    id: 9,
    name: 'slack',
    displayName: 'Slack',
    description:
      'Send messages, manage channels, and search your workspace. Keep your team in the loop, automatically.',
    category: 'productivity',
    tools: ['send_message', 'list_channels', 'search_messages', 'get_channel_history', 'set_status'],
    transport: 'stdio',
    install: 'npx -y @modelcontextprotocol/server-slack',
    stars: 1180,
    verified: true,
    status: 'stable',
    config: {
      json: `{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-...",
        "SLACK_TEAM_ID": "T0..."
      }
    }
  }
}`,
      yaml: `mcpServers:
  slack:
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-slack"
    env:
      SLACK_BOT_TOKEN: "xoxb-..."
      SLACK_TEAM_ID: "T0..."`,
    },
  },
];
