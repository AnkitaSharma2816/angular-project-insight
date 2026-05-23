import { AngularProject } from '../models/types';
import {
  generateComponentServiceFlowchart,
  generateRouteFlowchart,
  generateServiceDependencyChart
} from '../generators/mermaidGenerator';

export function generateDashboardHtml(
	project: AngularProject
): string {

	const componentFlowchart = generateComponentServiceFlowchart(project);
	const routeFlowchart = generateRouteFlowchart(project.routes);
	const serviceDependencyDiagram = generateServiceDependencyChart(project);

	const hasCircularDeps =
		project.dependencyGraph.circularDependencies.length > 0;

	const isStandaloneApp = project.isStandalone;

	const architectureType = isStandaloneApp
		? 'Standalone Components'
		: 'NgModules';

	const angularVersion = project.version || 'Unknown';

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8" />
	<title>Angular Project Insight</title>

	<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
	<script>
		mermaid.initialize({
			startOnLoad: true,
			theme: "default",
			securityLevel: "loose"
		});
	</script>

	<style>
		body { font-family: Arial; padding: 16px; background: #f9f9f9; }

		.header { font-size: 22px; font-weight: bold; margin-bottom: 10px; }

		.badge {
			display: inline-block;
			padding: 4px 10px;
			margin-right: 6px;
			border-radius: 6px;
			background: #eee;
			font-size: 12px;
		}

		.stats-grid {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 10px;
		}

		.stat-card {
			background: white;
			padding: 10px;
			border-radius: 8px;
		}

		.mermaid {
			background: white;
			padding: 10px;
			border-radius: 8px;
		}

		.export-btn {
			position: fixed;
			top: 12px;
			right: 12px;
			padding: 10px 14px;
			background: #4CAF50;
			color: white;
			border: none;
			border-radius: 8px;
			cursor: pointer;
			z-index: 9999;
		}
	</style>
</head>

<body>

	<!-- EXPORT BUTTON -->
	<button id="exportPdfBtn" class="export-btn">
		📄 Export PDF
	</button>

	<!-- HEADER -->
	<div class="header">
		📊 Angular Project Insight
	</div>

	<div>
		<span class="badge">Angular v${angularVersion}</span>
		<span class="badge">${architectureType}</span>
		${isStandaloneApp
			? '<span class="badge">🚀 Standalone</span>'
			: '<span class="badge">🧩 NgModules</span>'
		}
	</div>

	<!-- STATS -->
	<h3>Quick Stats</h3>

	<div class="stats-grid">
		<div class="stat-card">🧩 Components: ${project.components.length}</div>
		<div class="stat-card">💼 Services: ${project.services.length}</div>
		<div class="stat-card">🛣️ Routes: ${project.routes.length}</div>
		<div class="stat-card">🅰️ Angular: v${angularVersion}</div>
	</div>

	<!-- DIAGRAMS -->
	<div>
		<h3>Component-Service Relationship</h3>
		<div class="mermaid">${componentFlowchart}</div>
	</div>

	<div>
		<h3>Route Flow</h3>
		<div class="mermaid">${routeFlowchart}</div>
	</div>

	<div>
		<h3>Service Dependency Graph</h3>
		<div class="mermaid">${serviceDependencyDiagram}</div>
	</div>

	<!-- CIRCULAR DEPENDENCIES -->
	${hasCircularDeps ? `
		<div style="background:#fff3cd;padding:10px;margin-top:20px;border-radius:8px;">
			<h3>⚠ Circular Dependencies Detected</h3>
			<ul>
				${project.dependencyGraph.circularDependencies
					.map(d => `<li>${d.join(' ↔ ')}</li>`)
					.join('')}
			</ul>
		</div>
	` : ''}

	<!-- 🚀 SAFE EXPORT (VSCode WAY) -->
	<script>
		const vscode = acquireVsCodeApi();

		document.getElementById("exportPdfBtn").addEventListener("click", () => {
			vscode.postMessage({
				command: "exportPdf"
			});
		});
	</script>

</body>
</html>
`;
}