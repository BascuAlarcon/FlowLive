import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import organizationRoutes from './modules/organizations/organizations.routes';
import userRoutes from './modules/users/users.routes';
import { errorHandler } from './middlewares/error-handler.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'FlowLive Backend is running!',
    version: '1.0.0'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users', userRoutes);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`� API Auth: http://localhost:${PORT}/api/auth`);
  console.log(`�📚 API Organizations: http://localhost:${PORT}/api/organizations`);
  console.log(`👥 API Users: http://localhost:${PORT}/api/users`);
});