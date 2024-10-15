import 'dotenv/config';

export default {
  expo: {
    // ... other config
    extra: {
      GROQ_API_KEY: process.env.GROQ_API_KEY,
    },
  },
};
