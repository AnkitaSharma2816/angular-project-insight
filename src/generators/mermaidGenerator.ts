import {
  AngularProject,
  AngularRoute,
} from '../models/types';

/* =========================================================
   UTIL
========================================================= */
const safeId = (name: string) =>
  name.replace(/[^a-zA-Z0-9]/g, '');

/* =========================================================
   1. COMPONENT - SERVICE FLOWCHART
========================================================= */
export function generateComponentServiceFlowchart(
  project: AngularProject
): string {

  const componentNodes: string[] = [];
  const serviceNodes: string[] = [];
  const edges: string[] = [];

  for (const c of project.components) {
    const id = safeId(c.name);
    componentNodes.push(`${id}["📦 ${c.name}"]`);
  }

  for (const s of project.services) {
    const id = safeId(s.name);
    serviceNodes.push(`${id}["⚙️ ${s.name}"]`);
  }

  for (const c of project.components) {
    const from = safeId(c.name);

    for (const dep of c.dependencies) {
      const service = project.services.find(s => s.name === dep);
      if (service) {
        const to = safeId(service.name);
        edges.push(`${from} -->|uses| ${to}`);
      }
    }
  }

  return `
graph TB

subgraph Components
${componentNodes.join("\n")}
end

subgraph Services
${serviceNodes.join("\n")}
end

%% Dependencies
${edges.join("\n")}
`.trim();
}

/* =========================================================
   2. ROUTE FLOWCHART
========================================================= */
export function generateRouteFlowchart(
  routes: AngularRoute[]
): string {

  if (!routes?.length) {
    return `
graph LR
A["No routes found"]
`.trim();
  }

  const edges: string[] = [];
  let counter = 0;

  const walk = (route: AngularRoute, parent = "root") => {
    const nodeId = `r${counter++}`;
    const label = route.path || "/";

    edges.push(`${parent} --> ${nodeId}["🛣️ ${label}"]`);

    if (route.children) {
      for (const child of route.children) {
        walk(child, nodeId);
      }
    }
  };

  for (const r of routes) {
    walk(r);
  }

  return `
graph TD

root["App Routes"]

${edges.join("\n")}
`.trim();
}

/* =========================================================
   3. SERVICE DEPENDENCY GRAPH
========================================================= */
export function generateServiceDependencyChart(
  project: AngularProject
): string {

  if (!project.services?.length) {
    return `
graph LR
A["No services found"]
`.trim();
  }

  const nodes: string[] = [];
  const edges: string[] = [];

  for (const s of project.services) {
    const id = safeId(s.name);
    nodes.push(`${id}["⚙️ ${s.name}"]`);
  }

  for (const s of project.services) {
    const from = safeId(s.name);

    for (const dep of s.dependencies || []) {
      const exists = project.services.find(x => x.name === dep);
      if (exists) {
        const to = safeId(dep);
        edges.push(`${from} --> ${to}`);
      }
    }
  }

  return `
graph TD

${nodes.join("\n")}

${edges.join("\n")}
`.trim();
}