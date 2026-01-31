import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // Usar MONGO_URI_DOCKER si está en contenedor, sino MONGO_URI
    const mongoUri = process.env.MONGO_URI_DOCKER || process.env.MONGO_URI;
    
    const conn = await mongoose.connect(mongoUri as string);
    console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
};