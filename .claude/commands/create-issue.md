# Create Issue

Capture a bug, feature, or improvement and push it directly to GitHub Issues.

## Your Goal

Create a GitHub Issue with:
- Clear, descriptive title
- Detailed description with context
- Appropriate labels (bug, enhancement, etc.)
- Relevant file references

## Process

1. **Gather info** - Ask concise questions to fill gaps:
   - What's the issue/feature?
   - Type: bug, feature/enhancement, or improvement?
   - Current behavior vs expected behavior (for bugs)

2. **Search for context** only when helpful:
   - Web search for best practices if it's a complex feature 
   - Search codebase for relevant files if helpful
   - Note any risks or dependencies you spot

3. **Skip what's obvious** - If it's a straightforward bug, don't search web. If type/priority is clear from description, don't ask.

4. **Keep it fast** - Total exchange under 2min. Be conversational but brief. Get what you need, create ticket, done.

5. **Create the issue** - Use `gh issue create` to push directly to GitHub

## Issue Format

Use this structure for the issue body:

```
## Description
[Clear summary]

## Current Behavior
[What happens now - for bugs]

## Expected Behavior
[What should happen]

## Relevant Files
- `path/to/file.py`

## Additional Context
[Notes, risks, dependencies]
```

## Creating the Issue

Run this command to create the issue:

```bash
gh issue create --title "Issue title" --body "Issue body" --label "bug"
```

Available labels to use:
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements

## Behavior Rules

- Be conversational - ask what makes sense, not a checklist
- Default priority: normal, effort: medium (ask only if unclear)
- Keep questions brief - respect user's flow
- Skip sections that don't apply
- Always show the user the created issue URL when done
- Max 3 relevant files unless more are critical
- Bullet points over paragraphs