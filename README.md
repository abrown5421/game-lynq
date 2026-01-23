# MERN FSA Starter

MERN FSA Starter is a modern, scalable frontend and backend starter boilerplate built with **React**, **Redux Toolkit**, **TypeScript**, and **Feature-Sliced Architecture (FSA)**. This project is structured as a **pnpm monorepo** and is designed to support applications ranging from small prototypes to large-scale production systems, ensuring maintainable code structure and clear ownership.

This documentation focuses on the three independent modules, backend, frontend, and CLI, that make up the application.

---

## Demo

You can explore a live demo of this boilerplate here:  
[https://mern-boilerplate-web.onrender.com/](https://mern-boilerplate-web.onrender.com/)

<sub> Please note that the application enabled all of its prefabs for the purposes of this demo. The prefabs, such as the e-commerce flow or the blog flow, can be enabled and disabled using the CLI. Please see more about this in the CLI section below.</sub>
Test login credentials:  
- **Email:** `test.user@gmail.com`  
- **Password:** `TestUserPassword123!`  

---

## Monorepo Structure
apps/
├─ web/ # Frontend application (React + Redux Toolkit)
├─ api/ # Backend API (Node.js + Express + MongoDB)
├─ cli/ # CLI for scaffolding pages, features, and prefabs

Each application has a clearly defined role, but is designed to work seamlessly together.

## Installation

Clone and run the project locally:

```bash
degit abrown5421/mern-fsa-starter my-project
cd my-project
pnpm install
pnpm dev
```

To enable CLI usage globally:
```bash
cd apps/cli
pnpm build
pnpm link --global
```

The development server will start and serve the frontend application. Happy Coding!

## CLI Documentation
The CLI provides automated scaffolding for pages, features, and prefabs to accelerate development.

### Starting the CLI

Ensure the CLI is built and linked globally:
```bash
cd apps/cli
pnpm build
pnpm link --global
mern-cli
```
The CLI presents a menu with three modules: Pages, Features, and Prefabs.

### Pages Module
The pages module allows developers to create or remove pages without manual code editing. Features include:

- Interactive prompts for page name, path, and inclusion in the navbar.
- Automatic creation of page files and directory structure.
- Updates to Navbar and DrawerNavbar to reflect new pages or remove links.

### Features Module
The features module scaffolds both frontend and backend functionality:

- Prompts the developer for feature details.
- Creates backend models, routes, and exposes five base CRUD endpoints:
- Create, read all, read by ID, update by ID, delete by ID.
- Generates corresponding RTK Query APIs for the frontend.
- Extends the CMS structure to provide administrative access for content management.
- The module provides foundational functionality, intended to be extended by developers.

### Prefabs Module
Prefabs automate common workflows by combining pages, features, and supporting files:

- **Blog:** Generates blog listing and single post pages with pagination, filtering, and CMS-editable posts.
- **Ecommerce:** Creates products and orders features, cart, checkout, product listing pages, order tracking, and order completion pages.
- **Staff:** Generates a staff directory page using existing users feature filtered by admin or editor.
- **Contact:** Creates a validated contact form page. Mailing server integration must be implemented separately

## Backend Documentation 
The backend is structured around features, which represent MongoDB collections of related documents. Each feature automatically provides five CRUD endpoints.

### Users Feature
Out of the box, the backend includes a users feature with authentication routes:

- **/register** - Create a new account.
- **/login** - Authenticate an existing user.
- **/logout** - End user session.
- **/me** - Fetch authenticated user details.
<sub>Authentication is handled using JWT, stored in HttpOnly cookies to maintain session state.</sub>

### Integrations Layer
The backend provides a framework for third-party API integrations:

- Integration registration and management via IntegrationManager.
- Out-of-the-box support for webhook verification and health checks.
- Base class for integrations handles API requests, authentication, error handling, and rate limiting.
- Integration configurations are easily added or modified via loadIntegrationConfigs.

Example endpoint registration for integrations:
```typescript
import { Router } from 'express';
import { IntegrationManager } from '../core/integration-manager';

const router = Router();

router.get('/health', async (req, res) => {
  const manager = IntegrationManager.getInstance();
  const health = await manager.healthCheckAll();
  res.json({
    integrations: health,
    available: manager.listIntegrations(),
  });
});
```
## Frontend Documentation
The frontend application is built with Vite, React, Redux Toolkit, and TypeScript. It includes built-in support for animations, page routing, and several reusable UI components.

### Core Features
* Navbar, Footer, Pagination, and Search Bar
* Interactive UI components:
    - Alert: Provides transient feedback messages
    - Drawer: Houses off-screen UI, integrated with the navbar
    - Modal: Hybrid of alert and drawer for user confirmation or extended content

### Alert Usage 
```typescript
dispatch(openAlert({
  open: true,
  closeable: true,
  severity: 'error',
  message: 'Please fix the errors in the form',
  anchor: { x: 'right', y: 'bottom' },
}));
```

### Drawer Usage
```typescript
dispatch(openDrawer({
  open: true,
  drawerContent: "navbar",
  anchor: "right",
  title: user ? `${getGreeting()}, ${user.firstName}` : getGreeting(),
}));
```
<sub>Note: Drawer components rely on a registry system to avoid non-serializable Redux state.</sub>

### Modal Usage
```typescript
openModal({
  modalContent: 'confirm',
  title: 'Delete Item',
  message: 'This action is permanent and cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  confirmAction: async () => { await deleteItem(item.id); },
});
```
<sub>Note: Modals also use a registry system for state management.</sub>

##Development Notes
- Fork the repository and create feature branches for new functionality.
- Ensure linting and formatting with Prettier.
- Test features thoroughly before opening a pull request.
- Include documentation for new pages, features, and integrations.
