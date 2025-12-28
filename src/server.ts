import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
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

// Todas las rutas de la API centralizadas
app.use('/api', routes);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔐 API Auth: http://localhost:${PORT}/api/auth`);
  console.log(`📚 API Organizations: http://localhost:${PORT}/api/organizations`);
  console.log(`👥 API Users: http://localhost:${PORT}/api/users`);
  console.log(`🏷️  API Categories: http://localhost:${PORT}/api/categories`);
  console.log(`🎨 API Attributes: http://localhost:${PORT}/api/attributes`);
  console.log(`📦 API LiveItems: http://localhost:${PORT}/api/liveitems`);
  console.log(`👤 API Customers: http://localhost:${PORT}/api/customers`);
  console.log(`🔴 API Livestreams: http://localhost:${PORT}/api/livestreams`);
  console.log(`💰 API Sales: http://localhost:${PORT}/api/sales`);
  console.log(`🛒 API Carts: http://localhost:${PORT}/api/carts`);
  console.log(`📊 API Metrics: http://localhost:${PORT}/api/metrics`);
});