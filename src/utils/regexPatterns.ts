/**
 * Regular Expression Patterns
 * Centralized regex patterns for Angular file parsing
 */

// ============================================================================
// DECORATOR PATTERNS
// ============================================================================

/**
 * Pattern to match @Component decorator content
 */
export const COMPONENT_DECORATOR_PATTERN = /@Component\(\{([\s\S]*?)\}\)/m;

/**
 * Pattern to match @Injectable decorator content
 */
export const INJECTABLE_DECORATOR_PATTERN = /@Injectable\(\{([\s\S]*?)\}\)/m;

/**
 * Pattern to match @NgModule decorator content
 */
export const NG_MODULE_DECORATOR_PATTERN = /@NgModule\(\{([\s\S]*?)\}\)/m;

/**
 * Pattern to match @Input decorator
 */
export const INPUT_DECORATOR_PATTERN = /@Input\(\)\s+(\w+)/g;

/**
 * Pattern to match @Output decorator
 */
export const OUTPUT_DECORATOR_PATTERN = /@Output\(\)\s+(\w+)/g;

// ============================================================================
// SELECTOR AND TEMPLATE PATTERNS
// ============================================================================

/**
 * Pattern to match selector in @Component
 */
export const SELECTOR_PATTERN = /selector:\s*['"`]([^'"`]*)['"`]/;

/**
 * Pattern to match templateUrl in @Component
 */
export const TEMPLATE_URL_PATTERN = /templateUrl:\s*['"`]([^'"`]*)['"`]/;

/**
 * Pattern to match styleUrl or styleUrls in @Component
 */
export const STYLE_URLS_PATTERN = /styleUrls:\s*\[\s*([^\]]*?)\s*\]/s;

/**
 * Pattern to match individual style URLs
 */
export const STYLE_URL_ITEM_PATTERN = /['"`]([^'"`]+)['"`]/g;

// ============================================================================
// SERVICE PATTERNS
// ============================================================================

/**
 * Pattern to extract providedIn from @Injectable decorator
 */
export const SERVICE_DECORATOR_PATTERN = /providedIn\s*:\s*['"`](\w+)['"`]/;

// ============================================================================
// DEPENDENCY PATTERNS (UPDATED - More comprehensive)
// ============================================================================

/**
 * Pattern to extract constructor parameters
 */
export const CONSTRUCTOR_PATTERN = /constructor\(([^)]*)\)/;

/**
 * Extract dependencies from constructor injection
 * Matches: private serviceName: ServiceType, public http: HttpClient
 */
export function extractConstructorDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    const constructorMatch = content.match(CONSTRUCTOR_PATTERN);
    if (!constructorMatch) return dependencies;
    
    const params = constructorMatch[1].split(',');
    
    for (const param of params) {
        // Match: private name: Type, public name: Type, protected name: Type
        const injectMatch = param.match(/(?:private|public|protected)\s+\w+\s*:\s*(\w+)/);
        if (injectMatch && injectMatch[1]) {
            dependencies.push(injectMatch[1]);
        }
        
        // Match: @Inject(Token) name
        const injectDecoratorMatch = param.match(/@Inject\((\w+)\)/);
        if (injectDecoratorMatch && injectDecoratorMatch[1]) {
            dependencies.push(injectDecoratorMatch[1]);
        }
        
        // Match: name: Type (no access modifier)
        const simpleMatch = param.match(/^\s*(\w+)\s*:\s*(\w+)/);
        if (simpleMatch && simpleMatch[2] && !simpleMatch[1].match(/private|public|protected/)) {
            dependencies.push(simpleMatch[2]);
        }
    }
    
    // Also check for inject() function calls (Angular 14+)
    const injectMatches = content.match(INJECT_FUNCTION_PATTERN);
    if (injectMatches) {
        for (const match of injectMatches) {
            const serviceMatch = match.match(/inject\((\w+)\)/);
            if (serviceMatch && serviceMatch[1]) {
                dependencies.push(serviceMatch[1]);
            }
        }
    }
    
    return [...new Set(dependencies)]; // Remove duplicates
}

// ============================================================================
// HTTP AND API PATTERNS
// ============================================================================

/**
 * Pattern to match HTTP method calls
 * Matches: http.get(), http.post(), etc.
 */
