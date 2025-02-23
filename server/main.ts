import express from 'express';
import cors from 'cors';
import routes from './src/routes';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
