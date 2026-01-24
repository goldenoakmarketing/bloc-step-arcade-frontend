/**
 * Feature flags for the application.
 * These can be flipped when features are ready for production.
 */

/**
 * .localpay name server integration
 * When false, all .localpay functionality is disabled:
 * - No API calls to localpay name server
 * - No contract interactions for localpay
 * - UI shows "coming soon" instead of linked account
 * - Mock data uses alternative identity types
 */
export const LOCALPAY_ENABLED = false
