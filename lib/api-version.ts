/**
 * API Versioning Strategy
 *
 * This module provides utilities for API versioning to ensure backward compatibility
 * and smooth transitions between API versions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiErrors } from './errors'

export type ApiVersion = 'v1'

export const CURRENT_VERSION: ApiVersion = 'v1'
export const SUPPORTED_VERSIONS: ApiVersion[] = ['v1']

/**
 * Extract API version from request
 * Supports version in:
 * 1. URL path: /api/v1/users
 * 2. Header: X-API-Version: v1
 * 3. Query parameter: ?version=v1
 */
export function getApiVersion(request: NextRequest): ApiVersion {
  // Try URL path first
  const pathMatch = request.nextUrl.pathname.match(/^\/api\/(v\d+)\//)
  if (pathMatch && pathMatch[1]) {
    const version = pathMatch[1] as ApiVersion
    if (SUPPORTED_VERSIONS.includes(version)) {
      return version
    }
  }

  // Try header
  const headerVersion = request.headers.get('X-API-Version') as ApiVersion
  if (headerVersion && SUPPORTED_VERSIONS.includes(headerVersion)) {
    return headerVersion
  }

  // Try query parameter
  const queryVersion = request.nextUrl.searchParams.get('version') as ApiVersion
  if (queryVersion && SUPPORTED_VERSIONS.includes(queryVersion)) {
    return queryVersion
  }

  // Default to current version
  return CURRENT_VERSION
}

/**
 * Validate API version
 */
export function validateApiVersion(version: string): version is ApiVersion {
  return SUPPORTED_VERSIONS.includes(version as ApiVersion)
}

/**
 * Check if API version is supported
 */
export function isVersionSupported(version: ApiVersion): boolean {
  return SUPPORTED_VERSIONS.includes(version)
}

/**
 * Middleware to enforce API versioning
 */
export function withApiVersion(
  handler: (request: NextRequest, version: ApiVersion) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const version = getApiVersion(request)

    if (!isVersionSupported(version)) {
      throw ApiErrors.badRequest(`API version ${version} is not supported`, {
        supportedVersions: SUPPORTED_VERSIONS,
        currentVersion: CURRENT_VERSION,
      })
    }

    // Add version to response headers
    const response = await handler(request, version)
    response.headers.set('X-API-Version', version)
    response.headers.set('X-Supported-Versions', SUPPORTED_VERSIONS.join(', '))

    return response
  }
}

/**
 * Create versioned API path
 */
export function versionedPath(path: string, version: ApiVersion = CURRENT_VERSION): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  // Remove /api/ prefix if present
  const withoutApi = cleanPath.startsWith('api/') ? cleanPath.slice(4) : cleanPath
  // Remove version if already present
  const withoutVersion = withoutApi.replace(/^v\d+\//, '')

  return `/api/${version}/${withoutVersion}`
}

/**
 * API deprecation notice
 */
export interface DeprecationNotice {
  version: ApiVersion
  deprecatedAt: string
  sunsetAt?: string
  replacementVersion?: ApiVersion
  message?: string
}

/**
 * Add deprecation headers to response
 */
export function addDeprecationHeaders(
  response: NextResponse,
  notice: DeprecationNotice
): NextResponse {
  response.headers.set('Deprecation', 'true')
  response.headers.set('Deprecated-At', notice.deprecatedAt)

  if (notice.sunsetAt) {
    response.headers.set('Sunset', notice.sunsetAt)
  }

  if (notice.replacementVersion) {
    response.headers.set('Replacement-Version', notice.replacementVersion)
  }

  if (notice.message) {
    response.headers.set('Deprecation-Message', notice.message)
  }

  return response
}
