# GitHub Projects MCP Implementation Plan

## Task
Create an MCP server in `/home/mstouffer/repos/GitHub/` that provides GitHub Projects integration capabilities, specifically to:
- Read open issues from GitHub Projects
- Enable commenting on issues

## Understanding
The GitHub Projects API provides access to project data through GraphQL, requiring:
1. Authentication via GitHub token
2. GraphQL queries to fetch project data
3. REST API calls for issue comments

## Implementation Plan

### 1. Project Setup
- Create new directory `/home/mstouffer/repos/GitHub/github-projects-mcp`
- Initialize with `@modelcontextprotocol/create-server`
- Set up TypeScript configuration
- Install dependencies:
  - `@octokit/rest` for GitHub REST API
  - `@octokit/graphql` for GitHub Projects API
  - `dotenv` for environment variables

### 2. Core Features Implementation
1. Authentication
   - Environment variable for GitHub token
   - Token validation on server start
   - Error handling for invalid/missing tokens

2. GraphQL Operations
   - Query builder for projects
   - Query builder for issues
   - Response type definitions
   - Error handling

3. MCP Tools
   - `list_project_issues`: Get open issues from a project
     - Input: project number/name
     - Output: formatted issue list
   - `comment_on_issue`: Add comment to an issue
     - Input: issue number, comment text
     - Output: comment status

4. Error Handling
   - API rate limits
   - Authentication errors
   - Network failures
   - Invalid inputs

### 3. Testing
- Unit tests for API interactions
- Integration tests with GitHub API
- Tool validation tests
- Error case testing

## Next Steps
1. Create project directory and initialize MCP server
2. Set up basic TypeScript configuration
3. Implement authentication handling
4. Create first tool: `list_project_issues`

## Implementation Details

### Tool Schemas

#### list_project_issues
```typescript
{
  type: "object",
  properties: {
    owner: {
      type: "string",
      description: "Repository owner"
    },
    repo: {
      type: "string",
      description: "Repository name"
    },
    projectNumber: {
      type: "number",
      description: "Project number"
    }
  },
  required: ["owner", "repo", "projectNumber"]
}
```

#### comment_on_issue
```typescript
{
  type: "object",
  properties: {
    owner: {
      type: "string",
      description: "Repository owner"
    },
    repo: {
      type: "string",
      description: "Repository name"
    },
    issueNumber: {
      type: "number",
      description: "Issue number"
    },
    comment: {
      type: "string",
      description: "Comment text"
    }
  },
  required: ["owner", "repo", "issueNumber", "comment"]
}