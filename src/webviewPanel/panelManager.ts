import * as vscode from 'vscode';
import { AngularProject } from '../models/types';
import { generateDashboardHtml } from './htmlGenerator';
import { generatePdf } from '../utils/pdfGenerator'; // 👈 ADD THIS

let currentPanel: vscode.WebviewPanel | undefined;

/**
 * Create or show the analysis result panel
 */
export function createOrShowPanel(
	context: vscode.ExtensionContext,
	project: AngularProject
): void {

	const column = vscode.ViewColumn.Two;

	if (currentPanel) {
		currentPanel.reveal(column);
		currentPanel.webview.html = generateHtmlContent(context, project);
		return;
	}

	currentPanel = vscode.window.createWebviewPanel(
		'angular-project-insight',
		'📊 Angular Project Insight',
		column,
		{
			enableScripts: true,
			enableFindWidget: true,
			retainContextWhenHidden: true,
		}
	);

	// ✅ IMPORTANT: HANDLE MESSAGES FROM WEBVIEW
	currentPanel.webview.onDidReceiveMessage(
		async (message) => {

			if (message.command === 'exportPdf') {
				try {
					vscode.window.showInformationMessage('📄 Generating PDF...');

					const html = generateDashboardHtml(project);

					const pdfBuffer = await generatePdf(html);

					const uri = await vscode.window.showSaveDialog({
						filters: { pdf: ['pdf'] },
						defaultUri: vscode.Uri.file('angular-project-insight.pdf')
					});

					if (uri) {
						await vscode.workspace.fs.writeFile(uri, pdfBuffer);

						vscode.window.showInformationMessage(
							'✅ PDF exported successfully!'
						);
					}

				} catch (err: any) {
					vscode.window.showErrorMessage(
						'❌ PDF export failed: ' + err.message
					);
				}
			}
		}
	);

	currentPanel.onDidDispose(() => {
		currentPanel = undefined;
	});

	currentPanel.webview.html = generateHtmlContent(context, project);
}

/**
 * Close panel
 */
export function closePanel(): void {
	if (currentPanel) {
		currentPanel.dispose();
		currentPanel = undefined;
	}
}

/**
 * HTML content
 */
function generateHtmlContent(
	context: vscode.ExtensionContext,
	project: AngularProject
): string {

	const dashboardHtml = generateDashboardHtml(project);

	const styleUri = vscode.Uri.file(
		context.asAbsolutePath('dist/webviewPanel/styles.css')
	);

	const scriptUri = vscode.Uri.file(
		context.asAbsolutePath('dist/webviewPanel/webview.js')
	);

	const webviewStyleUri = currentPanel?.webview.asWebviewUri(styleUri);
	const webviewScriptUri = currentPanel?.webview.asWebviewUri(scriptUri);

	return `
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Angular Project Insight</title>

	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/modern-normalize@23.0.1/modern-normalize.min.css">
	<script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>

	<link rel="stylesheet" href="${webviewStyleUri}">
</head>

<body>
	<div class="dashboard-container">
		${dashboardHtml}
	</div>

	<script>
		mermaid.initialize({ startOnLoad: true, theme: 'default' });
	</script>

	<!-- YOUR UI LOGIC -->
	<script src="${webviewScriptUri}"></script>
</body>

</html>
`;
}