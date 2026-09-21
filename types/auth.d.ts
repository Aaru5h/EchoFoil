import 'next-auth';
declare module 'next-auth' {interface Session {authVersion:number;authTime:number;}}
