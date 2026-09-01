---
name: ceodigital-skills-curation
description: "How to author, maintain, test and curate canonical CEODigital skills and multi-file sandbox bundles inside the Hermes Agent fork. Load when creating new platform skills, updating sandbox scripts/templates, or syncing with the Web App."
version: 1.0.0
license: MIT
platforms: [macos, linux]
metadata:
  hermes:
    tags: [ceodigital, hermes-fork, skills, authoring, curation, sandbox]
---

# CEODigital & Hermes Fork — Skills Curation & Authoring Guide

This skill defines the end-to-end engineering standard for authoring and curating skills in the **CEODigital Agent (Hermes Fork)** (`/Users/agentdev/dev/paulojmorais/hermes-agent/skills/ceodigital-platform/`) and the Web Platform.

---

## 1. The Dual-Layer Architecture (Industry Standard)

1. **System Core Skills (The Engine OS / Fork):**
   - Located in `skills/ceodigital-platform/` inside the Hermes Agent repo.
   - Built into the agent distribution: available out-of-the-box in CLI, Desktop Companion, and Web without runtime DB latency.
   - Immutable to regular tenant edits.
2. **Tenant Database Skills (Custom Business SOPs):**
   - Stored in Supabase `public.skills` per `tenant_id`.
   - Created or edited by organizations in `/settings/skills`.
   - **Resolution Precedence:** A tenant skill matching a canonical `slug` dynamically overrides the core baseline.

---

## 2. Skill Types & Directory Anatomy

### A. Single-File Skill (`<skill-slug>.md` or `<skill-slug>/SKILL.md`)
For structured conversational playbooks without external sandbox computation:
```markdown
---
name:
  pt-PT: "Nome da Skill"
  en: "Skill Name"
description:
  pt-PT: "Descrição concisa dos gatilhos e valor."
  en: "Concise trigger and value description."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["workspaces.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Nome do Procedimento

## Quando Usar
- Gatilhos específicos em linguagem natural.

## Procedimento
1. Passo a passo objetivo e pragmático.
2. Ferramentas a invocar na mesma resposta.
```

### B. Multi-File Skill Bundle (with Python Sandbox Execution)
For skills requiring data fusion, financial reconciliation, slide validation, or schema parsing:
```
<skill-slug>/
├── SKILL.md                 # YAML frontmatter (is_bundle: true) + Instructions
├── scripts/                 # Python scripts executed in isolated Sandbox via execute_code
│   └── process_data.py
├── templates/               # HTML5/Tailwind or JSON templates populated by the agent
│   └── report-template.html
└── references/              # JSON schemas and API documentation
    └── input-schema.json
```

---

## 3. Sandboxed Execution Protocol

When executing Python scripts inside a bundle:
1. The agent inspects `SKILL.md` to identify the script name and parameters.
2. Runs the script inside the isolated sandbox using `execute_code`.
3. Passes the structured output to `chat.createArtifact` (HTML/Markdown) or `chat.generatePptx` / `chat.generatePdf`.
4. **Strict Cloud Guardrail:** Never hallucinate saving files to server paths like `/opt/hermes` or `/tmp`.

---

## 4. Synchronization & Release Workflow

1. **Authoring:** Create/edit the skill under `skills/ceodigital-platform/`.
2. **Mirroring:** Ensure files are synced with `src/tenant/skills/canonical/` in the Web App (`ceodigital`).
3. **Validation:** Run unit tests with `bun test src/tenant/skills/__tests__/canonical-skills.test.ts`.
4. **Commit:** Commit to `ceodigital-branding` (or feature branch) with conventional messages: `feat(skills): add <name> bundle`.
