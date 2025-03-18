import { ScullyConfig } from '@scullyio/scully';

export const config: ScullyConfig = {
    projectRoot: "./src",
    projectName: "frontend",
    distFolder: "./dist/frontend/browser",
    outDir: './dist/static',
    routes: {
        '/home': {
            type: 'default'
        },
        '/404': {
            type: 'default'
        },
        '**': {
            type: 'default'
        }
    },
    extraRoutes: [
        '/books',
        '/summaries',
        '/profile',
        '/mylist',
        '/admin',
        '/auth/login',
        '/auth/register',
        '/summary-item'
      ]
};
