# Reusable AI Skills Catalog

---

## 1. Overview

Sellsy organizes analytical knowledge into reusable Skill definition files located in `skills/`. Each skill provides structured execution instructions, required inputs, tool integration guidelines, and validation rules.

---

## 2. Skills Inventory

| Skill Name | Path | Description |
|---|---|---|
| **sales-analysis** | `skills/sales-analysis/SKILL.md` | Analyzes revenue trends, period-over-period comparisons, order volume dynamics, and sales anomalies. |
| **product-intelligence** | `skills/product-intelligence/SKILL.md` | Analyzes catalog performance, product margins, inventory velocity, revenue distribution, and lifecycle trends. |
| **customer-insights** | `skills/customer-insights/SKILL.md` | Segments customer cohorts via RFM metrics, calculates repeat purchase rates, and tracks customer lifetime value (LTV). |
| **sales-forecasting** | `skills/sales-forecasting/SKILL.md` | Computes statistical time-series projections, trend trajectories, and confidence intervals for store revenue. |
| **marketing-strategy** | `skills/marketing-strategy/SKILL.md` | Synthesizes catalog strengths, customer segments, and revenue opportunities to generate actionable growth campaigns. |

---

## 3. Skill Architecture & Anatomy

Every `SKILL.md` file follows the strict specification:
1. **Frontmatter:** YAML metadata (`name`, `description`, `version`).
2. **Purpose:** Scope and analytical goals.
3. **When to Use:** Triggering conditions for the Central Orchestrator.
4. **Required Inputs:** Schema of arguments (`store_id`, `date_range`, `limit`).
5. **Analysis Instructions:** Step-by-step mathematical guidelines.
6. **Tool Usage Instructions:** Exact MCP tools to invoke.
7. **Output Format:** Structured JSON schema.
8. **Validation Rules:** Verification constraints (e.g. non-negative bounds).
9. **Limitations:** Known boundary conditions.

