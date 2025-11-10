# Spec-Kit Integration for Шкед

This directory contains the Spec-Kit (spec-driven development) configuration and artifacts for the Шкед project.

## Directory Structure

```
.specify/
├── memory/              # Project constitution and long-term artifacts
│   └── constitution.md # Project principles and development standards
├── scripts/            # Helper scripts for spec-kit commands
│   ├── bash/          # POSIX shell scripts
│   └── powershell/    # PowerShell scripts for Windows
└── README.md          # This file

.claude/                # Claude Code integration
└── commands/          # Spec-kit slash commands
    ├── speckit.constitution.md
    ├── speckit.specify.md
    ├── speckit.clarify.md
    ├── speckit.plan.md
    ├── speckit.tasks.md
    ├── speckit.implement.md
    ├── speckit.analyze.md
    └── speckit.checklist.md

specs/                 # Feature specifications (created by /speckit.specify)
└── [N]-feature-name/  # Each feature gets its own directory
    ├── spec.md       # Requirements and acceptance criteria
    ├── plan.md       # Technical implementation plan
    ├── tasks.md      # Task breakdown
    └── checklists/   # Quality validation checklists

templates/             # Template files for creating specs
├── spec-template.md
├── plan-template.md
├── tasks-template.md
├── checklist-template.md
└── agent-file-template.md
```

## Available Slash Commands

Use these commands in Claude Code to follow the spec-driven development workflow:

### Core Workflow (Use in Order)

1. **`/speckit.constitution`** - View or update project principles
   - Establishes the governance rules for the project
   - Already created: `.specify/memory/constitution.md`

2. **`/speckit.specify [feature description]`** - Create a new feature specification
   - Creates numbered feature directory in `specs/`
   - Generates technology-agnostic requirements
   - Identifies acceptance criteria and success metrics

3. **`/speckit.plan [spec file or feature directory]`** - Create technical implementation plan
   - Translates requirements into architecture
   - Defines tech stack choices
   - Creates implementation roadmap

4. **`/speckit.tasks [plan file or feature directory]`** - Break down into actionable tasks
   - Generates ordered task list
   - Estimates complexity
   - Identifies dependencies

5. **`/speckit.implement [tasks file or feature directory]`** - Execute implementation
   - Follows task list step-by-step
   - Updates task status as work progresses
   - Commits incrementally

### Optional Quality Commands

- **`/speckit.clarify [spec file]`** - Ask structured questions to resolve ambiguities
  - Use after `/speckit.specify` if requirements are unclear
  - Presents multiple-choice questions to de-risk assumptions

- **`/speckit.analyze [feature directory]`** - Cross-check spec, plan, and tasks alignment
  - Use after `/speckit.tasks` to validate consistency
  - Identifies missing requirements or out-of-scope tasks

- **`/speckit.checklist [file or feature directory]`** - Generate quality validation checklist
  - Use after `/speckit.plan` to validate completeness
  - Creates requirement traceability matrix

## Workflow Example

### Scenario: Add attendance analytics dashboard

```bash
# 1. Define the feature
/speckit.specify Add an attendance analytics dashboard for lectors showing per-student and per-group statistics with exportable reports

# This creates: specs/1-attendance-analytics-dashboard/spec.md

# 2. Create implementation plan
/speckit.plan specs/1-attendance-analytics-dashboard

# This creates: specs/1-attendance-analytics-dashboard/plan.md

# 3. Break into tasks
/speckit.tasks specs/1-attendance-analytics-dashboard

# This creates: specs/1-attendance-analytics-dashboard/tasks.md

# 4. Implement
/speckit.implement specs/1-attendance-analytics-dashboard

# Claude will work through each task, updating tasks.md as it goes
```

## Integration with Existing Workflow

Spec-kit complements (not replaces) your existing development process:

- **Constitution**: Enforces TypeScript strict mode, RBAC, Prisma workflow
- **Specifications**: Document requirements before implementation
- **Planning**: Architecture decisions explicitly documented
- **Tasks**: Clear breakdown prevents scope creep
- **Git**: Each task can map to a commit; full feature = PR

## Benefits for Шкед

1. **Type Safety**: Constitution enforces strict TypeScript usage
2. **RBAC Consistency**: Specs ensure role-based access is designed upfront
3. **Database Integrity**: Plan phase validates Prisma schema changes
4. **Test Coverage**: Tasks include test writing as explicit steps
5. **Documentation**: Specs serve as living documentation
6. **Onboarding**: New contributors understand architecture through specs

## Current Status

- ✅ Spec-kit initialized
- ✅ Constitution created (v1.0.0)
- ✅ Slash commands available
- ⏳ First feature specification pending

## Next Steps

1. Try creating a spec for a small feature using `/speckit.specify`
2. Review the generated spec for quality
3. Follow through the full workflow (specify → plan → tasks → implement)
4. Iterate on constitution as needed

## Resources

- [Spec-Kit GitHub](https://github.com/github/spec-kit)
- [Spec-Driven Development Guide](https://github.com/github/spec-kit/blob/main/docs/methodology.md)
- Project Constitution: `.specify/memory/constitution.md`
