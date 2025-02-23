import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/auth.routes';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
