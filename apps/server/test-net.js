import net from 'net';

const client = net.createConnection({ port: 5432, host: 'localhost' }, () => {
    console.log('✅ Connected to PostgreSQL!');
    client.end();
});

client.on('error', (err) => {
    console.error('❌ Connection failed:', err.message);
});