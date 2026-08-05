import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/crdt/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/**/demo.ts'],
        },
    },
});