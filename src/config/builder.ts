import { Attribution } from 'ox/erc8021'

/**
 * Base Builder Code for bloc step arcade
 * Used for onchain activity attribution and potential rewards
 * @see https://docs.base.org/base-chain/quickstart/builder-codes
 */
export const BUILDER_CODE = 'bc_pirbmczk'

/**
 * Encoded data suffix for transaction attribution
 * Append this to transaction calldata using wagmi's dataSuffix capability
 */
export const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
})
