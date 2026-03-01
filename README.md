# GrantThrive Frontend Applications

This repository contains the five React-based frontend applications for the GrantThrive ecosystem. All apps are managed as a single monorepo using pnpm workspaces.

---

### Applications

| App Directory | Audience | Purpose |
|---|---|---|
| `frontend` | Council staff, applicants, community members | Core grant management portal |
| `grantthrive-admin-dashboard` | GrantThrive internal team | Platform-level super-admin console |
| `grantthrive-mapping-component` | General public | Interactive national grant discovery map |
| `grantthrive-marketing-website` | Prospective council customers | Public marketing and sales site |
| `grantthrive-roi-calculator` | Prospective council customers | Pre-sales ROI and cost-savings calculator |

---

## Local Development Setup

This guide covers how to install and run all five frontend applications on your local machine. **You must have the [backend platform](https://github.com/BigLittleBusiness/grantthrive-platform) running first.**

### Prerequisites

- **Node.js 22.0+**
- **pnpm 10.0+** (install with `npm install -g pnpm`)
- **Git**

### 1. Clone & Setup

```bash
# Clone the repository
git clone https://github.com/BigLittleBusiness/GrantThrive-frontend.git
cd GrantThrive-frontend

# Create the environment file
cp .env.example .env
```

### 2. Configure Environment

Check the `.env` file you just created:

- The default `VITE_API_URL` (`http://localhost:5000/api`) and `VITE_LOGIN_URL` (`http://localhost:5173/login`) should be correct if you are running the backend and frontend with the default settings.

### 3. Install Dependencies

This single command will read the `pnpm-workspace.yaml` file and install dependencies for all five UI apps, including linking the local `@grantthrive/auth` library.

```bash
pnpm install
```

### 4. Run the Applications

You can run any of the apps using the `--filter` flag with the `pnpm dev` command. They will automatically be assigned different ports by Vite.

**Run the Core Frontend App (most common):**

```bash
# Run the main application (equivalent to app.grantthrive.com)
pnpm --filter frontend dev

# This will typically run on http://localhost:5173
```

**Run Other Apps:**

```bash
# Run the Admin Dashboard
pnpm --filter grantthrive-admin-dashboard dev

# Run the public Mapping Component
pnpm --filter grantthrive-mapping-component dev

# Run the ROI Calculator
pnpm --filter grantthrive-roi-calculator dev

# Run the Marketing Website
pnpm --filter grantthrive-marketing-website dev
```
