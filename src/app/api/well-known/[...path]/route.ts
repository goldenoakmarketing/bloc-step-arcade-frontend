import { NextRequest, NextResponse } from 'next/server'

// Farcaster Mini App manifest - inline to avoid filesystem issues on serverless
const farcasterManifest = {
  accountAssociation: {
    header: "eyJmaWQiOjE0NDQ1OTgsInR5cGUiOiJhdXRoIiwia2V5IjoiMHg3ZUIzNzMyYTRjNTg0NkU2RDllODhlZEJBMDllNzYwNmQ5NTlkQzhFIn0",
    payload: "eyJkb21haW4iOiJibG9jc3RlcGFyY2FkZS5uZXRsaWZ5LmFwcCJ9",
    signature: "jGRjkpMWPbzXL+Jk7mEeSiPt5mqVy4rsJrFOBflI18cveWZx1b+vX+q5AdTky1HRwckUnJPVuPK3IFnnxuIXoxw="
  },
  miniapp: {
    version: "1",
    name: "BSA",
    homeUrl: "https://blocsteparcade.netlify.app",
    iconUrl: "https://lirp.cdn-website.com/05350d13/dms3rep/multi/opt/BLOC-1920w.jpg",
    imageUrl: "https://lirp.cdn-website.com/05350d13/dms3rep/multi/opt/BLOC-1920w.jpg",
    buttonTitle: "Play Now",
    splashImageUrl: "https://raw.githubusercontent.com/goldenoakmarketing/bloc-step-arcade-frontend/main/public/arcade-cabinet.jpg",
    splashBackgroundColor: "#000000",
    subtitle: "Web3 arcade on Base",
    description: "Play games, earn rewards, and stake BLOC tokens. The arcade where everyone wins.",
    primaryCategory: "games",
    tags: ["arcade", "games", "base", "web3", "rewards"],
    requiredChains: ["eip155:8453"],
    requiredCapabilities: [
      "wallet.getEthereumProvider"
    ]
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params
  const filePath = pathSegments.join('/')

  // Only serve farcaster.json
  if (filePath !== 'farcaster.json') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(farcasterManifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300', // 5 minute cache
    },
  })
}
