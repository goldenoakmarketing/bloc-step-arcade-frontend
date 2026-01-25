import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params
  const filePath = pathSegments.join('/')

  // Only serve specific allowed files
  const allowedFiles = ['farcaster.json']

  if (!allowedFiles.includes(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const fullPath = path.join(process.cwd(), 'public', '.well-known', filePath)
    const content = fs.readFileSync(fullPath, 'utf-8')

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
