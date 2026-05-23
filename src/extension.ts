import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Angular Project Insight Activated');

	const disposable = vscode.commands.registerCommand(
		'angular-project-insight.explainProject',
		async () => {

			const files = await vscode.workspace.findFiles(
				'**/*.ts'
			);

			const componentFiles = files.filter(file =>
				file.fsPath.toLowerCase().includes('.component.ts')
			);

			const serviceFiles = files.filter(file =>
				file.fsPath.toLowerCase().includes('.service.ts')
			);

			const moduleFiles = files.filter(file =>
				file.fsPath.toLowerCase().includes('.module.ts')
			);

			const routeFiles = files.filter(file =>
				file.fsPath.toLowerCase().includes('route')
			);

			const summary = `
Components: ${componentFiles.length}
Services: ${serviceFiles.length}
Modules: ${moduleFiles.length}
Route Files: ${routeFiles.length}
`;

			vscode.window.showInformationMessage(summary);
		}
	);

	context.subscriptions.push(disposable);
}

export function deactivate() {}