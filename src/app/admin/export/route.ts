// src/app/admin/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createScoreStore } from '@/helpers/scoreStore';

// Hard-coded credentials for basic auth
const ADMIN_USER = 'admin';
const ADMIN_PASS = '2048export';

function checkAuth(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return false;
    }
    
    try {
        const base64Credentials = authHeader.substring(6);
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');
        
        return username === ADMIN_USER && password === ADMIN_PASS;
    } catch (error) {
        return false;
    }
}

export async function GET(req: NextRequest) {
    // Check authentication
    if (!checkAuth(req)) {
        return new NextResponse('Unauthorized', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Restricted"'
            }
        });
    }

    try {
        const store = createScoreStore();
        const csvData = await store.exportCSV();
        
        return new NextResponse(csvData, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="scores.csv"'
            }
        });
    } catch (error) {
        console.error('Error exporting scores:', error);
        return NextResponse.json(
            { error: 'Failed to export scores' },
            { status: 500 }
        );
    }
}