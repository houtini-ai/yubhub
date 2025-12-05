# Yubnub MCP v2 - Documentation Index

**Complete guide to building, deploying, and using Yubnub MCP v2**

---

## Quick Navigation

### 🚀 Getting Started
Start here if you want to **deploy and use** the MCP server:
- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide
- **[README.md](./README.md)** - Feature overview and user guide

### 📋 Reference Documentation
For understanding **architecture and design**:
- **[SPECIFICATION.md](./SPECIFICATION.md)** - Complete technical specification
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Full code reference
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - High-level overview

### 📂 Source Code
Implementation files in `src/`:
- **[src/index.ts](./src/index.ts)** - Server entry point
- **[src/types.ts](./src/types.ts)** - TypeScript interfaces
- **[src/api-client.ts](./src/api-client.ts)** - Yubnub API client
- **[src/tools/feeds.ts](./src/tools/feeds.ts)** - Tool handlers
- **[src/components/](./src/components/)** - UI components

### ⚙️ Configuration
- **[package.json](./package.json)** - Dependencies and scripts
- **[tsconfig.json](./tsconfig.json)** - TypeScript config
- **[.gitignore](./.gitignore)** - Git ignore patterns

---

## Reading Order by Role

### For End Users (Using the MCP Server)
1. Read [QUICKSTART.md](./QUICKSTART.md) to set up
2. Try the commands in [README.md](./README.md)
3. Reference troubleshooting sections as needed

### For Developers (Understanding the Code)
1. Read [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for overview
2. Study [SPECIFICATION.md](./SPECIFICATION.md) for architecture
3. Review [IMPLEMENTATION.md](./IMPLEMENTATION.md) for code details
4. Explore source files in `src/`

### For Operators (Deploying and Maintaining)
1. Follow [QUICKSTART.md](./QUICKSTART.md) for initial setup
2. Review deployment section in [IMPLEMENTATION.md](./IMPLEMENTATION.md)
3. Check troubleshooting in [README.md](./README.md)
4. Monitor using guides in [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

### For Architects (Evaluating Design)
1. Start with [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
2. Deep dive into [SPECIFICATION.md](./SPECIFICATION.md)
3. Review design decisions and trade-offs
4. Compare with v1 architecture (in old docs)

---

## Document Purposes

### QUICKSTART.md
**Purpose**: Get from zero to working in 5 minutes  
**Contains**: Step-by-step setup, troubleshooting, testing  
**For**: Anyone deploying for first time

### README.md
**Purpose**: User guide and feature reference  
**Contains**: Features, usage examples, support info  
**For**: End users and quick reference

### SPECIFICATION.md
**Purpose**: Complete technical specification  
**Contains**: Architecture, security model, data flows, tool specs  
**For**: Developers and architects

### IMPLEMENTATION.md
**Purpose**: Code reference and implementation guide  
**Contains**: Complete code listings, build process, testing  
**For**: Developers implementing or modifying

### PROJECT_SUMMARY.md
**Purpose**: High-level overview and status  
**Contains**: Key decisions, comparisons, roadmap, metrics  
**For**: Project managers and stakeholders

---

## Key Concepts to Understand

### Model Context Protocol (MCP)
- Standard protocol for LLM integration
- Enables tools, resources, prompts
- Stdio transport for Claude Desktop

### @mcp-ui/components
- Modern UI framework for MCP
- Declarative TSX components
- Native rendering in Claude

### Yubnub Platform
- Job aggregation system
- Multi-tenant architecture
- REST API for management

### Tool Flow
1. User makes natural language request
2. Claude calls MCP tool
3. Server fetches data from Yubnub API
4. Server renders UI component
5. Claude displays to user

---

## Common Questions

### "Where do I start?"
→ [QUICKSTART.md](./QUICKSTART.md)

### "What tools are available?"
→ [README.md](./README.md) Features section

### "How does it work?"
→ [SPECIFICATION.md](./SPECIFICATION.md) Architecture section

### "Where's the code for X?"
→ [IMPLEMENTATION.md](./IMPLEMENTATION.md) with direct code listings

### "How do I add a new tool?"
→ [SPECIFICATION.md](./SPECIFICATION.md) Tool Specifications + [IMPLEMENTATION.md](./IMPLEMENTATION.md) Tool Handlers

### "What changed from v1?"
→ [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) Architecture Improvements

### "How do I troubleshoot?"
→ [QUICKSTART.md](./QUICKSTART.md) Troubleshooting + [README.md](./README.md) Troubleshooting

### "What's the security model?"
→ [SPECIFICATION.md](./SPECIFICATION.md) Security Model

---

## External References

### Yubnub Admin API
Documentation: `C:\dev\yubnub\v2\API.md`  
Endpoints, authentication, request/response formats

### MCP Documentation
- SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Specification: https://spec.modelcontextprotocol.io

### UI Components
- Documentation: https://github.com/mcp-ui/components
- Examples: Check their examples directory

---

## File Summary

### Documentation Files
| File | Lines | Purpose |
|------|-------|---------|
| QUICKSTART.md | 191 | Setup guide |
| README.md | 293 | User guide |
| SPECIFICATION.md | 695 | Technical spec |
| IMPLEMENTATION.md | 933 | Code reference |
| PROJECT_SUMMARY.md | 305 | Overview |
| INDEX.md | (this) | Navigation |

### Source Files
| File | Lines | Purpose |
|------|-------|---------|
| src/index.ts | 47 | Entry point |
| src/types.ts | 43 | Interfaces |
| src/api-client.ts | 49 | API client |
| src/tools/feeds.ts | 159 | Tool handlers |
| src/components/FeedCard.tsx | 33 | Feed dashboard |
| src/components/FeedList.tsx | 28 | Feed grid |
| src/components/JobList.tsx | 36 | Job list |

### Total
- **Documentation**: ~2,500 lines
- **Source Code**: ~400 lines
- **Configuration**: ~60 lines

---

## Version Information

- **Project Version**: 2.0.0
- **MCP SDK**: ^1.0.4
- **UI Components**: ^0.4.0
- **TypeScript**: ^5.7.2
- **Node.js**: 20+

---

## Update Process

When this documentation needs updates:

1. **Code changes** → Update IMPLEMENTATION.md
2. **Architecture changes** → Update SPECIFICATION.md
3. **Feature changes** → Update README.md
4. **Setup changes** → Update QUICKSTART.md
5. **Major changes** → Update PROJECT_SUMMARY.md
6. **Always** → Update version numbers consistently

---

## Feedback and Support

Found an error in documentation?
- Check if it's specific to your setup
- Review troubleshooting sections
- Verify with source code
- Document any discrepancies found

---

## License

All documentation and source code are proprietary.  
Part of the Yubnub platform.

---

**Last Updated**: December 5, 2025  
**Documentation Status**: Complete  
**Code Status**: Implementation Ready
