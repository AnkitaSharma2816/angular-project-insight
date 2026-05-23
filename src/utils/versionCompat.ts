/**
 * Angular Version Compatibility System
 * Supports Angular 7 through Angular 21
 * Provides version-specific patterns, rules, and feature detection
 */

/**
 * Angular version ranges and their features
 */
export const ANGULAR_VERSIONS = {
    // Angular 7-11: Module-based only
    'v7': { majorVersion: 7, standalone: false, modernRouting: false, signals: false, newControlFlow: false },
    'v8': { majorVersion: 8, standalone: false, modernRouting: false, signals: false, newControlFlow: false },
    'v9': { majorVersion: 9, standalone: false, modernRouting: false, signals: false, newControlFlow: false },
    'v10': { majorVersion: 10, standalone: false, modernRouting: false, signals: false, newControlFlow: false },
    'v11': { majorVersion: 11, standalone: false, modernRouting: false, signals: false, newControlFlow: false },

    // Angular 12-13: Experimental standalone
    'v12': { majorVersion: 12, standalone: false, modernRouting: false, signals: false, newControlFlow: false },
    'v13': { majorVersion: 13, standalone: false, modernRouting: false, signals: false, newControlFlow: false },

    // Angular 14: Standalone becomes stable
    'v14': { majorVersion: 14, standalone: true, modernRouting: true, signals: false, newControlFlow: false },
    'v15': { majorVersion: 15, standalone: true, modernRouting: true, signals: false, newControlFlow: false },

    // Angular 16: Signals introduced
    'v16': { majorVersion: 16, standalone: true, modernRouting: true, signals: true, newControlFlow: false },

    // Angular 17: New control flow, typed forms
    'v17': { majorVersion: 17, standalone: true, modernRouting: true, signals: true, newControlFlow: true },

    // Angular 18+: Enhanced signals, new features
    'v18': { majorVersion: 18, standalone: true, modernRouting: true, signals: true, newControlFlow: true },
    'v19': { majorVersion: 19, standalone: true, modernRouting: true, signals: true, newControlFlow: true },
    'v20': { majorVersion: 20, standalone: true, modernRouting: true, signals: true, newControlFlow: true },
    'v21': { majorVersion: 21, standalone: true, modernRouting: true, signals: true, newControlFlow: true },
};

export interface VersionFeatures {
    majorVersion: number;
    standalone: boolean;              // Angular 14+
    modernRouting: boolean;           // Angular 14+
    signals: boolean;                 // Angular 16+
    newControlFlow: boolean;          // Angular 17+
}

/**
 * Parse Angular version string and return version info
 * @param versionString e.g., 'v15.2.0', '14.1.0', '15.0.0'
 * @returns VersionFeatures or null if unable to parse
 */
export function parseAngularVersion(versionString: string): VersionFeatures | null {
    if (!versionString) return null;

    // Clean version string
    let clean = versionString.replace(/^v/, '').trim();
    const majorMatch = clean.match(/^(\d+)/);
    if (!majorMatch) return null;

    const majorVersion = parseInt(majorMatch[1], 10);

    // Map version to features
    if (majorVersion < 7) {
        console.warn(`⚠️  Angular version ${majorVersion} is not supported (requires Angular 7+)`);
        return null;
    }

    if (majorVersion >= 7 && majorVersion <= 11) {
        return {
            majorVersion,
            standalone: false,
            modernRouting: false,
            signals: false,
            newControlFlow: false,
        };
    }

    if (majorVersion === 12 || majorVersion === 13) {
        return {
            majorVersion,
            standalone: false,
            modernRouting: false,
            signals: false,
            newControlFlow: false,
        };
    }

    if (majorVersion === 14 || majorVersion === 15) {
        return {
            majorVersion,
            standalone: true,
            modernRouting: true,
            signals: false,
            newControlFlow: false,
        };
    }

    if (majorVersion === 16) {
        return {
            majorVersion,
            standalone: true,
            modernRouting: true,
            signals: true,
            newControlFlow: false,
        };
    }

    // Angular 17+
    return {
        majorVersion,
        standalone: true,
        modernRouting: true,
        signals: true,
        newControlFlow: true,
    };
}

/**
 * Get version description for reports
 */
export function getVersionDescription(features: VersionFeatures): string {
    const parts: string[] = [`Angular ${features.majorVersion}`];

    if (features.majorVersion <= 11) {
        parts.push('(Module-based architecture)');
    } else if (features.majorVersion <= 13) {
        parts.push('(Module-based, experimental standalone)');
    } else if (features.majorVersion === 14 || features.majorVersion === 15) {
        parts.push('(Standalone components, modern routing)');
    } else if (features.majorVersion === 16) {
        parts.push('(Standalone components, signals)');
    } else {
        parts.push('(Standalone components, signals, new control flow)');
    }

    return parts.join(' ');
}

/**
 * Get supported features list for version
 */
export function getSupportedFeatures(features: VersionFeatures): string[] {
    const supported: string[] = [];

    if (features.majorVersion >= 7) {
        supported.push('Services & Dependency Injection');
        supported.push('Module-based Architecture');
        supported.push('Decorators (@Component, @Injectable, etc.)');
        supported.push('Guards & Interceptors');
        supported.push('Routing with RouterModule');
    }

    if (features.majorVersion >= 14) {
        supported.push('Standalone Components');
        supported.push('Modern Routing (provideRouter)');
        supported.push('Functional Guards');
    }

    if (features.majorVersion >= 16) {
        supported.push('Signals');
        supported.push('Signal-based Reactive Programming');
    }

    if (features.majorVersion >= 17) {
        supported.push('New Control Flow (@if, @for, @switch)');
        supported.push('Deferred Loading (@defer)');
        supported.push('New Template Syntax');
    }

    return supported;
}