export const HTTP_METHOD_PATTERN = /http\.(get|post|put|patch|delete|request)\s*\(/g;

/**
 * Pattern to match API endpoint URLs
 * Matches: 'https://api.example.com/users', "/api/data"
 */
export const API_ENDPOINT_PATTERN = /['"`](https?:\/\/[^'"`]+|\.?\/api\/[^'"`]+)['"`]/g;

// ============================================================================
// CLASS AND FILE PATTERNS
// ============================================================================

/**
 * Extract class name from TypeScript file
 */
export function extractClassName(content: string): string | null {
    const match = content.match(/export\s+class\s+(\w+)/);
    return match ? match[1] : null;
}

/**
 * Check if a decorator exists in the file content
 * @param content File content
 * @param decoratorName Decorator name (e.g., 'Component', 'Injectable')
 * @returns True if decorator exists
 */
export function hasDecorator(content: string, decoratorName: string): boolean {
    const pattern = new RegExp(`@${decoratorName}\\s*\\(`, 'i');
    return pattern.test(content);
}

/**
 * Check if component is standalone
 */
export function isStandaloneComponent(content: string): boolean {
    return STANDALONE_COMPONENT_PATTERN.test(content);
}

// ============================================================================
// ROUTE PATTERNS (UPDATED - More comprehensive)
// ============================================================================

/**
 * Pattern to find routes array in various formats
 */
export const ROUTES_ARRAY_PATTERNS = [
    /export\s+const\s+\w+\s*:\s*Routes\s*=\s*\[([\s\S]*?)\];/m,
    /const\s+routes\s*:\s*Routes\s*=\s*\[([\s\S]*?)\];/m,
    /Routes\s*=\s*\[([\s\S]*?)\];/m,
    /RouterModule\.forRoot\(\s*\[([\s\S]*?)\]\)/m,
    /RouterModule\.forChild\(\s*\[([\s\S]*?)\]\)/m,
    /provideRouter\(\s*\[([\s\S]*?)\]\)/m
];

/**
 * Pattern to extract route path
 */
export const ROUTE_PATH_PATTERN = /path\s*:\s*['"`]([^'"`]*)['"`]/;

/**
 * Pattern to extract route component
 */
export const ROUTE_COMPONENT_PATTERN = /component\s*:\s*(\w+)/;

/**
 * Pattern to extract loadComponent (lazy loading)
 */
export const ROUTE_LOAD_COMPONENT_PATTERN = /loadComponent\s*:\s*\(\)\s*=>\s*import\([^)]+\)\.then\(m\s*=>\s*m\.(\w+)\)/;

/**
 * Pattern to extract loadChildren (lazy loading modules)
 */
export const ROUTE_LOAD_CHILDREN_PATTERN = /loadChildren\s*:\s*\(\)\s*=>\s*import\([^)]+\)\.then\(m\s*=>\s*m\.(\w+)\)/;

/**
 * Pattern to extract redirectTo
 */
export const ROUTE_REDIRECT_PATTERN = /redirectTo\s*:\s*['"`]([^'"`]*)['"`]/;

/**
 * Pattern to extract canActivate guards
 */
export const ROUTE_CAN_ACTIVATE_PATTERN = /canActivate\s*:\s*\[(.*?)\]/;

// ============================================================================
// GUARD PATTERNS
// ============================================================================

/**
 * Pattern to detect guard interface
 */
export const GUARD_INTERFACE_PATTERN = /implements\s+(\w+)/;

/**
 * Get all guard types
 */
export const GUARD_TYPES = ['CanActivate', 'CanActivateChild', 'CanDeactivate', 'CanLoad', 'CanMatch'];

/**
 * Check if functional guard is used (Angular 15+)
 */
export function usesFunctionalGuards(content: string): boolean {
    const patterns = [
        /export\s+const\s+\w+Guard\s*:\s*CanActivateFn\s*=/,
        /export\s+const\s+\w+Guard\s*[:=]\s*\(/,
        /export\s+function\s+\w+Guard\s*\(/,
        /CanActivateFn\s*=\s*\(/
    ];
    
    for (const pattern of patterns) {
        if (pattern.test(content)) {
            return true;
        }
    }
    return false;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract decorator properties as key-value map
 * @param decoratorContent Content inside @Component({ ... })
 * @returns Map of property names to values
 */
export function extractDecoratorProperties(decoratorContent: string): Record<string, string> {
    const properties: Record<string, string> = {};
    
    // Match property: value pairs (handling nested objects/arrays)
    const propertyPattern = /(\w+):\s*([^,}\n]+)/g;
    let match;
    
    while ((match = propertyPattern.exec(decoratorContent)) !== null) {
        const key = match[1];
        let value = match[2].trim();
        
        // Clean up value
        if (value.startsWith('[') && value.endsWith(']')) {
            // Keep array as is
        } else if (value.startsWith('{') && value.endsWith('}')) {
            // Keep object as is
        } else if (value.match(/^['"`].*['"`]$/)) {
            // Remove quotes from strings
            value = value.slice(1, -1);
        }
        
        properties[key] = value;
    }
    
    return properties;
}

/**
 * Parse URL from property value (removes ./ prefix)
 */
export function parseUrl(url: string): string {
    if (url.startsWith('./')) {
        return url.substring(2);
    }
    return url;
}

// ============================================================================
// ANGULAR 14+ PATTERNS (Modern Routing, Standalone Components)
// ============================================================================

/**
 * Pattern to detect standalone components (Angular 14+)
 */
export const STANDALONE_COMPONENT_PATTERN = /standalone\s*:\s*true/;

/**
 * Pattern for provideRouter (Angular 14+ standalone routing)
 */
export const PROVIDE_ROUTER_PATTERN = /provideRouter\s*\(\s*\[([\s\S]*?)\]\s*\)/;

/**
 * Pattern for inject() function (Angular 14+)
 */
export const INJECT_FUNCTION_PATTERN = /inject\s*\(\s*(\w+)\s*\)/g;

/**
 * Pattern for bootstrapApplication (Angular 14+ standalone)
 */
export const BOOTSTRAP_APPLICATION_PATTERN = /bootstrapApplication\s*\(\s*(\w+)/;

/**
 * Pattern for app.config.ts configuration
 */
export const APP_CONFIG_PATTERN = /export\s+const\s+appConfig\s*:\s*ApplicationConfig\s*=\s*\{([\s\S]*?)\};/;

// ============================================================================
// ANGULAR 14+ ADDITIONAL HELPERS
// ============================================================================

/**
 * Check if inject() function is used (Angular 14+)
 */
export function usesInjectFunction(content: string): boolean {
    return INJECT_FUNCTION_PATTERN.test(content) || 
           /import\s*\{[^}]*\binject\b[^}]*\}\s*from\s*['"]@angular\/core['"]/.test(content);
}

/**
 * Check if modern routing (provideRouter) is used
 */
export function usesModernRouting(content: string): boolean {
    return PROVIDE_ROUTER_PATTERN.test(content);
}

// ============================================================================
// ANGULAR 16+ PATTERNS (Signals)
// ============================================================================

/**
 * Pattern to detect signal() usage (Angular 16+)
 */
export const SIGNAL_PATTERN = /signal\s*\(\s*([^)]*)\s*\)/g;

/**
 * Pattern to detect computed() signals (Angular 16+)
 */
export const COMPUTED_SIGNAL_PATTERN = /computed\s*\(\s*\(\)\s*=>\s*([\s\S]*?)\s*\)/g;

/**
 * Pattern to detect effect() signals (Angular 16+)
 */
export const EFFECT_PATTERN = /effect\s*\(\s*\(\)\s*=>\s*([\s\S]*?)\s*\)/;

/**
 * Pattern to detect input() signals (Angular 16+)
 */
export const INPUT_SIGNAL_PATTERN = /input\s*<([\w<>]+)>\s*\(/g;

/**
 * Pattern to detect output() signals (Angular 16+)
 */
export const OUTPUT_SIGNAL_PATTERN = /output\s*<([\w<>]+)>\s*\(/g;

// ============================================================================
// ANGULAR 16+ ADDITIONAL HELPERS
// ============================================================================

/**
 * Check if signals are used (Angular 16+)
 */
export function usesSignals(content: string): boolean {
    const signalImports = /import\s*\{[^}]*\b(?:signal|computed|effect)\b[^}]*\}\s*from\s*['"]@angular\/core['"]/.test(content);
    const signalUsage = SIGNAL_PATTERN.test(content);
    const computedUsage = COMPUTED_SIGNAL_PATTERN.test(content);
    const inputUsage = INPUT_SIGNAL_PATTERN.test(content);
    const outputUsage = OUTPUT_SIGNAL_PATTERN.test(content);
    
    return signalImports || signalUsage || computedUsage || inputUsage || outputUsage;
}

/**
 * Check if new input() signal syntax is used (Angular 17.1+)
 */
export function usesInputSignals(content: string): boolean {
    return INPUT_SIGNAL_PATTERN.test(content);
}

/**
 * Check if new output() signal syntax is used (Angular 17.1+)
 */
export function usesOutputSignals(content: string): boolean {
    return OUTPUT_SIGNAL_PATTERN.test(content);
}

// ============================================================================
// ANGULAR 17+ PATTERNS (New Control Flow)
// ============================================================================

/**
 * Pattern to detect @if control flow (Angular 17+)
 */
export const CONTROL_FLOW_IF_PATTERN = /@if\s*\(/g;

/**
 * Pattern to detect @for control flow (Angular 17+)
 */
export const CONTROL_FLOW_FOR_PATTERN = /@for\s*\(/g;

/**
 * Pattern to detect @switch control flow (Angular 17+)
 */
export const CONTROL_FLOW_SWITCH_PATTERN = /@switch\s*\(/g;

/**
 * Pattern to detect @defer control flow (Angular 17+)
 */
export const DEFER_PATTERN = /@defer\s*\{/g;

/**
 * Pattern to detect new template syntax
 */
export const NEW_TEMPLATE_PATTERN = /@\w+\s*\(/g;

// ============================================================================
// ANGULAR 17+ ADDITIONAL HELPERS
// ============================================================================

/**
 * Check if new control flow syntax is used (Angular 17+)
 */
export function usesNewControlFlow(content: string): boolean {
    const hasNewIf = CONTROL_FLOW_IF_PATTERN.test(content);
    const hasNewFor = CONTROL_FLOW_FOR_PATTERN.test(content);
    const hasNewSwitch = CONTROL_FLOW_SWITCH_PATTERN.test(content);
    const hasDefer = DEFER_PATTERN.test(content);
    
    return hasNewIf || hasNewFor || hasNewSwitch || hasDefer;
}

// ============================================================================
// ANGULAR 15+ PATTERNS (Functional Guards and Interceptors)
// ============================================================================

/**
 * Pattern for functional guard definition (Angular 15+)
 */
export const FUNCTIONAL_GUARD_PATTERN = /export\s+(?:const|function)\s+(\w+Guard)\s*=\s*\(\s*[^)]*\s*\)\s*=>\s*(CanActivateFn|CanDeactivateFn|CanActivateChildFn|CanLoadFn|CanMatchFn)/;

/**
 * Pattern for functional interceptor (Angular 15+)
 */
export const FUNCTIONAL_INTERCEPTOR_PATTERN = /HttpInterceptorFn/;

// ============================================================================
// VERSION DETECTION HELPERS
// ============================================================================

/**
 * Detect the minimum Angular version required based on code patterns
 */
export function detectMinAngularVersion(content: string): number {
    let minVersion = 7;
    
    if (isStandaloneComponent(content) || usesInjectFunction(content)) minVersion = 14;
    if (usesFunctionalGuards(content) || FUNCTIONAL_INTERCEPTOR_PATTERN.test(content)) minVersion = 15;
    if (usesSignals(content)) minVersion = 16;
    if (usesNewControlFlow(content)) minVersion = 17;
    
    return minVersion;
}

/**
 * Get Angular version description
 */
export function getAngularVersionDescription(version: number): string {
    const descriptions: Record<number, string> = {
        7: 'Angular 7 (CLI prompts, drag and drop)',
        8: 'Angular 8 (Ivy preview, differential loading)',
        9: 'Angular 9 (Ivy by default)',
        10: 'Angular 10 (New date range picker)',
        11: 'Angular 11 (Hot Module Replacement)',
        12: 'Angular 12 (Ivy everywhere)',
        13: 'Angular 13 (View Engine removal)',
        14: 'Angular 14 (Standalone components, typed forms)',
        15: 'Angular 15 (Functional guards, stable standalone)',
        16: 'Angular 16 (Signals, hydration)',
        17: 'Angular 17 (New control flow, hydration improvements)',
        18: 'Angular 18 (Zoneless change detection)',
        19: 'Angular 19 (Angular for the Web)',
        20: 'Angular 20 (Latest features)'
    };
    return descriptions[version] || `Angular ${version}+`;
}