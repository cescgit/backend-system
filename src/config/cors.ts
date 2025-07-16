import cors from 'cors';

const whiteList = [
  process.env.FRONTEND_URL,
];

export const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {

    if (!origin || whiteList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
