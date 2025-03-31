import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(`mongodb+srv://Lavanya:${process.env.DB_PASS}@cluster0.rjfhw.mongodb.net/AthleteManagement?retryWrites=true&w=majority`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
export default connectDB;