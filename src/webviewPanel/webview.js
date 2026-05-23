/**
 * Angular Project Insight - Webview Client Script
 * Handles Mermaid rendering, theme detection, and interactivity
 */

(function () {
	'use strict';

	// ========== MERMAID INITIALIZATION ==========
	function initializeMermaid() {
		// Detect VS Code theme preference
		const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

		mermaid.initialize({
			startOnLoad: false,
			theme: isDarkMode ? 'dark' : 'default',
			securityLevel: 'loose',
			logLevel: 'warn',
			flowchart: {
				useMaxWidth: true,
				curve: 'linear'
			},
			sequence: {
				useMaxWidth: true
			},
			class: {
				useMaxWidth: true
			},
			state: {
				useMaxWidth: true
			}
		});

		// Render all Mermaid diagrams
		const mermaidDivs = document.querySelectorAll('.mermaid');
		console.log(`Found ${mermaidDivs.length} Mermaid diagrams to render`);

		if (mermaidDivs.length > 0) {
			mermaid.contentLoaded();
		}
	}

	// ========== THEME DETECTION ==========
	function setupThemeDetection() {
		if (window.matchMedia) {
			const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

			darkModeQuery.addEventListener('change', (e) => {
				// Re-initialize Mermaid with new theme
				initializeMermaid();
			});
		}
	}

	// ========== SEARCH FUNCTIONALITY ==========
	function setupSearch() {
		document.addEventListener('keydown', (e) => {
			// Ctrl+F or Cmd+F - browser's default search works well
			// We could enhance with custom search if needed
		});
	}

	// ========== SMOOTH SCROLLING ==========
	function setupSmoothScroll() {
		document.querySelectorAll('a[href^="#"]').forEach(anchor => {
			anchor.addEventListener('click', function (e) {
				const href = this.getAttribute('href');
				if (href && href !== '#') {
					const target = document.querySelector(href);
					if (target) {
						e.preventDefault();
						target.scrollIntoView({ behavior: 'smooth' });
					}
				}
			});
		});
	}

	// ========== COPY TO CLIPBOARD ==========
	function setupCodeCopy() {
		document.querySelectorAll('code').forEach(codeBlock => {
			codeBlock.style.cursor = 'pointer';
			codeBlock.title = 'Click to copy';

			codeBlock.addEventListener('click', (e) => {
				const text = codeBlock.innerText;
				navigator.clipboard.writeText(text).then(() => {
					// Show feedback
					const originalText = codeBlock.innerText;
					codeBlock.innerText = '✓ Copied!';
					setTimeout(() => {
						codeBlock.innerText = originalText;
					}, 1500);
				}).catch(err => {
					console.error('Failed to copy:', err);
				});
			});
		});
	}

	// ========== COLLAPSIBLE SECTIONS ==========
	function setupCollapsibles() {
		document.querySelectorAll('details').forEach(detail => {
			detail.addEventListener('toggle', (e) => {
				if (detail.open) {
					// Smooth re-render of Mermaid diagrams in this section
					const mermaidDivs = detail.querySelectorAll('.mermaid');
					if (mermaidDivs.length > 0) {
						setTimeout(() => {
							try {
								mermaid.contentLoaded();
							} catch (err) {
								console.warn('Could not re-render Mermaid on expand:', err);
							}
						}, 100);
					}
				}
			});
		});
	}

	// ========== TABLE ENHANCEMENTS ==========
	function setupTableEnhancements() {
		document.querySelectorAll('.routes-table').forEach(table => {
			table.style.width = '100%';
			table.style.borderCollapse = 'collapse';
		});
	}

	// ========== STATISTICS ANIMATION ==========
	function setupStatisticsAnimation() {
		const statNumbers = document.querySelectorAll('.stat-number');
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.style.animation = 'fadeInUp 0.5s ease-out';
				}
			});
		});

		statNumbers.forEach(stat => {
			observer.observe(stat);
		});
	}

	// ========== KEYBOARD SHORTCUTS ==========
	function setupKeyboardShortcuts() {
		document.addEventListener('keydown', (e) => {
			// Ctrl+1: Scroll to stats
			if ((e.ctrlKey || e.metaKey) && e.key === '1') {
				const statsSection = document.querySelector('.stats-section');
				if (statsSection) {
					statsSection.scrollIntoView({ behavior: 'smooth' });
				}
			}

			// Ctrl+2: Scroll to components
			if ((e.ctrlKey || e.metaKey) && e.key === '2') {
				const componentsSection = document.querySelector('.entities-section');
				if (componentsSection) {
					componentsSection.scrollIntoView({ behavior: 'smooth' });
				}
			}

			// Ctrl+0: Scroll to top
			if ((e.ctrlKey || e.metaKey) && e.key === '0') {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		});
	}

	// ========== PERFORMANCE MONITORING ==========
	function setupPerformanceMonitoring() {
		if (window.performance && performance.mark) {
			performance.mark('webview-ready');

			// Log page load time
			window.addEventListener('load', () => {
				if (performance.mark && performance.measure) {
					performance.mark('webview-loaded');
					try {
						performance.measure('webview-load-time', 'webview-ready', 'webview-loaded');
						const measure = performance.getEntriesByName('webview-load-time')[0];
						console.log(`📊 Webview loaded in ${measure.duration.toFixed(2)}ms`);
					} catch (e) {
						// Ignore measurement errors
					}
				}
			});
		}
	}

	// ========== ACCESSIBILITY ==========
	function setupAccessibility() {
		// Ensure all interactive elements are keyboard accessible
		document.querySelectorAll('details summary').forEach(summary => {
			summary.setAttribute('role', 'button');
			summary.setAttribute('tabindex', '0');
			summary.addEventListener('keypress', (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					summary.click();
				}
			});
		});
	}

	// ========== INITIALIZATION ==========
	document.addEventListener('DOMContentLoaded', () => {
		console.log('🚀 Angular Project Insight webview initializing...');

		initializeMermaid();
		setupThemeDetection();
		setupSearch();
		setupSmoothScroll();
		setupCodeCopy();
		setupCollapsibles();
		setupTableEnhancements();
		setupStatisticsAnimation();
		setupKeyboardShortcuts();
		setupPerformanceMonitoring();
		setupAccessibility();

		console.log('✅ Angular Project Insight webview ready!');

		// Log helpful hints
		console.log('💡 Keyboard Shortcuts:');
		console.log('   Ctrl+1: Jump to statistics');
		console.log('   Ctrl+2: Jump to components');
		console.log('   Ctrl+0: Scroll to top');
		console.log('   Ctrl+F: Search in dashboard');
	});

	// Handle case where DOMContentLoaded already fired
	if (document.readyState === 'loading') {
		// DOM is still loading
	} else {
		// DOM is already ready
		initializeMermaid();
		setupThemeDetection();
		setupSearch();
		setupSmoothScroll();
		setupCodeCopy();
		setupCollapsibles();
		setupTableEnhancements();
		setupStatisticsAnimation();
		setupKeyboardShortcuts();
		setupPerformanceMonitoring();
		setupAccessibility();
	}
})();