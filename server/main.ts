import express from 'express';
import cors from 'cors';
import routes from './src/routes';
import cookieParser from 'cookie-parser';

const CORS_ALLOWED_ORIGIN = process.env.CORS_ORIGIN;

const corsOptions: cors.CorsOptions = {
  origin: CORS_ALLOWED_ORIGIN,
};

const app = express();

app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

app.use('/api', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
