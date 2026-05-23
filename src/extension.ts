import * as vscode from 'vscode';
import * as projectAnalyzer from './analyzers/projectAnalyzer';
import * as panelManager from './webviewPanel/panelManager';

/**
 * Extension activation
 * Registers commands and initializes the extension
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('✅ Angular Project Insight is now active');

	// Register the main command: Analyze Angular Project
	const analyzeCommand = vscode.commands.registerCommand(
		'angular-project-insight.explainProject',
		async () => {
			await handleAnalyzeProjectCommand(context);
		}
	);

	// Register refresh command (when in panel, user can refresh)
	const refreshCommand = vscode.commands.registerCommand(
		'angular-project-insight.refresh',
		async () => {
			await handleAnalyzeProjectCommand(context);
		}
	);

	// Register command to show the last analysis again
	const showCommand = vscode.commands.registerCommand(
		'angular-project-insight.show',
		async () => {
			vscode.window.showWarningMessage(
				'Please run "Explain Angular Project" first to generate analysis'
			);
		}
	);

	context.subscriptions.push(analyzeCommand);
	context.subscriptions.push(refreshCommand);
	context.subscriptions.push(showCommand);

	// Optional: Show welcome message on first activation
	const isFirstRun = !context.globalState.get('angular-project-insight.activated');
	if (isFirstRun) {
		context.globalState.update('angular-project-insight.activated', true);
		vscode.window.showInformationMessage(
			'Angular Project Insight activated! Use "Angular: Explain Project" command to analyze your Angular project.'
		);
	}
}

/**
 * Handle the "Explain Project" command
 * Orchestrates analysis and displays results
 */
async function handleAnalyzeProjectCommand(
	context: vscode.ExtensionContext
): Promise<void> {
	try {
		// Check if workspace is open
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage(
				'No workspace open. Please open a folder containing an Angular project.'
			);
			return;
		}

		// Show progress notification
		const progressOptions = {
			location: vscode.ProgressLocation.Notification,
			title: '🔍 Analyzing Angular Project...',
			cancellable: false,
		};

		vscode.window.withProgress(
			progressOptions,
			async (progress) => {
				progress.report({ message: 'Scanning workspace...' });

				try {
					// Run project analysis
					console.log('📊 Starting project analysis...');
					const analysisResult = await projectAnalyzer.analyzeAngularProject();

					if (!projectAnalyzer.isAnalysisValid(analysisResult)) {
						const errorMsg = projectAnalyzer.getErrorMessage(analysisResult);
						vscode.window.showErrorMessage(
							`Analysis failed: ${errorMsg}`
						);
						console.error('Analysis failed:', analysisResult.errors);
						return;
					}

					// Analysis successful
					progress.report({ message: 'Generating reports...' });

					// Get analysis summary
					const summary = projectAnalyzer.getAnalysisSummary(analysisResult);
					console.log(summary);

					// Show success message with quick stats
					const stats = projectAnalyzer.getDetailedAnalysisReport(analysisResult);
					vscode.window.showInformationMessage(
						`✅ Analysis complete: ${stats.components.length} components, ${stats.services.length} services, ${stats.routes.length} routes`
					);

					// Open webview panel with full report
					progress.report({ message: 'Rendering report...' });
					if (analysisResult.data) {
						panelManager.createOrShowPanel(context, analysisResult.data);
					}
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : String(error);
					console.error('Error during analysis:', error);
					vscode.window.showErrorMessage(
						`Analysis error: ${errorMsg}`
					);
				}
			}
		);
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.error('Command error:', error);
		vscode.window.showErrorMessage(`Command error: ${errorMsg}`);
	}
}

/**
 * Extension deactivation
 * Cleanup and resource release
 */
export function deactivate() {
	console.log('👋 Angular Project Insight has been deactivated');
	panelManager.closePanel();
}