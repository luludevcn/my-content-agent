import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const dirPath = searchParams.get('path') || '/';

    const resolvedPath = path.resolve(dirPath);

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'Path does not exist' }, { status: 404 });
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: 'Path is not a directory' }, { status: 400 });
    }

    const entries = fs.readdirSync(resolvedPath, { withFileTypes: true });
    const items = entries
      .filter(entry => {
        const name = entry.name;
        return !name.startsWith('.');
      })
      .map(entry => ({
        name: entry.name,
        path: path.join(resolvedPath, entry.name),
        type: entry.isDirectory() ? 'directory' : 'file' as const,
      }))
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      currentPath: resolvedPath,
      items,
    });
  } catch (error) {
    console.error('Browse directory error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}