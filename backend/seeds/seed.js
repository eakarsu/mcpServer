const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../../.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mcp_server',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  console.log('Seeding database...');

  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mcp_servers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      endpoint VARCHAR(500),
      protocol VARCHAR(50) DEFAULT 'stdio',
      status VARCHAR(50) DEFAULT 'active',
      description TEXT,
      auth_type VARCHAR(50) DEFAULT 'none',
      max_connections INT DEFAULT 10,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tools (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      input_schema JSONB DEFAULT '{}',
      server_id INT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS agents (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      model VARCHAR(255),
      system_prompt TEXT,
      temperature FLOAT DEFAULT 0.7,
      max_tokens INT DEFAULT 4096,
      tools JSONB DEFAULT '[]',
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      content TEXT,
      category VARCHAR(100),
      variables JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS resources (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      uri VARCHAR(500),
      type VARCHAR(100),
      description TEXT,
      mime_type VARCHAR(100),
      server_id INT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      steps JSONB DEFAULT '[]',
      trigger_type VARCHAR(50) DEFAULT 'manual',
      status VARCHAR(50) DEFAULT 'active',
      schedule VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS knowledge_base (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      category VARCHAR(100),
      tags JSONB DEFAULT '[]',
      source VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tool_executions (
      id SERIAL PRIMARY KEY,
      tool_name VARCHAR(255),
      agent_name VARCHAR(255),
      input_data JSONB DEFAULT '{}',
      output_data JSONB DEFAULT '{}',
      status VARCHAR(50) DEFAULT 'success',
      duration_ms INT DEFAULT 0,
      executed_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      agent_name VARCHAR(255),
      model VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS conversation_messages (
      id SERIAL PRIMARY KEY,
      conversation_id INT REFERENCES conversations(id),
      role VARCHAR(50),
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      action VARCHAR(255),
      entity_type VARCHAR(100),
      entity_id VARCHAR(100),
      details JSONB DEFAULT '{}',
      level VARCHAR(50) DEFAULT 'info',
      user_email VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      api_key VARCHAR(500),
      key_prefix VARCHAR(50),
      permissions JSONB DEFAULT '["read"]',
      status VARCHAR(50) DEFAULT 'active',
      expires_at TIMESTAMP,
      last_used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS webhooks (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      url VARCHAR(500),
      events JSONB DEFAULT '[]',
      secret VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      headers JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS models (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      provider VARCHAR(100),
      model_id VARCHAR(255),
      description TEXT,
      context_window INT DEFAULT 128000,
      max_tokens INT DEFAULT 4096,
      pricing_input VARCHAR(50),
      pricing_output VARCHAR(50),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) UNIQUE,
      value TEXT,
      category VARCHAR(100),
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed Users
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(`DELETE FROM users`);
  await pool.query(`INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)`, ['admin@mcpserver.com', hash, 'Admin User', 'admin']);

  // Seed MCP Servers (15 items)
  await pool.query(`DELETE FROM mcp_servers`);
  const servers = [
    ['File System Server', 'stdio:///usr/local/bin/mcp-fs', 'stdio', 'active', 'Provides file system access tools for reading, writing, and managing files', 'none', 10],
    ['GitHub Server', 'https://mcp-github.example.com', 'sse', 'active', 'GitHub integration for repo management, PR reviews, and issue tracking', 'bearer', 25],
    ['PostgreSQL Server', 'stdio:///usr/local/bin/mcp-postgres', 'stdio', 'active', 'Database operations including queries, schema management, and migrations', 'none', 15],
    ['Slack Server', 'https://mcp-slack.example.com', 'sse', 'active', 'Slack workspace integration for messaging and channel management', 'oauth2', 20],
    ['Docker Server', 'stdio:///usr/local/bin/mcp-docker', 'stdio', 'active', 'Container management including build, run, and orchestration', 'none', 8],
    ['Kubernetes Server', 'https://mcp-k8s.example.com', 'sse', 'active', 'Kubernetes cluster management and deployment operations', 'bearer', 12],
    ['AWS Server', 'https://mcp-aws.example.com', 'sse', 'active', 'AWS cloud services including S3, Lambda, and EC2 management', 'api_key', 30],
    ['Email Server', 'stdio:///usr/local/bin/mcp-email', 'stdio', 'active', 'Email sending and inbox management via SMTP/IMAP', 'basic', 5],
    ['Web Scraper Server', 'https://mcp-scraper.example.com', 'sse', 'inactive', 'Web scraping and data extraction from websites', 'none', 10],
    ['Calendar Server', 'stdio:///usr/local/bin/mcp-calendar', 'stdio', 'active', 'Google Calendar integration for event management', 'oauth2', 10],
    ['Redis Server', 'stdio:///usr/local/bin/mcp-redis', 'stdio', 'active', 'Redis cache operations and data structure management', 'none', 20],
    ['Monitoring Server', 'https://mcp-monitor.example.com', 'sse', 'active', 'System monitoring with Prometheus and Grafana integration', 'bearer', 15],
    ['Search Server', 'https://mcp-search.example.com', 'sse', 'active', 'Full-text search using Elasticsearch integration', 'api_key', 25],
    ['Analytics Server', 'https://mcp-analytics.example.com', 'sse', 'maintenance', 'Business analytics and reporting dashboard', 'bearer', 10],
    ['CI/CD Server', 'https://mcp-cicd.example.com', 'sse', 'active', 'CI/CD pipeline management with GitHub Actions integration', 'bearer', 8],
  ];
  for (const s of servers) {
    await pool.query('INSERT INTO mcp_servers (name, endpoint, protocol, status, description, auth_type, max_connections) VALUES ($1,$2,$3,$4,$5,$6,$7)', s);
  }

  // Seed Tools (15 items)
  await pool.query(`DELETE FROM tools`);
  const tools = [
    ['read_file', 'Read contents of a file from the file system', 'filesystem', '{"type":"object","properties":{"path":{"type":"string"}}}', 1, true],
    ['write_file', 'Write content to a file on the file system', 'filesystem', '{"type":"object","properties":{"path":{"type":"string"},"content":{"type":"string"}}}', 1, true],
    ['create_pull_request', 'Create a new pull request on GitHub', 'git', '{"type":"object","properties":{"title":{"type":"string"},"body":{"type":"string"},"branch":{"type":"string"}}}', 2, true],
    ['run_query', 'Execute a SQL query on the database', 'database', '{"type":"object","properties":{"query":{"type":"string"},"params":{"type":"array"}}}', 3, true],
    ['send_message', 'Send a message to a Slack channel', 'communication', '{"type":"object","properties":{"channel":{"type":"string"},"text":{"type":"string"}}}', 4, true],
    ['build_image', 'Build a Docker image from a Dockerfile', 'devops', '{"type":"object","properties":{"dockerfile":{"type":"string"},"tag":{"type":"string"}}}', 5, true],
    ['deploy_pod', 'Deploy a pod to Kubernetes cluster', 'devops', '{"type":"object","properties":{"manifest":{"type":"object"},"namespace":{"type":"string"}}}', 6, true],
    ['upload_s3', 'Upload a file to AWS S3 bucket', 'cloud', '{"type":"object","properties":{"bucket":{"type":"string"},"key":{"type":"string"},"body":{"type":"string"}}}', 7, true],
    ['send_email', 'Send an email via SMTP', 'communication', '{"type":"object","properties":{"to":{"type":"string"},"subject":{"type":"string"},"body":{"type":"string"}}}', 8, true],
    ['scrape_url', 'Scrape content from a given URL', 'data', '{"type":"object","properties":{"url":{"type":"string"},"selector":{"type":"string"}}}', 9, false],
    ['create_event', 'Create a calendar event', 'productivity', '{"type":"object","properties":{"title":{"type":"string"},"start":{"type":"string"},"end":{"type":"string"}}}', 10, true],
    ['cache_set', 'Set a key-value pair in Redis cache', 'cache', '{"type":"object","properties":{"key":{"type":"string"},"value":{"type":"string"},"ttl":{"type":"integer"}}}', 11, true],
    ['get_metrics', 'Retrieve system metrics from monitoring', 'monitoring', '{"type":"object","properties":{"metric":{"type":"string"},"timerange":{"type":"string"}}}', 12, true],
    ['search_index', 'Search for documents in Elasticsearch', 'search', '{"type":"object","properties":{"index":{"type":"string"},"query":{"type":"string"}}}', 13, true],
    ['trigger_pipeline', 'Trigger a CI/CD pipeline run', 'devops', '{"type":"object","properties":{"pipeline":{"type":"string"},"branch":{"type":"string"}}}', 15, true],
  ];
  for (const t of tools) {
    await pool.query('INSERT INTO tools (name, description, category, input_schema, server_id, is_active) VALUES ($1,$2,$3,$4,$5,$6)', t);
  }

  // Seed Agents (15 items)
  await pool.query(`DELETE FROM agents`);
  const agents = [
    ['Code Review Agent', 'Analyzes code for bugs, security issues, and best practices', 'anthropic/claude-haiku-4.5', 'You are an expert code reviewer. Analyze code for bugs, security vulnerabilities, performance issues, and adherence to best practices.', 0.3, 4096, '["read_file","create_pull_request"]', 'active'],
    ['DevOps Agent', 'Manages deployments, infrastructure, and CI/CD pipelines', 'anthropic/claude-haiku-4.5', 'You are a DevOps automation agent. Help with deployments, container management, and infrastructure operations.', 0.5, 4096, '["build_image","deploy_pod","trigger_pipeline"]', 'active'],
    ['Data Analyst Agent', 'Queries databases and generates insights from data', 'anthropic/claude-haiku-4.5', 'You are a data analysis agent. Write SQL queries, analyze results, and generate insights from database data.', 0.4, 8192, '["run_query","search_index"]', 'active'],
    ['Communication Agent', 'Handles messaging across Slack and email channels', 'anthropic/claude-haiku-4.5', 'You are a communication agent. Help draft and send messages via Slack and email, managing cross-team communication.', 0.7, 2048, '["send_message","send_email"]', 'active'],
    ['File Manager Agent', 'Manages file operations and document organization', 'anthropic/claude-haiku-4.5', 'You are a file management agent. Help organize, read, write, and manage files on the file system.', 0.3, 4096, '["read_file","write_file"]', 'active'],
    ['Security Auditor Agent', 'Scans for security vulnerabilities and compliance issues', 'anthropic/claude-haiku-4.5', 'You are a security auditor. Scan systems for vulnerabilities, check compliance, and recommend security improvements.', 0.2, 4096, '["read_file","run_query","get_metrics"]', 'active'],
    ['Monitoring Agent', 'Monitors system health and alerts on anomalies', 'anthropic/claude-haiku-4.5', 'You are a monitoring agent. Track system metrics, detect anomalies, and alert on critical issues.', 0.3, 2048, '["get_metrics","send_message"]', 'active'],
    ['Documentation Agent', 'Generates and maintains technical documentation', 'anthropic/claude-haiku-4.5', 'You are a documentation agent. Generate clear, comprehensive technical documentation from code and specifications.', 0.6, 8192, '["read_file","write_file"]', 'active'],
    ['Testing Agent', 'Creates and runs test suites for applications', 'anthropic/claude-haiku-4.5', 'You are a testing agent. Generate unit tests, integration tests, and end-to-end tests for applications.', 0.4, 4096, '["read_file","write_file","run_query"]', 'active'],
    ['Research Agent', 'Searches and synthesizes information from multiple sources', 'anthropic/claude-haiku-4.5', 'You are a research agent. Search through knowledge bases, scrape web resources, and synthesize findings.', 0.7, 8192, '["scrape_url","search_index"]', 'active'],
    ['Migration Agent', 'Handles database schema migrations and data transfers', 'anthropic/claude-haiku-4.5', 'You are a database migration agent. Plan and execute database schema changes and data migrations safely.', 0.2, 4096, '["run_query"]', 'active'],
    ['Cloud Manager Agent', 'Manages cloud resources across AWS services', 'anthropic/claude-haiku-4.5', 'You are a cloud management agent. Provision, configure, and manage AWS cloud resources.', 0.4, 4096, '["upload_s3"]', 'active'],
    ['Scheduling Agent', 'Manages calendars, meetings, and time scheduling', 'anthropic/claude-haiku-4.5', 'You are a scheduling agent. Help manage calendars, schedule meetings, and coordinate team availability.', 0.5, 2048, '["create_event","send_message"]', 'active'],
    ['Cache Manager Agent', 'Optimizes caching strategies and manages Redis', 'anthropic/claude-haiku-4.5', 'You are a cache management agent. Optimize caching strategies, manage Redis keys, and monitor cache performance.', 0.3, 2048, '["cache_set","get_metrics"]', 'inactive'],
    ['Incident Response Agent', 'Responds to system incidents and coordinates resolution', 'anthropic/claude-haiku-4.5', 'You are an incident response agent. Detect incidents, coordinate response, and manage incident resolution workflows.', 0.3, 4096, '["get_metrics","send_message","send_email"]', 'active'],
  ];
  for (const a of agents) {
    await pool.query('INSERT INTO agents (name, description, model, system_prompt, temperature, max_tokens, tools, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', a);
  }

  // Seed Prompts (15 items)
  await pool.query(`DELETE FROM prompts`);
  const prompts = [
    ['Code Review', 'Standard code review prompt', 'Review this code for bugs, security issues, and best practices:\n\n{{code}}\n\nProvide specific suggestions with line numbers.', 'development', '["code"]', true],
    ['Bug Analysis', 'Analyze and diagnose software bugs', 'Analyze this bug report and suggest potential root causes:\n\nError: {{error}}\nContext: {{context}}\n\nProvide step-by-step debugging approach.', 'debugging', '["error","context"]', true],
    ['API Documentation', 'Generate API endpoint documentation', 'Generate comprehensive API documentation for:\n\nEndpoint: {{endpoint}}\nMethod: {{method}}\nDescription: {{description}}\n\nInclude request/response examples.', 'documentation', '["endpoint","method","description"]', true],
    ['SQL Query Builder', 'Generate SQL queries from natural language', 'Generate a SQL query for the following requirement:\n\nDatabase: {{database}}\nTables: {{tables}}\nRequirement: {{requirement}}\n\nReturn optimized SQL with explanations.', 'database', '["database","tables","requirement"]', true],
    ['Security Scan', 'Scan code for security vulnerabilities', 'Perform a security analysis on this code:\n\n{{code}}\n\nCheck for: SQL injection, XSS, CSRF, authentication bypass, and data exposure.', 'security', '["code"]', true],
    ['Test Generator', 'Generate unit tests for functions', 'Generate comprehensive unit tests for:\n\n{{code}}\n\nFramework: {{framework}}\nInclude edge cases and error scenarios.', 'testing', '["code","framework"]', true],
    ['Deployment Plan', 'Create deployment plan for releases', 'Create a deployment plan for:\n\nService: {{service}}\nVersion: {{version}}\nEnvironment: {{environment}}\n\nInclude rollback procedures.', 'devops', '["service","version","environment"]', true],
    ['Performance Analysis', 'Analyze application performance metrics', 'Analyze these performance metrics and suggest optimizations:\n\n{{metrics}}\n\nFocus on: latency, throughput, and resource utilization.', 'monitoring', '["metrics"]', true],
    ['Data Migration', 'Plan database migration strategy', 'Plan a migration strategy for:\n\nSource: {{source}}\nTarget: {{target}}\nData: {{data_description}}\n\nInclude validation and rollback steps.', 'database', '["source","target","data_description"]', true],
    ['Incident Report', 'Generate incident post-mortem report', 'Generate an incident post-mortem report:\n\nIncident: {{incident}}\nImpact: {{impact}}\nTimeline: {{timeline}}\n\nInclude root cause and prevention measures.', 'operations', '["incident","impact","timeline"]', true],
    ['Architecture Review', 'Review system architecture design', 'Review this system architecture:\n\n{{architecture}}\n\nEvaluate: scalability, reliability, security, and maintainability.', 'architecture', '["architecture"]', true],
    ['Commit Message', 'Generate meaningful commit messages', 'Generate a conventional commit message for these changes:\n\n{{changes}}\n\nFollow conventional commits format (feat/fix/docs/refactor).', 'development', '["changes"]', true],
    ['Error Handler', 'Design error handling strategies', 'Design error handling for:\n\nService: {{service}}\nOperations: {{operations}}\n\nInclude retry logic, fallbacks, and user-friendly messages.', 'development', '["service","operations"]', true],
    ['Monitoring Setup', 'Configure monitoring and alerting', 'Set up monitoring for:\n\nService: {{service}}\nMetrics: {{metrics}}\nThresholds: {{thresholds}}\n\nInclude dashboard and alert configurations.', 'monitoring', '["service","metrics","thresholds"]', true],
    ['API Rate Limiter', 'Design API rate limiting strategy', 'Design a rate limiting strategy for:\n\nAPI: {{api}}\nEndpoints: {{endpoints}}\nExpected Load: {{load}}\n\nInclude per-user and global limits.', 'architecture', '["api","endpoints","load"]', true],
  ];
  for (const p of prompts) {
    await pool.query('INSERT INTO prompts (name, description, content, category, variables, is_active) VALUES ($1,$2,$3,$4,$5,$6)', p);
  }

  // Seed Resources (15 items)
  await pool.query(`DELETE FROM resources`);
  const resources = [
    ['Project Config', 'file:///app/config.json', 'file', 'Main project configuration file', 'application/json', 1, true],
    ['API Schema', 'file:///app/openapi.yaml', 'file', 'OpenAPI 3.0 specification for the REST API', 'application/yaml', 1, true],
    ['User Database', 'postgres://localhost:5432/users', 'database', 'Primary user database connection', 'application/sql', 3, true],
    ['GitHub Repo', 'https://github.com/org/mcp-server', 'url', 'Main repository for MCP Server project', 'text/html', 2, true],
    ['Docker Compose', 'file:///app/docker-compose.yml', 'file', 'Docker Compose configuration for local development', 'application/yaml', 5, true],
    ['K8s Manifests', 'file:///app/k8s/', 'directory', 'Kubernetes deployment manifests', 'application/yaml', 6, true],
    ['S3 Bucket', 's3://mcp-server-assets', 'cloud', 'AWS S3 bucket for static assets and backups', 'application/octet-stream', 7, true],
    ['Slack Workspace', 'https://mcpserver.slack.com', 'url', 'Team Slack workspace for notifications', 'text/html', 4, true],
    ['CI Config', 'file:///app/.github/workflows/', 'directory', 'GitHub Actions workflow configurations', 'application/yaml', 15, true],
    ['Redis Cache', 'redis://localhost:6379/0', 'database', 'Redis cache instance for session and data caching', 'application/octet-stream', 11, true],
    ['Grafana Dashboard', 'https://grafana.example.com/d/mcp', 'url', 'System monitoring dashboard', 'text/html', 12, true],
    ['ES Index', 'https://es.example.com/mcp-logs', 'url', 'Elasticsearch index for application logs', 'application/json', 13, true],
    ['SSL Certificates', 'file:///etc/ssl/certs/mcp/', 'directory', 'SSL/TLS certificates for secure communication', 'application/x-pem-file', 1, true],
    ['Environment Config', 'file:///app/.env.production', 'file', 'Production environment variables', 'text/plain', 1, false],
    ['Terraform State', 's3://mcp-terraform-state', 'cloud', 'Terraform state file for infrastructure', 'application/json', 7, true],
  ];
  for (const r of resources) {
    await pool.query('INSERT INTO resources (name, uri, type, description, mime_type, server_id, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7)', r);
  }

  // Seed Workflows (15 items)
  await pool.query(`DELETE FROM workflows`);
  const workflows = [
    ['Deploy to Production', 'Full production deployment pipeline', '[{"name":"Run Tests","tool":"trigger_pipeline"},{"name":"Build Image","tool":"build_image"},{"name":"Deploy","tool":"deploy_pod"},{"name":"Notify","tool":"send_message"}]', 'manual', 'active', null],
    ['Daily Backup', 'Automated daily database backup', '[{"name":"Dump DB","tool":"run_query"},{"name":"Upload to S3","tool":"upload_s3"},{"name":"Verify","tool":"read_file"}]', 'scheduled', 'active', '0 2 * * *'],
    ['PR Review', 'Automated pull request review workflow', '[{"name":"Fetch PR","tool":"create_pull_request"},{"name":"Review Code","tool":"read_file"},{"name":"Post Comments","tool":"send_message"}]', 'webhook', 'active', null],
    ['Incident Response', 'Automated incident detection and response', '[{"name":"Check Metrics","tool":"get_metrics"},{"name":"Alert Team","tool":"send_message"},{"name":"Create Ticket","tool":"send_email"}]', 'scheduled', 'active', '*/5 * * * *'],
    ['Cache Warmup', 'Pre-populate cache with hot data', '[{"name":"Query Data","tool":"run_query"},{"name":"Set Cache","tool":"cache_set"},{"name":"Verify","tool":"get_metrics"}]', 'scheduled', 'active', '0 */4 * * *'],
    ['Security Scan', 'Weekly security vulnerability scanning', '[{"name":"Scan Code","tool":"read_file"},{"name":"Check Dependencies","tool":"trigger_pipeline"},{"name":"Report","tool":"send_email"}]', 'scheduled', 'active', '0 0 * * 0'],
    ['Data Sync', 'Synchronize data between environments', '[{"name":"Export Source","tool":"run_query"},{"name":"Transform","tool":"read_file"},{"name":"Import Target","tool":"run_query"}]', 'manual', 'active', null],
    ['Log Rotation', 'Rotate and archive application logs', '[{"name":"Compress Logs","tool":"read_file"},{"name":"Upload Archive","tool":"upload_s3"},{"name":"Clean Old","tool":"write_file"}]', 'scheduled', 'active', '0 0 * * *'],
    ['Health Check', 'Comprehensive system health monitoring', '[{"name":"Check Servers","tool":"get_metrics"},{"name":"Check DB","tool":"run_query"},{"name":"Check Cache","tool":"cache_set"},{"name":"Report","tool":"send_message"}]', 'scheduled', 'active', '*/10 * * * *'],
    ['User Onboarding', 'Automated new user setup workflow', '[{"name":"Create Account","tool":"run_query"},{"name":"Setup Workspace","tool":"write_file"},{"name":"Send Welcome","tool":"send_email"}]', 'webhook', 'active', null],
    ['Release Notes', 'Generate release notes from commits', '[{"name":"Fetch Commits","tool":"create_pull_request"},{"name":"Generate Notes","tool":"write_file"},{"name":"Publish","tool":"send_message"}]', 'manual', 'active', null],
    ['Performance Test', 'Automated performance testing suite', '[{"name":"Setup","tool":"deploy_pod"},{"name":"Run Load Test","tool":"trigger_pipeline"},{"name":"Collect Metrics","tool":"get_metrics"},{"name":"Report","tool":"send_email"}]', 'manual', 'active', null],
    ['Certificate Renewal', 'SSL certificate renewal workflow', '[{"name":"Check Expiry","tool":"read_file"},{"name":"Generate CSR","tool":"write_file"},{"name":"Deploy Cert","tool":"deploy_pod"},{"name":"Verify","tool":"get_metrics"}]', 'scheduled', 'active', '0 0 1 * *'],
    ['Database Migration', 'Database schema migration pipeline', '[{"name":"Backup","tool":"run_query"},{"name":"Migrate","tool":"run_query"},{"name":"Verify","tool":"run_query"},{"name":"Notify","tool":"send_message"}]', 'manual', 'active', null],
    ['Compliance Report', 'Generate monthly compliance reports', '[{"name":"Audit Logs","tool":"search_index"},{"name":"Check Policies","tool":"read_file"},{"name":"Generate Report","tool":"write_file"},{"name":"Send Report","tool":"send_email"}]', 'scheduled', 'active', '0 0 1 * *'],
  ];
  for (const w of workflows) {
    await pool.query('INSERT INTO workflows (name, description, steps, trigger_type, status, schedule) VALUES ($1,$2,$3,$4,$5,$6)', w);
  }

  // Seed Knowledge Base (15 items)
  await pool.query(`DELETE FROM knowledge_base`);
  const knowledge = [
    ['MCP Protocol Overview', 'The Model Context Protocol (MCP) is an open protocol for connecting AI models to external tools and data sources. It uses a client-server architecture where MCP clients (AI applications) connect to MCP servers that expose tools, resources, and prompts.', 'protocol', '["mcp","protocol","architecture"]', 'MCP Specification'],
    ['Tool Use Best Practices', 'When implementing tool use: 1) Define clear input schemas, 2) Include comprehensive descriptions, 3) Handle errors gracefully, 4) Validate inputs before execution, 5) Log all executions for auditing.', 'best-practices', '["tools","best-practices","implementation"]', 'Internal Documentation'],
    ['Agent Design Patterns', 'Common agent patterns: ReAct (Reason + Act), Chain of Thought, Tool-Augmented Generation, Multi-Agent Collaboration, and Hierarchical Task Decomposition.', 'patterns', '["agents","design-patterns","ai"]', 'Research Papers'],
    ['Security Guidelines', 'MCP security best practices: Use authentication for all server connections, validate tool inputs, implement rate limiting, audit all tool executions, use least privilege access, and encrypt data in transit.', 'security', '["security","guidelines","authentication"]', 'Security Team'],
    ['Deployment Architecture', 'Recommended deployment: Use Docker containers for MCP servers, Kubernetes for orchestration, Redis for caching, PostgreSQL for persistent storage, and Prometheus/Grafana for monitoring.', 'architecture', '["deployment","infrastructure","kubernetes"]', 'DevOps Guide'],
    ['Error Handling Strategies', 'Implement three levels of error handling: 1) Tool-level retry with exponential backoff, 2) Agent-level fallback to alternative tools, 3) System-level circuit breakers to prevent cascade failures.', 'best-practices', '["errors","resilience","reliability"]', 'Engineering Standards'],
    ['Prompt Engineering Guide', 'Effective prompt design: Use system prompts for persona, include tool descriptions in context, structure output expectations, use few-shot examples, and implement prompt versioning.', 'prompts', '["prompts","engineering","optimization"]', 'AI Team'],
    ['Resource Management', 'MCP resources represent data sources that servers expose. Types include: files, database connections, API endpoints, cloud storage, and real-time streams. Always use URI format for addressing.', 'protocol', '["resources","data","management"]', 'MCP Specification'],
    ['Monitoring & Observability', 'Key metrics to monitor: tool execution latency, error rates, token usage, agent response time, server connection health, and cache hit rates. Set up alerts for anomalies.', 'operations', '["monitoring","metrics","observability"]', 'SRE Handbook'],
    ['API Rate Limiting', 'Implement rate limiting at multiple levels: per-user (100 req/min), per-tool (50 req/min), per-server (500 req/min), and global (10000 req/min). Use token bucket algorithm.', 'architecture', '["api","rate-limiting","performance"]', 'Architecture Guide'],
    ['Multi-Agent Orchestration', 'For complex tasks, use multi-agent orchestration: Define agent roles clearly, implement handoff protocols, share context via MCP resources, and use a supervisor agent for coordination.', 'patterns', '["multi-agent","orchestration","collaboration"]', 'AI Research'],
    ['Data Privacy Compliance', 'Ensure MCP compliance: Implement data retention policies, provide audit trails, support data deletion requests, encrypt PII, and maintain access control logs.', 'compliance', '["privacy","compliance","gdpr"]', 'Legal Team'],
    ['Performance Optimization', 'Optimize MCP performance: Use connection pooling, implement request batching, cache frequently accessed resources, compress large payloads, and use streaming for long operations.', 'performance', '["optimization","performance","scaling"]', 'Performance Guide'],
    ['Workflow Automation', 'Workflow design principles: Keep steps atomic, implement checkpointing, support parallel execution, handle partial failures, and provide rollback capabilities.', 'workflows', '["workflows","automation","design"]', 'Process Guide'],
    ['Integration Testing', 'Test MCP integrations: Mock server responses for unit tests, use test containers for integration tests, implement contract testing, and run end-to-end tests in staging.', 'testing', '["testing","integration","quality"]', 'QA Team'],
  ];
  for (const k of knowledge) {
    await pool.query('INSERT INTO knowledge_base (title, content, category, tags, source) VALUES ($1,$2,$3,$4,$5)', k);
  }

  // Seed Tool Executions (15 items)
  await pool.query(`DELETE FROM tool_executions`);
  const executions = [
    ['read_file', 'File Manager Agent', '{"path":"/app/config.json"}', '{"content":"...config data...","size":2048}', 'success', 45],
    ['run_query', 'Data Analyst Agent', '{"query":"SELECT COUNT(*) FROM users"}', '{"rows":[{"count":1523}]}', 'success', 120],
    ['send_message', 'Communication Agent', '{"channel":"#general","text":"Deploy complete"}', '{"ok":true,"ts":"1234567890"}', 'success', 200],
    ['build_image', 'DevOps Agent', '{"tag":"mcp-server:v2.1"}', '{"imageId":"sha256:abc123","size":"450MB"}', 'success', 35000],
    ['deploy_pod', 'DevOps Agent', '{"namespace":"production"}', '{"status":"running","replicas":3}', 'success', 15000],
    ['get_metrics', 'Monitoring Agent', '{"metric":"cpu_usage","timerange":"1h"}', '{"avg":45.2,"max":78.5,"min":12.1}', 'success', 80],
    ['search_index', 'Research Agent', '{"index":"logs","query":"error"}', '{"hits":42,"results":["error in auth","error in db"]}', 'success', 150],
    ['send_email', 'Communication Agent', '{"to":"team@example.com","subject":"Weekly Report"}', '{"messageId":"msg123","status":"sent"}', 'success', 500],
    ['cache_set', 'Cache Manager Agent', '{"key":"user:123","ttl":3600}', '{"ok":true}', 'success', 5],
    ['create_pull_request', 'Code Review Agent', '{"title":"Fix auth bug"}', '{"number":456,"url":"https://github.com/org/repo/pull/456"}', 'success', 800],
    ['trigger_pipeline', 'DevOps Agent', '{"pipeline":"main","branch":"develop"}', '{"runId":789,"status":"queued"}', 'success', 300],
    ['run_query', 'Migration Agent', '{"query":"ALTER TABLE users ADD COLUMN avatar"}', '{"command":"ALTER TABLE"}', 'success', 250],
    ['upload_s3', 'Cloud Manager Agent', '{"bucket":"backups","key":"db-2024.sql.gz"}', '{"location":"s3://backups/db-2024.sql.gz"}', 'success', 5000],
    ['scrape_url', 'Research Agent', '{"url":"https://example.com"}', '{"error":"Connection timeout"}', 'error', 30000],
    ['write_file', 'Documentation Agent', '{"path":"/docs/api.md"}', '{"bytesWritten":4096}', 'success', 30],
  ];
  for (const e of executions) {
    await pool.query('INSERT INTO tool_executions (tool_name, agent_name, input_data, output_data, status, duration_ms) VALUES ($1,$2,$3,$4,$5,$6)', e);
  }

  // Seed Audit Logs (15 items)
  await pool.query(`DELETE FROM audit_logs`);
  const logs = [
    ['server.created', 'mcp_server', '1', '{"name":"File System Server"}', 'info', 'admin@mcpserver.com'],
    ['tool.executed', 'tool', '1', '{"tool":"read_file","duration":45}', 'info', 'admin@mcpserver.com'],
    ['agent.started', 'agent', '1', '{"agent":"Code Review Agent"}', 'info', 'admin@mcpserver.com'],
    ['auth.login', 'user', '1', '{"ip":"192.168.1.1"}', 'info', 'admin@mcpserver.com'],
    ['workflow.triggered', 'workflow', '1', '{"workflow":"Deploy to Production"}', 'warning', 'admin@mcpserver.com'],
    ['tool.failed', 'tool', '10', '{"tool":"scrape_url","error":"timeout"}', 'error', 'admin@mcpserver.com'],
    ['server.disconnected', 'mcp_server', '9', '{"reason":"maintenance"}', 'warning', 'admin@mcpserver.com'],
    ['api_key.created', 'api_key', '1', '{"name":"Production Key"}', 'info', 'admin@mcpserver.com'],
    ['webhook.triggered', 'webhook', '3', '{"event":"pr.created","status":200}', 'info', 'admin@mcpserver.com'],
    ['settings.updated', 'setting', '1', '{"key":"max_retries","old":3,"new":5}', 'info', 'admin@mcpserver.com'],
    ['resource.accessed', 'resource', '1', '{"name":"Project Config"}', 'info', 'admin@mcpserver.com'],
    ['agent.error', 'agent', '14', '{"error":"Rate limit exceeded"}', 'error', 'admin@mcpserver.com'],
    ['deployment.completed', 'workflow', '1', '{"version":"v2.1.0","environment":"production"}', 'info', 'admin@mcpserver.com'],
    ['backup.completed', 'workflow', '2', '{"size":"2.3GB","location":"s3://backups/"}', 'info', 'admin@mcpserver.com'],
    ['security.alert', 'system', '0', '{"type":"brute_force","attempts":15}', 'error', 'admin@mcpserver.com'],
  ];
  for (const l of logs) {
    await pool.query('INSERT INTO audit_logs (action, entity_type, entity_id, details, level, user_email) VALUES ($1,$2,$3,$4,$5,$6)', l);
  }

  // Seed API Keys (15 items)
  await pool.query(`DELETE FROM api_keys`);
  const apikeys = [
    ['Production API Key', 'mcp_prod_abc123def456', 'mcp_prod_abc...', '["read","write","execute"]', 'active'],
    ['Staging API Key', 'mcp_stg_xyz789ghi012', 'mcp_stg_xyz7...', '["read","write"]', 'active'],
    ['Development Key', 'mcp_dev_jkl345mno678', 'mcp_dev_jkl3...', '["read","write","execute","admin"]', 'active'],
    ['CI/CD Pipeline Key', 'mcp_ci_pqr901stu234', 'mcp_ci_pqr90...', '["read","execute"]', 'active'],
    ['Monitoring Service', 'mcp_mon_vwx567yza890', 'mcp_mon_vwx5...', '["read"]', 'active'],
    ['Backup Service Key', 'mcp_bak_bcd123efg456', 'mcp_bak_bcd1...', '["read","write"]', 'active'],
    ['Analytics Dashboard', 'mcp_ana_hij789klm012', 'mcp_ana_hij7...', '["read"]', 'active'],
    ['External Partner A', 'mcp_ext_nop345qrs678', 'mcp_ext_nop3...', '["read"]', 'active'],
    ['External Partner B', 'mcp_ext_tuv901wxy234', 'mcp_ext_tuv9...', '["read"]', 'inactive'],
    ['Testing Key', 'mcp_tst_zab567cde890', 'mcp_tst_zab5...', '["read","write","execute"]', 'active'],
    ['Webhook Service', 'mcp_whk_fgh123ijk456', 'mcp_whk_fgh1...', '["read","execute"]', 'active'],
    ['Mobile App Key', 'mcp_mob_lmn789opq012', 'mcp_mob_lmn7...', '["read"]', 'active'],
    ['Admin Console', 'mcp_adm_rst345uvw678', 'mcp_adm_rst3...', '["read","write","execute","admin"]', 'active'],
    ['Legacy System', 'mcp_leg_xyz901abc234', 'mcp_leg_xyz9...', '["read"]', 'revoked'],
    ['Temp Debug Key', 'mcp_tmp_def567ghi890', 'mcp_tmp_def5...', '["read","write","execute"]', 'expired'],
  ];
  for (const k of apikeys) {
    await pool.query('INSERT INTO api_keys (name, api_key, key_prefix, permissions, status) VALUES ($1,$2,$3,$4,$5)', k);
  }

  // Seed Webhooks (15 items)
  await pool.query(`DELETE FROM webhooks`);
  const webhooks = [
    ['Deployment Notify', 'https://hooks.slack.com/services/T00/B00/deploy', '["deployment.completed","deployment.failed"]', 'whsec_deploy123', 'active', '{"Content-Type":"application/json"}'],
    ['PR Review Hook', 'https://hooks.slack.com/services/T00/B00/review', '["pr.created","pr.merged"]', 'whsec_review456', 'active', '{"Content-Type":"application/json"}'],
    ['Alert Manager', 'https://alertmanager.example.com/webhook', '["alert.critical","alert.warning"]', 'whsec_alert789', 'active', '{"Authorization":"Bearer token123"}'],
    ['Audit Logger', 'https://audit.example.com/events', '["*"]', 'whsec_audit012', 'active', '{"Content-Type":"application/json"}'],
    ['PagerDuty', 'https://events.pagerduty.com/integration/abc/enqueue', '["incident.created","incident.resolved"]', 'whsec_pd345', 'active', '{"Content-Type":"application/json"}'],
    ['Datadog Events', 'https://api.datadoghq.com/api/v1/events', '["metric.threshold","error.spike"]', 'whsec_dd678', 'active', '{"DD-API-KEY":"ddkey123"}'],
    ['GitHub Status', 'https://api.github.com/repos/org/repo/statuses', '["build.success","build.failure"]', 'whsec_gh901', 'active', '{"Authorization":"token ghp_xxx"}'],
    ['Jira Integration', 'https://jira.example.com/webhook/mcp', '["task.created","task.completed"]', 'whsec_jira234', 'active', '{"Content-Type":"application/json"}'],
    ['Email Digest', 'https://email-service.example.com/digest', '["daily.summary"]', 'whsec_email567', 'active', '{"Content-Type":"application/json"}'],
    ['Metrics Collector', 'https://metrics.example.com/ingest', '["tool.executed","agent.completed"]', 'whsec_metrics890', 'active', '{"Content-Type":"application/json"}'],
    ['Security Scanner', 'https://security.example.com/scan', '["code.pushed","dependency.updated"]', 'whsec_sec123', 'active', '{"Content-Type":"application/json"}'],
    ['Teams Notify', 'https://outlook.office.com/webhook/abc/IncomingWebhook', '["deployment.completed","incident.created"]', 'whsec_teams456', 'inactive', '{"Content-Type":"application/json"}'],
    ['Custom Analytics', 'https://analytics.internal.com/events', '["user.action","agent.interaction"]', 'whsec_analytics789', 'active', '{"Content-Type":"application/json"}'],
    ['Backup Monitor', 'https://backup-mon.example.com/status', '["backup.completed","backup.failed"]', 'whsec_backup012', 'active', '{"Content-Type":"application/json"}'],
    ['Compliance Logger', 'https://compliance.example.com/audit', '["data.accessed","permission.changed"]', 'whsec_comply345', 'active', '{"Content-Type":"application/json"}'],
  ];
  for (const w of webhooks) {
    await pool.query('INSERT INTO webhooks (name, url, events, secret, status, headers) VALUES ($1,$2,$3,$4,$5,$6)', w);
  }

  // Seed Models (15 items)
  await pool.query(`DELETE FROM models`);
  const models = [
    ['Claude Haiku 4.5', 'Anthropic', 'anthropic/claude-haiku-4.5', 'Fast and efficient model for quick tasks', 200000, 4096, '$0.25/1M', '$1.25/1M', 'active'],
    ['Claude Sonnet 4', 'Anthropic', 'anthropic/claude-sonnet-4', 'Balanced performance and intelligence', 200000, 8192, '$3/1M', '$15/1M', 'active'],
    ['Claude Opus 4', 'Anthropic', 'anthropic/claude-opus-4', 'Most intelligent model for complex tasks', 200000, 8192, '$15/1M', '$75/1M', 'active'],
    ['GPT-4o', 'OpenAI', 'openai/gpt-4o', 'Multimodal model with vision capabilities', 128000, 4096, '$5/1M', '$15/1M', 'active'],
    ['GPT-4o Mini', 'OpenAI', 'openai/gpt-4o-mini', 'Cost-effective model for simple tasks', 128000, 4096, '$0.15/1M', '$0.60/1M', 'active'],
    ['Gemini 2.0 Flash', 'Google', 'google/gemini-2.0-flash', 'Fast multimodal model from Google', 1000000, 8192, '$0.10/1M', '$0.40/1M', 'active'],
    ['Gemini 2.5 Pro', 'Google', 'google/gemini-2.5-pro', 'Advanced reasoning and coding model', 1000000, 8192, '$1.25/1M', '$10/1M', 'active'],
    ['Llama 3.1 405B', 'Meta', 'meta-llama/llama-3.1-405b', 'Largest open-source model', 128000, 4096, '$3/1M', '$3/1M', 'active'],
    ['Llama 3.1 70B', 'Meta', 'meta-llama/llama-3.1-70b', 'Efficient open-source model', 128000, 4096, '$0.60/1M', '$0.60/1M', 'active'],
    ['Mistral Large', 'Mistral', 'mistralai/mistral-large', 'Flagship model from Mistral AI', 128000, 4096, '$2/1M', '$6/1M', 'active'],
    ['Mixtral 8x7B', 'Mistral', 'mistralai/mixtral-8x7b', 'Mixture of experts architecture', 32000, 4096, '$0.24/1M', '$0.24/1M', 'active'],
    ['DeepSeek V3', 'DeepSeek', 'deepseek/deepseek-chat-v3', 'High-performance open model', 128000, 4096, '$0.14/1M', '$0.28/1M', 'active'],
    ['Qwen 2.5 72B', 'Alibaba', 'qwen/qwen-2.5-72b', 'Multilingual model with strong coding', 128000, 4096, '$0.35/1M', '$0.40/1M', 'active'],
    ['Command R+', 'Cohere', 'cohere/command-r-plus', 'Enterprise-grade RAG model', 128000, 4096, '$2.50/1M', '$10/1M', 'active'],
    ['Phi-3 Medium', 'Microsoft', 'microsoft/phi-3-medium', 'Efficient small language model', 128000, 4096, '$0.14/1M', '$0.14/1M', 'active'],
  ];
  for (const m of models) {
    await pool.query('INSERT INTO models (name, provider, model_id, description, context_window, max_tokens, pricing_input, pricing_output, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', m);
  }

  // Seed Settings (15 items)
  await pool.query(`DELETE FROM settings`);
  const settings = [
    ['max_retries', '3', 'general', 'Maximum number of retry attempts for failed operations'],
    ['request_timeout', '30000', 'general', 'Default request timeout in milliseconds'],
    ['max_concurrent_agents', '10', 'agents', 'Maximum number of concurrent agent executions'],
    ['default_model', 'anthropic/claude-haiku-4.5', 'ai', 'Default AI model for new agents'],
    ['default_temperature', '0.7', 'ai', 'Default temperature for AI model responses'],
    ['max_tokens_limit', '8192', 'ai', 'Maximum token limit for AI responses'],
    ['log_retention_days', '90', 'logging', 'Number of days to retain audit logs'],
    ['enable_webhooks', 'true', 'webhooks', 'Enable or disable webhook notifications'],
    ['rate_limit_per_minute', '100', 'security', 'API rate limit per user per minute'],
    ['session_timeout', '86400', 'security', 'Session timeout in seconds (24 hours)'],
    ['enable_ai_analysis', 'true', 'ai', 'Enable AI-powered analysis features'],
    ['backup_frequency', 'daily', 'maintenance', 'Database backup frequency'],
    ['cache_ttl', '3600', 'performance', 'Default cache TTL in seconds'],
    ['enable_metrics', 'true', 'monitoring', 'Enable system metrics collection'],
    ['theme', 'dark', 'ui', 'Default UI theme preference'],
  ];
  for (const s of settings) {
    await pool.query('INSERT INTO settings (key, value, category, description) VALUES ($1,$2,$3,$4)', s);
  }

  console.log('Database seeded successfully!');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
